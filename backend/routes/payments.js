const express = require('express');
const router = express.Router();
const { createPaymentIntent, confirmPayment, handleWebhook } = require('../controllers/paymentsController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);
router.post('/create-intent', authenticate, authorize('tourist'), createPaymentIntent);
router.post('/confirm', authenticate, authorize('tourist'), confirmPayment);

module.exports = router;