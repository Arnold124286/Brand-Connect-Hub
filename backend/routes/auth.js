const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Min 8 chars'),
  body('fullName').notEmpty(),
  body('userType').isIn(['brand', 'vendor']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password, fullName, userType, phone, country } = req.body;
  try {
    const exists = await db.query('SELECT uid FROM users WHERE email=$1', [email]);
    if (exists.rows.length) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await db.query(
      `INSERT INTO users (email, password_hash, full_name, user_type, phone, country)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING uid, email, full_name, user_type`,
      [email, hash, fullName, userType, phone || null, country || 'Kenya']
    );
    const user = rows[0];

    // Create profile
    if (userType === 'brand') {
      await db.query('INSERT INTO brand_profiles (uid) VALUES ($1)', [user.uid]);
    } else {
      await db.query('INSERT INTO vendor_profiles (uid) VALUES ($1)', [user.uid]);
    }

    const token = jwt.sign(
      { uid: user.uid, email: user.email, userType: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({ token, user: { uid: user.uid, email: user.email, fullName: user.full_name, userType: user.user_type } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  try {
    const { rows } = await db.query(
      'SELECT uid, email, password_hash, full_name, user_type, is_active FROM users WHERE email=$1',
      [email]
    );
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    if (!user.is_active) return res.status(403).json({ error: 'Account suspended' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { uid: user.uid, email: user.email, userType: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({ token, user: { uid: user.uid, email: user.email, fullName: user.full_name, userType: user.user_type } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT u.uid, u.email, u.full_name, u.user_type, u.phone, u.avatar_url, u.is_verified, u.created_at,
              bp.company_name, bp.industry AS brand_industry,
              vp.id AS vendor_profile_id, vp.bio, vp.specializations, vp.avg_rating, vp.verification_status
       FROM users u
       LEFT JOIN brand_profiles bp ON bp.uid = u.uid
       LEFT JOIN vendor_profiles vp ON vp.uid = u.uid
       WHERE u.uid = $1`,
      [req.user.uid]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;
