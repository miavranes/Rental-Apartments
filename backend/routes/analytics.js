const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getOwnerAnalytics } = require('../controllers/analyticsController');

router.get('/owner', authenticate, authorize('owner', 'admin'), getOwnerAnalytics);

module.exports = router;
