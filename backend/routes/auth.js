const express = require('express');
const router = express.Router();
const { register, login, me, updateProfile, switchRole, deleteAccount, verifyEmail } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, me);
router.put('/profile', authenticate, updateProfile);
router.patch('/switch-role', authenticate, switchRole);
router.delete('/account', authenticate, deleteAccount);
router.post('/verify-email', verifyEmail);

module.exports = router;