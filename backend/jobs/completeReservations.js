const pool = require('../config/db');

/**
 * Marks confirmed reservations as completed once check_out date has passed.
 * Called from server.js via node-cron (runs daily at 01:00).
 */
const completeExpiredReservations = async () => {
  try {
    const result = await pool.query(`
      UPDATE reservations
      SET status = 'completed'
      WHERE status = 'confirmed'
        AND check_out < CURRENT_DATE
      RETURNING id
    `);

    if (result.rowCount > 0) {
      console.log(`[cron] Completed ${result.rowCount} reservation(s).`);
    }
  } catch (err) {
    console.error('[cron] completeExpiredReservations error:', err.message);
  }
};

module.exports = completeExpiredReservations;
