const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getFavorites, addFavorite, removeFavorite, getFavoriteIds } = require('../controllers/favoritesController');

router.get('/', authenticate, getFavorites);
router.get('/ids', authenticate, getFavoriteIds);
router.post('/:apartmentId', authenticate, addFavorite);
router.delete('/:apartmentId', authenticate, removeFavorite);

module.exports = router;
