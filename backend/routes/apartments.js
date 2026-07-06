const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { getApartments, getApartment, createApartment, updateApartment, deleteApartment, getMyApartments } = require('../controllers/apartmentsController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createApartment: createApartmentSchema, updateApartment: updateApartmentSchema } = require('../validators/apartmentSchemas');

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
 filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, 
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      const err = new Error('Only JPEG, PNG, WEBP, or GIF images are allowed.');
      err.status = 400;
      return cb(err);
    }
    cb(null, true);
  },
});

router.get('/my', authenticate, getMyApartments);
router.get('/', getApartments);
router.get('/:id', getApartment);
router.post('/', authenticate, authorize('owner', 'admin'), upload.array('images', 10), validate(createApartmentSchema), createApartment);
router.put('/:id', authenticate, authorize('owner', 'admin'), upload.array('images', 10), validate(updateApartmentSchema), updateApartment);
router.delete('/:id', authenticate, authorize('owner', 'admin'), deleteApartment);
router.delete('/:id/images/:imageId', authenticate, authorize('owner', 'admin'), require('../controllers/apartmentsController').deleteImage);

const { getBlockedDates, blockDates, unblockDates } = require('../controllers/blockedDatesController');
router.get('/:id/blocked-dates', getBlockedDates);
router.post('/:id/blocked-dates', authenticate, authorize('owner', 'admin'), blockDates);
router.delete('/:id/blocked-dates', authenticate, authorize('owner', 'admin'), unblockDates);

module.exports = router;