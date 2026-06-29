const pool = require('../config/db');

// Legacy DB icon values that should match frontend filter keys
const ICON_LOOKUP = {
  'washing-machine': ['washing-machine', 'washer', 'washing_machine'],
  'paw-print': ['paw-print', 'pets', 'pet-friendly', 'pet_friendly'],
  snowflake: ['snowflake', 'ac', 'air-conditioning', 'air_conditioning'],
  car: ['car', 'parking'],
  wifi: ['wifi', 'WiFi', 'wi-fi', 'WIFI'],
};

const findAmenityId = async (key) => {
  const candidates = ICON_LOOKUP[key] || [key];
  for (const icon of candidates) {
    const am = await pool.query('SELECT id FROM amenities WHERE icon = $1', [icon]);
    if (am.rows.length > 0) return am.rows[0].id;
  }
  return null;
};

const linkAmenities = async (apartmentId, amenityKeys) => {
  for (const key of amenityKeys) {
    const amenityId = await findAmenityId(key);
    if (amenityId) {
      await pool.query(
        'INSERT INTO apartment_amenities (apartment_id, amenity_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [apartmentId, amenityId]
      );
    }
  }
};

const getApartments = async (req, res) => {
  const { location, country, min_price, max_price, guests, check_in, check_out, amenities } = req.query;

  try {
    let query = `
      SELECT a.*, ar.avg_rating, ar.review_count,
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
      FROM apartments a
      LEFT JOIN apartment_ratings ar ON ar.apartment_id = a.id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;

    if (location) {
      query += ` AND (
        LOWER(a.location) LIKE LOWER($${i})
        OR LOWER(COALESCE(a.municipality, '')) LIKE LOWER($${i})
        OR LOWER(COALESCE(a.country, '')) LIKE LOWER($${i})
      )`;
      params.push(`%${location}%`);
      i++;
    }
    if (country) {
      query += ` AND LOWER(COALESCE(a.country, '')) LIKE LOWER($${i++})`;
      params.push(`%${country}%`);
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
    if (amenities) {
      const keys = amenities.split(',').map(k => k.trim()).filter(Boolean);
      for (const key of keys) {
        const icons = ICON_LOOKUP[key] || [key];
        query += `
          AND EXISTS (
            SELECT 1 FROM apartment_amenities aa
            JOIN amenities am ON am.id = aa.amenity_id
            WHERE aa.apartment_id = a.id AND am.icon = ANY($${i++})
          )
        `;
        params.push(icons);
      }
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
  const { title, description, location, municipality, country, address, max_guests, bedrooms, beds, price_per_night, amenities, lat, lng } = req.body;

  try {
    const result = await pool.query(`
      INSERT INTO apartments (owner_id, title, description, location, municipality, country, address, max_guests, bedrooms, beds, price_per_night, lat, lng)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [req.user.id, title, description, location, municipality || null, country || null, address, max_guests, bedrooms, beds, price_per_night, lat || null, lng || null]);

    const apartment = result.rows[0];

    // Save uploaded images
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        await pool.query(
          'INSERT INTO apartment_images (apartment_id, image_url, sort_order, is_primary) VALUES ($1, $2, $3, $4)',
          [apartment.id, req.files[i].filename, i, i === 0]
        );
      }
    }

    if (amenities) {
      const amenityKeys = JSON.parse(amenities);
      await linkAmenities(apartment.id, amenityKeys);
    }

    res.status(201).json(apartment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateApartment = async (req, res) => {
  const { id } = req.params;
  const { title, description, location, municipality, country, address, max_guests, bedrooms, beds, price_per_night, amenities, lat, lng } = req.body;

  try {
    const check = await pool.query('SELECT owner_id FROM apartments WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Smještaj nije pronađen.' });
    if (check.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Nemate pristup.' });

    const result = await pool.query(`
      UPDATE apartments
      SET title=$1, description=$2, location=$3, municipality=$4, country=$5, address=$6,
          max_guests=$7, bedrooms=$8, beds=$9, price_per_night=$10,
          lat=$11, lng=$12
      WHERE id=$13
      RETURNING *
    `, [title, description, location, municipality || null, country || null, address, max_guests, bedrooms, beds, price_per_night, lat || null, lng || null, id]);

    // Append new images (don't delete existing ones - managed separately)
    if (req.files && req.files.length > 0) {
      const lastSort = await pool.query(
        'SELECT COALESCE(MAX(sort_order), -1) AS max FROM apartment_images WHERE apartment_id = $1', [id]
      );
      let nextSort = lastSort.rows[0].max + 1;
      const hasImages = nextSort > 0;
      for (let i = 0; i < req.files.length; i++) {
        await pool.query(
          'INSERT INTO apartment_images (apartment_id, image_url, sort_order, is_primary) VALUES ($1, $2, $3, $4)',
          [id, req.files[i].filename, nextSort + i, !hasImages && i === 0]
        );
      }
    }

    if (amenities !== undefined && amenities !== null) {
      await pool.query('DELETE FROM apartment_amenities WHERE apartment_id = $1', [id]);
      const amenityKeys = JSON.parse(amenities);
      await linkAmenities(id, amenityKeys);
    }

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

const deleteImage = async (req, res) => {
  const { id, imageId } = req.params;
  try {
    const check = await pool.query('SELECT owner_id FROM apartments WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Apartment not found.' });
    if (check.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Access denied.' });

    const img = await pool.query('SELECT * FROM apartment_images WHERE id = $1 AND apartment_id = $2', [imageId, id]);
    if (img.rows.length === 0) return res.status(404).json({ error: 'Image not found.' });

    await pool.query('DELETE FROM apartment_images WHERE id = $1', [imageId]);

    // If deleted image was primary, promote next one
    await pool.query(`
      UPDATE apartment_images SET is_primary = true
      WHERE apartment_id = $1 AND id = (
        SELECT id FROM apartment_images WHERE apartment_id = $1 ORDER BY sort_order LIMIT 1
      )
    `, [id]);

    res.json({ message: 'Image deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMyApartments = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, 
        COALESCE(AVG(r.rating), 0) AS avg_rating,
        COUNT(r.id) AS review_count,
        json_agg(DISTINCT jsonb_build_object('id', ai.id, 'image_url', ai.image_url)) 
          FILTER (WHERE ai.id IS NOT NULL) AS images,
        COALESCE((
          SELECT json_agg(jsonb_build_object('id', am.id, 'name', am.name, 'icon', am.icon))
          FROM amenities am
          JOIN apartment_amenities aa ON aa.amenity_id = am.id
          WHERE aa.apartment_id = a.id
        ), '[]'::json) AS amenities
       FROM apartments a
       LEFT JOIN reviews r ON r.apartment_id = a.id
       LEFT JOIN apartment_images ai ON ai.apartment_id = a.id
       WHERE a.owner_id = $1
       GROUP BY a.id
       ORDER BY a.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getApartments, getApartment, createApartment, updateApartment, deleteApartment, getMyApartments, deleteImage };