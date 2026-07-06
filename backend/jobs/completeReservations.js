const pool = require('../config/db');
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