const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  register, login, me, updateProfile, switchRole,
  deleteAccount, verifyEmail, forgotPassword, resetPassword
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validators/authSchemas');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});

router.post('/register', authLimiter, validate(schemas.register), register);
router.post('/login', authLimiter, validate(schemas.login), login);
router.get('/me', authenticate, me);
router.put('/profile', authenticate, validate(schemas.updateProfile), updateProfile);
router.patch('/switch-role', authenticate, switchRole);
router.delete('/account', authenticate, deleteAccount);
router.post('/verify-email', authLimiter, validate(schemas.verifyEmail), verifyEmail);
router.post('/forgot-password', authLimiter, validate(schemas.forgotPassword), forgotPassword);
router.post('/reset-password', authLimiter, validate(schemas.resetPassword), resetPassword);

module.exports = router;
