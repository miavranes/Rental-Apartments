const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const path = require('path');
const cron = require('node-cron');
require('dotenv').config({ quiet: true });

const completeExpiredReservations = require('./jobs/completeReservations');

const app = express();

app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(helmet({
  // Serving images cross-origin to the frontend needs this relaxed.
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => res.json({ message: 'Server radi!' }));

app.use('/api/geocode', require('./routes/geocode'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/apartments', require('./routes/apartments'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/analytics', require('./routes/analytics'));

// 404 for unmatched API routes
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// Global error handler — catches multer errors (bad file type, too large)
// and any other error passed via next(err), so nothing ever falls through
// to Express's default HTML error page or leaks a raw stack trace.
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  if (err) {
    console.error(err);
    const isDev = process.env.NODE_ENV !== 'production';
    return res.status(err.status || 500).json({ error: isDev ? err.message : 'Something went wrong. Please try again.' });
  }
  next();
});

// Run once on startup to catch any missed completions, then daily at 01:00
completeExpiredReservations();
cron.schedule('0 1 * * *', completeExpiredReservations);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server pokrenut na portu ${PORT}`));
