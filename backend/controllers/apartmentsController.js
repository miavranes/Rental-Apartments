const pool = require('../config/db');

const getApartments = async (req, res) => {
  const { location, min_price, max_price, guests, check_in, check_out } = req.query;

  try {
    let query = `
      SELECT a.*, ar.avg_rating, ar.review_count
      FROM apartments a
      LEFT JOIN apartment_ratings ar ON ar.apartment_id = a.id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;

    if (location) {
      query += ` AND LOWER(a.location) LIKE LOWER($${i++})`;
      params.push(`%${location}%`);
    }
    if (min_price) {
      query += ` AND a.price_per_night >= $${i++}`;
      params.push(min_price);
    }
    if (max_price) {
      query += ` AND a.price_per_night <= $${i++}`;
      params.push(max_price);
    }
    if (guests) {
      query += ` AND a.max_guests >= $${i++}`;
      params.push(guests);
    }
    if (check_in && check_out) {
      query += `
        AND NOT EXISTS (
          SELECT 1 FROM blocked_dates bd
          WHERE bd.apartment_id = a.id
            AND bd.date >= $${i++}
            AND bd.date < $${i++}
        )
      `;
      params.push(check_in, check_out);
    }

    query += ` ORDER BY a.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getApartment = async (req, res) => {
  const { id } = req.params;

  try {
    const apartment = await pool.query(`
      SELECT a.*, ar.avg_rating, ar.review_count
      FROM apartments a
      LEFT JOIN apartment_ratings ar ON ar.apartment_id = a.id
      WHERE a.id = $1
    `, [id]);

    if (apartment.rows.length === 0) {
      return res.status(404).json({ error: 'Smještaj nije pronađen.' });
    }

    const images = await pool.query(
      'SELECT * FROM apartment_images WHERE apartment_id = $1 ORDER BY sort_order',
      [id]
    );

    const amenities = await pool.query(`
      SELECT am.id, am.name, am.icon
      FROM amenities am
      JOIN apartment_amenities aa ON aa.amenity_id = am.id
      WHERE aa.apartment_id = $1
    `, [id]);

    res.json({
      ...apartment.rows[0],
      images: images.rows,
      amenities: amenities.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const createApartment = async (req, res) => {
  const { title, description, location, address, max_guests, bedrooms, beds, price_per_night, amenity_ids } = req.body;

  try {
    const result = await pool.query(`
      INSERT INTO apartments (owner_id, title, description, location, address, max_guests, bedrooms, beds, price_per_night)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [req.user.id, title, description, location, address, max_guests, bedrooms, beds, price_per_night]);

    const apartment = result.rows[0];

    if (amenity_ids && amenity_ids.length > 0) {
      const amenityValues = amenity_ids.map((aid) => `(${apartment.id}, ${aid})`).join(', ');
      await pool.query(`INSERT INTO apartment_amenities (apartment_id, amenity_id) VALUES ${amenityValues}`);
    }

    res.status(201).json(apartment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateApartment = async (req, res) => {
  const { id } = req.params;
  const { title, description, location, address, max_guests, bedrooms, beds, price_per_night } = req.body;

  try {
    const check = await pool.query('SELECT owner_id FROM apartments WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Smještaj nije pronađen.' });
    if (check.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Nemate pristup.' });

    const result = await pool.query(`
      UPDATE apartments
      SET title=$1, description=$2, location=$3, address=$4,
          max_guests=$5, bedrooms=$6, beds=$7, price_per_night=$8
      WHERE id=$9
      RETURNING *
    `, [title, description, location, address, max_guests, bedrooms, beds, price_per_night, id]);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteApartment = async (req, res) => {
  const { id } = req.params;

  try {
    const check = await pool.query('SELECT owner_id FROM apartments WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Smještaj nije pronađen.' });
    if (check.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Nemate pristup.' });

    await pool.query('DELETE FROM apartments WHERE id = $1', [id]);
    res.json({ message: 'Smještaj obrisan.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getApartments, getApartment, createApartment, updateApartment, deleteApartment };