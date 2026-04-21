const express = require('express');
const router = express.Router();
const {
  createReservation,
  getMyReservations,
  getOwnerReservations,
  confirmReservation,
  cancelReservation
} = require('../controllers/reservationsController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize('tourist'), createReservation);
router.get('/my', authenticate, authorize('tourist'), getMyReservations);
router.get('/owner', authenticate, authorize('owner'), getOwnerReservations);
router.patch('/:id/confirm', authenticate, authorize('owner'), confirmReservation);
router.patch('/:id/cancel', authenticate, cancelReservation);

module.exports = router;