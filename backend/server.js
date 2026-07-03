const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
require('dotenv').config();

const completeExpiredReservations = require('./jobs/completeReservations');

const app = express();

app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => res.json({ message: 'Server radi!' }));

app.use('/api/geocode', require('./routes/geocode'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/apartments', require('./routes/apartments'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/payments', require('./routes/payments'));

// Run once on startup to catch any missed completions, then daily at 01:00
completeExpiredReservations();
cron.schedule('0 1 * * *', completeExpiredReservations);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server pokrenut na portu ${PORT}`));
