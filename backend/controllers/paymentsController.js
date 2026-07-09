const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { serverError } = require('../utils/errors');
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
    serverError(res, err);
  }
};

// Sinhrona potvrda placanja - poziva je frontend odmah nakon sto Stripe
// (na klijentu) javi da je kartica uspjesno naplacena. Ne vjerujemo slijepo
// klijentu: ovdje se stanje PaymentIntent-a provjerava direktno kod Stripe-a
// (server-to-server) prije nego sto se rezervacija oznaci kao placena.
// Ovo postoji kao dopuna webhook-u (koji ostaje kao izvor istine u pozadini),
// jer u developmentu ili kad webhook zakasni/ne stigne, gost bi inace ostao
// zaglavljen u stanju "unpaid" iako je kartica realno naplacena.
//
// Kad se plati karticom (online), rezervacija se automatski i POTVRDI
// (status = 'confirmed') - host tu ne treba rucno da odobrava, jer je
// novac vec naplacen. Rucna potvrda hosta ostaje samo za "placanje po
// dolasku" (on_arrival), gdje jos nista nije naplaceno.
const confirmPayment = async (req, res) => {
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

    if (!reservation.stripe_payment_id) {
      return res.status(400).json({ error: 'Za ovu rezervaciju ne postoji plaćanje.' });
    }

    if (reservation.payment_status === 'paid') {
      return res.json(reservation);
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(reservation.stripe_payment_id);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Plaćanje još nije potvrđeno kod Stripe-a.' });
    }

    const updated = await pool.query(
      `UPDATE reservations
       SET payment_status = 'paid',
           status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END
       WHERE id = $1
       RETURNING *`,
      [reservation_id]
    );

    res.json(updated.rows[0]);
  } catch (err) {
    serverError(res, err);
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
        `UPDATE reservations
         SET payment_status = 'paid',
             status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END
         WHERE id = $1 AND status IN ('pending', 'confirmed')`,
        [reservation_id]
      );
    } catch (err) {
      return serverError(res, err);
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;
    const reservation_id = paymentIntent.metadata.reservation_id;

    try {
      await pool.query(
        'UPDATE reservations SET payment_status = $1 WHERE id = $2 AND status = $3',
        ['failed', reservation_id, 'pending']
      );
    } catch (err) {
      return serverError(res, err);
    }
  }

  res.json({ received: true });
};

module.exports = { createPaymentIntent, confirmPayment, handleWebhook };