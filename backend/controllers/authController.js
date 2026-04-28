const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendVerificationEmail = require('../utils/sendEmail');


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
    res.status(500).json({ error: err.message });
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
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const me = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, phone, profile_image, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
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

    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteAccount = async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.user.id]);
    res.json({ message: 'Account is succesfully deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
  if (!user.is_verified) {
  return res.status(403).json({ error: 'Email is not verified. Check your inbox.' });
}
};



module.exports = { register, login, me, updateProfile, switchRole, deleteAccount, verifyEmail };