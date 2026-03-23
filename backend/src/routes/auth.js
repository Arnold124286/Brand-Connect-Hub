const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query, withTransaction } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateToken = (uid, userType) =>
  jwt.sign({ uid, userType }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const safeUser = (u) => ({
  uid:          u.uid,
  userType:     u.user_type,
  email:        u.email,
  fullName:     u.full_name,
  companyName:  u.company_name,
  isVerified:   u.is_verified,
  avatarUrl:    u.avatar_url,
  createdAt:    u.created_at,
});

// ─── POST /api/auth/register ───────────────────────────────────────────────────

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('fullName').trim().notEmpty().withMessage('Full name required'),
    body('userType').isIn(['brand', 'vendor']).withMessage('User type must be brand or vendor'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, fullName, companyName, phone, userType } = req.body;

    try {
      // Check duplicate email
      const existing = await query('SELECT uid FROM users WHERE email = $1', [email]);
      if (existing.rows.length) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await withTransaction(async (client) => {
        // Insert user
        const userResult = await client.query(
          `INSERT INTO users (user_type, email, password_hash, full_name, company_name, phone)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [userType, email, passwordHash, fullName, companyName || null, phone || null]
        );
        const newUser = userResult.rows[0];

        // Create vendor profile scaffold if registering as vendor
        if (userType === 'vendor') {
          await client.query(
            'INSERT INTO vendor_profiles (vendor_id) VALUES ($1)',
            [newUser.uid]
          );
        }

        return newUser;
      });

      const token = generateToken(user.uid, user.user_type);
      return res.status(201).json({ token, user: safeUser(user) });

    } catch (err) {
      console.error('Register error:', err);
      return res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  }
);

// ─── POST /api/auth/login ──────────────────────────────────────────────────────

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const result = await query('SELECT * FROM users WHERE email = $1', [email]);
      const user   = result.rows[0];

      if (!user || !user.is_active) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const token = generateToken(user.uid, user.user_type);
      return res.json({ token, user: safeUser(user) });

    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Login failed. Please try again.' });
    }
  }
);

// ─── GET /api/auth/me ──────────────────────────────────────────────────────────

router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM users WHERE uid = $1', [req.user.uid]);
    if (!result.rows.length) return res.status(404).json({ error: 'User not found.' });
    return res.json({ user: safeUser(result.rows[0]) });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

// ─── PUT /api/auth/password ────────────────────────────────────────────────────

router.put(
  '/password',
  authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { currentPassword, newPassword } = req.body;

    try {
      const result = await query('SELECT password_hash FROM users WHERE uid = $1', [req.user.uid]);
      const valid  = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
      if (!valid) return res.status(400).json({ error: 'Current password is incorrect.' });

      const newHash = await bcrypt.hash(newPassword, 12);
      await query('UPDATE users SET password_hash = $1 WHERE uid = $2', [newHash, req.user.uid]);
      return res.json({ message: 'Password updated successfully.' });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to update password.' });
    }
  }
);

module.exports = router;
