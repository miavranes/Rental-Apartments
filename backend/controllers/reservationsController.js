const { serverError } = require('../utils/errors');
const pool = require('../config/db');
const { sendReservationEmailToGuest, sendReservationEmailToOwner } = require('../utils/sendEmail');

const createReservation = async (req, res) => {
  // The payment method is decided by the host on the listing itself, not by
  // the guest at booking time — any payment_method sent by the client is
  // ignored in favor of apartments.payment_method below.
  const { apartment_id, check_in, check_out, guests } = req.body;

  // Everything below runs on a single dedicated client so we can use a
  // transaction + advisory lock: this closes the race window where two
  // guests could both pass the "dates free?" check for the same apartment
  // at the same time and end up double-booked.
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Serialize all booking attempts for this specific apartment. The lock
    // is automatically released when the transaction ends (COMMIT/ROLLBACK).
    await client.query('SELECT pg_advisory_xact_lock($1)', [apartment_id]);

    const aptResult = await client.query(
      `SELECT a.*, u.email AS owner_email, u.name AS owner_name
       FROM apartments a JOIN users u ON u.id = a.owner_id
       WHERE a.id = $1`,
      [apartment_id]
    );

    if (aptResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Apartment not found.' });
    }

    const apt = aptResult.rows[0];
    const payment_method = apt.payment_method || 'on_arrival';

    if (apt.owner_id === req.user.id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'You cannot book your own listing.' });
    }

    if (guests > apt.max_guests) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Maximum guests allowed: ${apt.max_guests}.` });
    }

    const nights = Math.ceil(
      (new Date(check_out) - new Date(check_in)) / (1000 * 60 * 60 * 24)
    );

    if (nights <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid dates.' });
    }

    // Check for conflicts with existing confirmed/pending reservations.
    // Safe now: no other request can be checking/inserting for this
    // apartment_id concurrently thanks to the advisory lock above.
    const conflict = await client.query(
      `SELECT id FROM reservations
       WHERE apartment_id = $1
         AND status IN ('pending', 'confirmed')
         AND check_in < $3 AND check_out > $2`,
      [apartment_id, check_in, check_out]
    );

    if (conflict.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'These dates are already booked.' });
    }

    const total_price = (apt.price_per_night * nights).toFixed(2);

    const result = await client.query(`
      INSERT INTO reservations (apartment_id, user_id, check_in, check_out, guests, total_price, payment_method)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [apartment_id, req.user.id, check_in, check_out, guests, total_price, payment_method]);

    const reservation = result.rows[0];

    // Auto-block all dates in the range
    const start = new Date(check_in);
    const end   = new Date(check_out);
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      await client.query(
        'INSERT INTO blocked_dates (apartment_id, date) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [apartment_id, dateStr]
      );
    }

    const guestResult = await client.query('SELECT name, email FROM users WHERE id = $1', [req.user.id]);
    const guest = guestResult.rows[0];

    await client.query('COMMIT');

    // Emails are sent after commit — a slow/failed email must never roll
    // back an otherwise-successful booking.
    const emailData = {
      title: apt.title,
      location: apt.location,
      checkIn: check_in,
      checkOut: check_out,
      guests,
      nights,
      totalPrice: total_price,
      paymentMethod: payment_method,
    };

    try {
      await sendReservationEmailToGuest(guest.email, { guestName: guest.name, ...emailData });
      await sendReservationEmailToOwner(apt.owner_email, { ownerName: apt.owner_name, guestName: guest.name, guestEmail: guest.email, ...emailData });
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
    }

    res.status(201).json(reservation);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    // 23P01 = exclusion_violation (our reservations_no_overlap DB constraint)
    if (err.code === '23P01') {
      return res.status(409).json({ error: 'These dates are already booked.' });
    }
    serverError(res, err);
  } finally {
    client.release();
  }
};

const getMyReservations = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, a.title, a.location, a.address, a.price_per_night, a.owner_id,
             i.image_url AS primary_image
      FROM reservations r
      JOIN apartments a ON a.id = r.apartment_id
      LEFT JOIN apartment_images i ON i.apartment_id = a.id AND i.is_primary = TRUE
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (err) {
    serverError(res, err);
  }
};

const getOwnerReservations = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, a.title, a.location, a.id AS apartment_id,
             u.name AS guest_name, u.email AS guest_email, u.phone AS guest_phone
      FROM reservations r
      JOIN apartments a ON a.id = r.apartment_id
      JOIN users u ON u.id = r.user_id
      WHERE a.owner_id = $1
      ORDER BY r.created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (err) {
    serverError(res, err);
  }
};

const confirmReservation = async (req, res) => {
  const { id } = req.params;

  try {
    const check = await pool.query(`
      SELECT r.*, a.owner_id FROM reservations r
      JOIN apartments a ON a.id = r.apartment_id
      WHERE r.id = $1
    `, [id]);

    if (check.rows.length === 0) return res.status(404).json({ error: 'Reservation not found.' });
    if (check.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Access denied.' });
    if (check.rows[0].status !== 'pending') return res.status(400).json({ error: 'Reservation is not pending.' });

    const result = await pool.query(
      'UPDATE reservations SET status = $1 WHERE id = $2 RETURNING *',
      ['confirmed', id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    serverError(res, err);
  }
};

const cancelReservation = async (req, res) => {
  const { id } = req.params;

  try {
    const check = await pool.query(`
      SELECT r.*, a.owner_id FROM reservations r
      JOIN apartments a ON a.id = r.apartment_id
      WHERE r.id = $1
    `, [id]);

    if (check.rows.length === 0) return res.status(404).json({ error: 'Reservation not found.' });

    const reservation = check.rows[0];
    const isOwner = reservation.owner_id === req.user.id;
    const isGuest = reservation.user_id === req.user.id;

    if (!isOwner && !isGuest) return res.status(403).json({ error: 'Access denied.' });
    if (reservation.status === 'cancelled') return res.status(400).json({ error: 'Already cancelled.' });
    if (reservation.status === 'completed') return res.status(400).json({ error: 'Completed reservations cannot be cancelled.' });

    const result = await pool.query(
      'UPDATE reservations SET status = $1 WHERE id = $2 RETURNING *',
      ['cancelled', id]
    );

    // Unblock dates
    const r = result.rows[0];
    const start = new Date(r.check_in);
    const end   = new Date(r.check_out);
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      await pool.query(
        'DELETE FROM blocked_dates WHERE apartment_id = $1 AND date = $2',
        [r.apartment_id, d.toISOString().split('T')[0]]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    serverError(res, err);
  }
};

module.exports = { createReservation, getMyReservations, getOwnerReservations, confirmReservation, cancelReservation };
