const { serverError } = require('../utils/errors');
const pool = require('../config/db');

const getOwnerAnalytics = async (req, res) => {
  try {
    const [summary, listings, monthly, occupancy30] = await Promise.all([
     pool.query(`
        SELECT
          COUNT(DISTINCT a.id)::int AS listings,
          COUNT(r.id)::int AS reservations,
          COALESCE(SUM(CASE WHEN r.status <> 'cancelled' THEN r.total_price ELSE 0 END), 0)::numeric AS revenue,
          COALESCE(AVG(ar.avg_rating), 0)::numeric AS avg_rating,
          COALESCE(SUM(CASE WHEN r.status = 'pending' THEN 1 ELSE 0 END), 0)::int AS pending,
          COALESCE(SUM(CASE WHEN r.status = 'confirmed' THEN 1 ELSE 0 END), 0)::int AS confirmed,
          COALESCE(SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END), 0)::int AS completed,
          COALESCE(SUM(CASE WHEN r.status = 'cancelled' THEN 1 ELSE 0 END), 0)::int AS cancelled,
          COALESCE(SUM(CASE WHEN r.status IN ('confirmed','completed') THEN (r.check_out - r.check_in) ELSE 0 END), 0)::int AS total_booked_nights
        FROM apartments a
        LEFT JOIN reservations r ON r.apartment_id = a.id
        LEFT JOIN apartment_ratings ar ON ar.apartment_id = a.id
        WHERE a.owner_id = $1
      `, [req.user.id]),

     pool.query(`
        SELECT a.id, a.title,
          COALESCE(rstats.reservations, 0)::int AS reservations,
          COALESCE(rstats.revenue, 0)::numeric AS revenue,
          COALESCE(ar.avg_rating, 0)::numeric AS avg_rating,
          COALESCE(ar.review_count, 0)::int AS review_count,
          COALESCE(fstats.favorites, 0)::int AS favorites,
          COALESCE(nights30.booked_nights, 0)::int AS booked_nights_30d,
          ROUND(COALESCE(nights30.booked_nights, 0) * 100.0 / 30, 1)::numeric AS occupancy_rate_30d
        FROM apartments a
        LEFT JOIN apartment_ratings ar ON ar.apartment_id = a.id
        LEFT JOIN LATERAL (
          SELECT COUNT(*)::int AS reservations,
            COALESCE(SUM(CASE WHEN status <> 'cancelled' THEN total_price ELSE 0 END), 0)::numeric AS revenue
          FROM reservations WHERE apartment_id = a.id
        ) rstats ON true
        LEFT JOIN LATERAL (
          SELECT COUNT(*)::int AS favorites FROM favorites WHERE apartment_id = a.id
        ) fstats ON true
        LEFT JOIN LATERAL (
          SELECT COUNT(*)::int AS booked_nights
          FROM reservations r2
          CROSS JOIN LATERAL generate_series(r2.check_in, r2.check_out - INTERVAL '1 day', INTERVAL '1 day') AS night
          WHERE r2.apartment_id = a.id
            AND r2.status IN ('confirmed', 'completed')
            AND night >= CURRENT_DATE - INTERVAL '30 days'
            AND night < CURRENT_DATE
        ) nights30 ON true
        WHERE a.owner_id = $1
        ORDER BY revenue DESC, reservations DESC
      `, [req.user.id]),

     pool.query(`
        WITH months AS (
          SELECT date_trunc('month', d)::date AS month_start
          FROM generate_series(date_trunc('month', NOW()) - INTERVAL '11 months', date_trunc('month', NOW()), INTERVAL '1 month') AS d
        ),
        listing_count AS (
          SELECT COUNT(*)::int AS cnt FROM apartments WHERE owner_id = $1
        ),
        res AS (
          SELECT r.* FROM reservations r
          JOIN apartments a ON a.id = r.apartment_id
          WHERE a.owner_id = $1
        ),
        rev AS (
          SELECT date_trunc('month', created_at) AS month_start,
            COUNT(*)::int AS reservations,
            COALESCE(SUM(CASE WHEN status <> 'cancelled' THEN total_price ELSE 0 END), 0)::numeric AS revenue
          FROM res
          WHERE created_at >= NOW() - INTERVAL '12 months'
          GROUP BY 1
        ),
        nights AS (
          SELECT date_trunc('month', night)::date AS month_start, COUNT(*)::int AS booked_nights
          FROM res
          CROSS JOIN LATERAL generate_series(check_in, check_out - INTERVAL '1 day', INTERVAL '1 day') AS night
          WHERE status IN ('confirmed', 'completed')
          GROUP BY 1
        )
        SELECT
          TO_CHAR(m.month_start, 'YYYY-MM') AS month,
          COALESCE(rv.reservations, 0)::int AS reservations,
          COALESCE(rv.revenue, 0)::numeric AS revenue,
          COALESCE(n.booked_nights, 0)::int AS booked_nights,
          (SELECT cnt FROM listing_count) AS listings,
          EXTRACT(DAY FROM (m.month_start + INTERVAL '1 month - 1 day'))::int AS days_in_month
        FROM months m
        LEFT JOIN rev rv ON rv.month_start = m.month_start
        LEFT JOIN nights n ON n.month_start = m.month_start
        ORDER BY m.month_start
      `, [req.user.id]),

      pool.query(`
        SELECT COUNT(*)::int AS booked_nights_30d
        FROM reservations r
        JOIN apartments a ON a.id = r.apartment_id
        CROSS JOIN LATERAL generate_series(r.check_in, r.check_out - INTERVAL '1 day', INTERVAL '1 day') AS night
        WHERE a.owner_id = $1
          AND r.status IN ('confirmed', 'completed')
          AND night >= CURRENT_DATE - INTERVAL '30 days'
          AND night < CURRENT_DATE
      `, [req.user.id]),
    ]);

    const summaryRow = summary.rows[0];
    const listingCount = summaryRow.listings || 0;
    const nights30d = occupancy30.rows[0].booked_nights_30d || 0;
    const occupancyRate30d = listingCount > 0
      ? Math.round((nights30d / (listingCount * 30)) * 1000) / 10
      : 0;
    const avgNightlyRate = summaryRow.total_booked_nights > 0
      ? Math.round((summaryRow.revenue / summaryRow.total_booked_nights) * 100) / 100
      : 0;

    const monthlyWithOccupancy = monthly.rows.map(row => ({
      ...row,
      occupancy_rate: row.listings > 0
        ? Math.round((row.booked_nights / (row.listings * row.days_in_month)) * 1000) / 10
        : 0,
    }));

    res.json({
      summary: {
        ...summaryRow,
        occupancy_rate_30d: occupancyRate30d,
        avg_nightly_rate: avgNightlyRate,
      },
      listings: listings.rows,
      monthly: monthlyWithOccupancy,
    });
  } catch (err) {
    serverError(res, err);
  }
};

module.exports = { getOwnerAnalytics };
