/**
 * Run all .sql files in db/migrations/ against the database, in filename order.
 * Safe to re-run: every migration in this project uses IF NOT EXISTS / IF EXISTS
 * guards, so already-applied migrations are simply no-ops.
 *
 *   node scripts/runMigrations.js
 */
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function main() {
  const dir = path.join(__dirname, '../db/migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();

  if (files.length === 0) {
    console.log('No migration files found in db/migrations.');
    process.exit(0);
  }

  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    console.log(`Applying ${file} ...`);
    await pool.query(sql);
  }

  console.log('All migrations applied successfully.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
