const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ message: 'Server radi!' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/apartments', require('./routes/apartments'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/payments', require('./routes/payments'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server pokrenut na portu ${PORT}`));