const pool = require('../config/db');

/**
 * Marks confirmed reservations as completed once the apartment's actual
 * check-out moment (check_out date + the listing's check_out_time) has
 * passed — not just the date. This is what unlocks leaving a review.
 * Called from server.js via node-cron.
 */
const completeExpiredReservations = async () => {
  try {
    const result = await pool.query(`
      UPDATE reservations r
      SET status = 'completed'
      FROM apartments a
      WHERE r.apartment_id = a.id
        AND r.status = 'confirmed'
        AND (r.check_out::timestamp + a.check_out_time) < NOW()
      RETURNING r.id
    `);

    if (result.rowCount > 0) {
      console.log(`[cron] Completed ${result.rowCount} reservation(s).`);
    }
  } catch (err) {
    console.error('[cron] completeExpiredReservations error:', err.message);
  }
};

module.exports = completeExpiredReservations;