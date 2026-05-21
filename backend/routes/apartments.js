const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getApartments, getApartment, createApartment, updateApartment, deleteApartment, getMyApartments } = require('../controllers/apartmentsController');
const { authenticate, authorize } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

router.get('/my', authenticate, getMyApartments);
router.get('/', getApartments);
router.get('/:id', getApartment);
router.post('/', authenticate, authorize('owner', 'admin'), upload.array('images', 10), createApartment);
router.put('/:id', authenticate, authorize('owner', 'admin'), upload.array('images', 10), updateApartment);
router.delete('/:id', authenticate, authorize('owner', 'admin'), deleteApartment);

module.exports = router;