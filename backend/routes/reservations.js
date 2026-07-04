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
const validate = require('../middleware/validate');
const { createReservation: createReservationSchema } = require('../validators/reservationSchemas');

router.post('/', authenticate, authorize('tourist'), validate(createReservationSchema), createReservation);
router.get('/my', authenticate, authorize('tourist'), getMyReservations);
router.get('/owner', authenticate, authorize('owner'), getOwnerReservations);
router.patch('/:id/confirm', authenticate, authorize('owner'), confirmReservation);
router.patch('/:id/cancel', authenticate, cancelReservation);

module.exports = router;