const express = require('express');
const router = express.Router();
const { getApartments, getApartment, createApartment, updateApartment, deleteApartment } = require('../controllers/apartmentsController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', getApartments);
router.get('/:id', getApartment);
router.post('/', authenticate, authorize('owner', 'admin'), createApartment);
router.put('/:id', authenticate, authorize('owner', 'admin'), updateApartment);
router.delete('/:id', authenticate, authorize('owner', 'admin'), deleteApartment);

module.exports = router;