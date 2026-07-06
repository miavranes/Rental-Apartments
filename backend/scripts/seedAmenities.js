const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, '../db/seedAmenities.sql'), 'utf8');
  await pool.query(sql);
  console.log('Amenities seeded / normalized successfully.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
