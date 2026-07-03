const pool = require('../config/db');

const getOwnerAnalytics = async (req, res) => {
  try {
    const [summary, listings, monthly] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(DISTINCT a.id)::int AS listings,
          COUNT(r.id)::int AS reservations,
          COALESCE(SUM(CASE WHEN r.status <> 'cancelled' THEN r.total_price ELSE 0 END), 0)::numeric AS revenue,
          COALESCE(AVG(ar.avg_rating), 0)::numeric AS avg_rating,
          COALESCE(SUM(CASE WHEN r.status = 'pending' THEN 1 ELSE 0 END), 0)::int AS pending,
          COALESCE(SUM(CASE WHEN r.status = 'confirmed' THEN 1 ELSE 0 END), 0)::int AS confirmed,
          COALESCE(SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END), 0)::int AS completed,
          COALESCE(SUM(CASE WHEN r.status = 'cancelled' THEN 1 ELSE 0 END), 0)::int AS cancelled
        FROM apartments a
        LEFT JOIN reservations r ON r.apartment_id = a.id
        LEFT JOIN apartment_ratings ar ON ar.apartment_id = a.id
        WHERE a.owner_id = $1
      `, [req.user.id]),
      pool.query(`
        SELECT a.id, a.title,
          COUNT(r.id)::int AS reservations,
          COALESCE(SUM(CASE WHEN r.status <> 'cancelled' THEN r.total_price ELSE 0 END), 0)::numeric AS revenue,
          COALESCE(ar.avg_rating, 0)::numeric AS avg_rating,
          COALESCE(ar.review_count, 0)::int AS review_count,
          COUNT(f.apartment_id)::int AS favorites
        FROM apartments a
        LEFT JOIN reservations r ON r.apartment_id = a.id
        LEFT JOIN apartment_ratings ar ON ar.apartment_id = a.id
        LEFT JOIN favorites f ON f.apartment_id = a.id
        WHERE a.owner_id = $1
        GROUP BY a.id, ar.avg_rating, ar.review_count
        ORDER BY revenue DESC, reservations DESC
      `, [req.user.id]),
      pool.query(`
        SELECT TO_CHAR(date_trunc('month', r.created_at), 'YYYY-MM') AS month,
          COUNT(r.id)::int AS reservations,
          COALESCE(SUM(CASE WHEN r.status <> 'cancelled' THEN r.total_price ELSE 0 END), 0)::numeric AS revenue
        FROM reservations r
        JOIN apartments a ON a.id = r.apartment_id
        WHERE a.owner_id = $1
          AND r.created_at >= NOW() - INTERVAL '6 months'
        GROUP BY date_trunc('month', r.created_at)
        ORDER BY month
      `, [req.user.id]),
    ]);

    res.json({
      summary: summary.rows[0],
      listings: listings.rows,
      monthly: monthly.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getOwnerAnalytics };
