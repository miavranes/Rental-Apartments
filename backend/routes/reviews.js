const express = require('express');
const router = express.Router();
const { getReviews, createReview } = require('../controllers/reviewsController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/apartment/:id', getReviews);
router.post('/', authenticate, authorize('tourist'), createReview);

module.exports = router;