const pool = require('../config/db');

const createReservation = async (req, res) => {
  const { apartment_id, check_in, check_out, guests } = req.body;

  try {
    const aptResult = await pool.query(
      'SELECT price_per_night, max_guests FROM apartments WHERE id = $1',
      [apartment_id]
    );

    if (aptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Smještaj nije pronađen.' });
    }

    const { price_per_night, max_guests } = aptResult.rows[0];

    if (guests > max_guests) {
      return res.status(400).json({ error: `Maksimalan broj gostiju je ${max_guests}.` });
    }

    const nights = Math.ceil(
      (new Date(check_out) - new Date(check_in)) / (1000 * 60 * 60 * 24)
    );

    if (nights <= 0) {
      return res.status(400).json({ error: 'Neispravni datumi.' });
    }

    const total_price = (price_per_night * nights).toFixed(2);

    const result = await pool.query(`
      INSERT INTO reservations (apartment_id, user_id, check_in, check_out, guests, total_price)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [apartment_id, req.user.id, check_in, check_out, guests, total_price]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.message.includes('nije dostupan')) {
      return res.status(409).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

const getMyReservations = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, a.title, a.location, a.address, a.price_per_night,
             i.image_url AS primary_image
      FROM reservations r
      JOIN apartments a ON a.id = r.apartment_id
      LEFT JOIN apartment_images i ON i.apartment_id = a.id AND i.is_primary = TRUE
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getOwnerReservations = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, a.title, a.location,
             u.name AS guest_name, u.email AS guest_email, u.phone AS guest_phone
      FROM reservations r
      JOIN apartments a ON a.id = r.apartment_id
      JOIN users u ON u.id = r.user_id
      WHERE a.owner_id = $1
      ORDER BY r.created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
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

    if (check.rows.length === 0) return res.status(404).json({ error: 'Rezervacija nije pronađena.' });
    if (check.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Nemate pristup.' });
    if (check.rows[0].status !== 'pending') return res.status(400).json({ error: 'Rezervacija nije u pending statusu.' });

    const result = await pool.query(
      'UPDATE reservations SET status = $1 WHERE id = $2 RETURNING *',
      ['confirmed', id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
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

    if (check.rows.length === 0) return res.status(404).json({ error: 'Rezervacija nije pronađena.' });

    const reservation = check.rows[0];
    const isOwner = reservation.owner_id === req.user.id;
    const isGuest = reservation.user_id === req.user.id;

    if (!isOwner && !isGuest) return res.status(403).json({ error: 'Nemate pristup.' });
    if (reservation.status === 'cancelled') return res.status(400).json({ error: 'Rezervacija je već otkazana.' });
    if (reservation.status === 'completed') return res.status(400).json({ error: 'Završena rezervacija se ne može otkazati.' });

    const result = await pool.query(
      'UPDATE reservations SET status = $1 WHERE id = $2 RETURNING *',
      ['cancelled', id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createReservation, getMyReservations, getOwnerReservations, confirmReservation, cancelReservation };