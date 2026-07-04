const { serverError } = require('../utils/errors');
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/sendEmail');

const toPublicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone ?? null,
  profile_image: user.profile_image ?? null,
});

const register = async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, phone, verification_code, verification_code_expires, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false)`,
      [name, email, password_hash, role || 'tourist', phone, code, expires]
    );

    await sendVerificationEmail(email, code);

    res.status(201).json({ message: 'Registration successful. Check your email for the verification code.', email });
  } catch (err) {
    serverError(res, err);
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Wrong email or password.' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(400).json({ error: 'Wrong email or password.' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      user: toPublicUser(user),
      token
    });
  } catch (err) {
    serverError(res, err);
  }
};

const me = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, phone, profile_image, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(toPublicUser(result.rows[0]));
  } catch (err) {
    serverError(res, err);
  }
};

const updateProfile = async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users SET name=$1, email=$2, phone=$3 WHERE id=$4
       RETURNING id, name, email, role, phone, profile_image`,
      [name, email, phone, req.user.id]
    );
    res.json(toPublicUser(result.rows[0]));
  } catch (err) {
    serverError(res, err);
  }
};

const switchRole = async (req, res) => {
  try {
    const current = await pool.query('SELECT role FROM users WHERE id=$1', [req.user.id]);
    const newRole = current.rows[0].role === 'tourist' ? 'owner' : 'tourist';

    const result = await pool.query(
      `UPDATE users SET role=$1 WHERE id=$2 RETURNING id, name, email, role, phone`,
      [newRole, req.user.id]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ user: toPublicUser(user), token });
  } catch (err) {
    serverError(res, err);
  }
};

const deleteAccount = async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.user.id]);
    res.json({ message: 'Account is succesfully deleted.' });
  } catch (err) {
    serverError(res, err);
  }
};

const verifyEmail = async (req, res) => {
  const { email, code } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) return res.status(400).json({ error: 'User is not found.' });
    if (user.is_verified) return res.status(400).json({ error: 'Email is already verified.' });

    if (user.verification_code !== code || new Date() > new Date(user.verification_code_expires)) {
      return res.status(400).json({ error: 'The code is invalid or expired.' });
    }

    await pool.query(
      'UPDATE users SET is_verified = true, verification_code = NULL, verification_code_expires = NULL WHERE email = $1',
      [email]
    );

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Email succesfull verified!',
      user: toPublicUser(user),
      token
    });
  } catch (err) {
    serverError(res, err);
  }
};

// ─── Forgot password ──────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    // Always return 200 so we don't leak whether the email exists
    if (result.rows.length === 0) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const user = result.rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, resetExpires, user.id]
    );

    await sendPasswordResetEmail(email, { name: user.name, resetToken });

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    serverError(res, err);
  }
};

// ─── Reset password ───────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Reset link is invalid or has expired.' });
    }

    const user = result.rows[0];
    const password_hash = await bcrypt.hash(password, 10);

    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [password_hash, user.id]
    );

    res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    serverError(res, err);
  }
};

module.exports = { register, login, me, updateProfile, switchRole, deleteAccount, verifyEmail, forgotPassword, resetPassword };
