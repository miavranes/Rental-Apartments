const pool = require('../config/db');

const getReviews = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT r.*, u.name AS guest_name, u.profile_image
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.apartment_id = $1
      ORDER BY r.created_at DESC
    `, [id]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createReview = async (req, res) => {
  const { apartment_id, reservation_id, rating, comment } = req.body;

  try {
    const resCheck = await pool.query(
      'SELECT * FROM reservations WHERE id = $1 AND user_id = $2',
      [reservation_id, req.user.id]
    );

    if (resCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Rezervacija nije pronađena ili nije vaša.' });
    }

    const reservation = resCheck.rows[0];

    if (reservation.status !== 'completed') {
      return res.status(400).json({ error: 'Možete ostaviti recenziju samo nakon završenog boravka.' });
    }

    const existing = await pool.query(
      'SELECT id FROM reviews WHERE reservation_id = $1',
      [reservation_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Već ste ostavili recenziju za ovaj boravak.' });
    }

    const result = await pool.query(`
      INSERT INTO reviews (apartment_id, user_id, reservation_id, rating, comment)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [apartment_id, req.user.id, reservation_id, rating, comment]);

    await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY apartment_ratings');

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getReviews, createReview };