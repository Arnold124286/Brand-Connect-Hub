const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { sendOTPEmail } = require('../utils/email');

// Password configuration
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// POST /api/auth/register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').custom((value) => {
    if (!PASSWORD_REGEX.test(value)) {
      throw new Error('Password must be at least 8 characters, include uppercase, lowercase, number, and special character');
    }
    return true;
  }),
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
      `INSERT INTO users (email, password_hash, full_name, user_type, phone, country, is_verified)
       VALUES ($1,$2,$3,$4,$5,$6, FALSE) RETURNING uid, email, full_name, user_type`,
      [email, hash, fullName, userType, phone || null, country || 'Kenya']
    );
    const user = rows[0];

    // Create profile
    if (userType === 'brand') {
      await db.query('INSERT INTO brand_profiles (uid) VALUES ($1)', [user.uid]);
    } else {
      await db.query('INSERT INTO vendor_profiles (uid) VALUES ($1)', [user.uid]);
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await db.query(
      'INSERT INTO otp_codes (email, otp, expires_at) VALUES ($1, $2, $3)',
      [email, otp, expiresAt]
    );

    // Send email
    await sendOTPEmail(email, otp);

    const token = jwt.sign(
      { uid: user.uid, email: user.email, userType: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({ 
      token, 
      user: { uid: user.uid, email: user.email, fullName: user.full_name, userType: user.user_type, isVerified: false },
      message: 'Registration successful. Please verify your email with the OTP sent.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', [
  body('email').isEmail(),
  body('otp').isLength({ min: 6, max: 6 }),
], async (req, res) => {
  const { email, otp } = req.body;
  try {
    const { rows } = await db.query(
      'SELECT id FROM otp_codes WHERE email=$1 AND otp=$2 AND expires_at > NOW()',
      [email, otp]
    );

    if (!rows.length) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Update user
    await db.query('UPDATE users SET is_verified = TRUE WHERE email=$1', [email]);
    // Delete OTP
    await db.query('DELETE FROM otp_codes WHERE email=$1', [email]);

    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed' });
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
              bp.company_name, bp.industry AS brand_industry, bp.wallet_balance,
              vp.id AS vendor_profile_id, vp.bio, vp.specializations, vp.avg_rating, vp.verification_status, vp.credits
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
