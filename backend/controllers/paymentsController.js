const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const pool = require('../config/db');
const createPaymentIntent = async (req, res) => {
  const { reservation_id } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM reservations WHERE id = $1 AND user_id = $2',
      [reservation_id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rezervacija nije pronađena.' });
    }

    const reservation = result.rows[0];

    if (reservation.status !== 'pending') {
      return res.status(400).json({ error: 'Rezervacija nije u pending statusu.' });
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(reservation.total_price * 100),
      currency: 'eur',
      metadata: {
        reservation_id: reservation.id,
        user_id: req.user.id
      }
    });

    await pool.query(
      'UPDATE reservations SET stripe_payment_id = $1 WHERE id = $2',
      [paymentIntent.id, reservation_id]
    );

    res.json({ client_secret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).json({ error: `Webhook greška: ${err.message}` });
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const reservation_id = paymentIntent.metadata.reservation_id;

    try {
      await pool.query(
        'UPDATE reservations SET status = $1 WHERE id = $2',
        ['confirmed', reservation_id]
      );
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.json({ received: true });
};

module.exports = { createPaymentIntent, handleWebhook };