const pool = require('./config/db');

async function migrate() {
  try {
    await pool.query(`
      ALTER TABLE reservations ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'on_arrival';
      ALTER TABLE reservations ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'unpaid';
    `);
    console.log('Migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
