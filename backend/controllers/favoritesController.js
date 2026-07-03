const pool = require('../config/db');

const getFavorites = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, ar.avg_rating, ar.review_count, f.created_at AS favorited_at,
        (
          SELECT json_agg(jsonb_build_object('id', ai.id, 'image_url', ai.image_url) ORDER BY ai.sort_order)
          FROM apartment_images ai WHERE ai.apartment_id = a.id
        ) AS images,
        COALESCE((
          SELECT json_agg(jsonb_build_object('id', am.id, 'name', am.name, 'icon', am.icon))
          FROM amenities am
          JOIN apartment_amenities aa ON aa.amenity_id = am.id
          WHERE aa.apartment_id = a.id
        ), '[]'::json) AS amenities
      FROM favorites f
      JOIN apartments a ON a.id = f.apartment_id
      LEFT JOIN apartment_ratings ar ON ar.apartment_id = a.id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addFavorite = async (req, res) => {
  const { apartmentId } = req.params;
  try {
    const apt = await pool.query('SELECT id FROM apartments WHERE id = $1', [apartmentId]);
    if (apt.rows.length === 0) return res.status(404).json({ error: 'Apartment not found.' });

    await pool.query(
      'INSERT INTO favorites (user_id, apartment_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, apartmentId]
    );
    res.status(201).json({ apartment_id: Number(apartmentId), favorited: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const removeFavorite = async (req, res) => {
  const { apartmentId } = req.params;
  try {
    await pool.query('DELETE FROM favorites WHERE user_id = $1 AND apartment_id = $2', [req.user.id, apartmentId]);
    res.json({ apartment_id: Number(apartmentId), favorited: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getFavoriteIds = async (req, res) => {
  try {
    const result = await pool.query('SELECT apartment_id FROM favorites WHERE user_id = $1', [req.user.id]);
    res.json(result.rows.map(r => r.apartment_id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getFavorites, addFavorite, removeFavorite, getFavoriteIds };
