const { serverError } = require('../utils/errors');
const pool = require('../config/db');

const getBlockedDates = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT date FROM blocked_dates WHERE apartment_id = $1 ORDER BY date',
      [id]
    );
     const pad = (n) => String(n).padStart(2, '0');
    res.json(result.rows.map(r => {
      const d = r.date;
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }));
  } catch (err) {
    serverError(res, err);
  }
};

const blockDates = async (req, res) => {
  const { id } = req.params;
  const { dates } = req.body;

  try {
    const check = await pool.query('SELECT owner_id FROM apartments WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Apartment not found.' });
    if (check.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Access denied.' });

    for (const date of dates) {
      await pool.query(
        'INSERT INTO blocked_dates (apartment_id, date) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [id, date]
      );
    }
    res.json({ message: 'Dates blocked.' });
  } catch (err) {
    serverError(res, err);
  }
};

const unblockDates = async (req, res) => {
  const { id } = req.params;
  const { dates } = req.body;

  try {
    const check = await pool.query('SELECT owner_id FROM apartments WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Apartment not found.' });
    if (check.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Access denied.' });

    await pool.query(
      'DELETE FROM blocked_dates WHERE apartment_id = $1 AND date = ANY($2::date[])',
      [id, dates]
    );
    res.json({ message: 'Dates unblocked.' });
  } catch (err) {
    serverError(res, err);
  }
};

module.exports = { getBlockedDates, blockDates, unblockDates };