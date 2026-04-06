const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { sendOTPEmail } = require('../utils/email');

// ─── Password Policy ─────────────────────────────────────────────────────────
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// ─── POST /api/auth/register ─────────────────────────────────────────────────
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
  console.log('📍 Registration endpoint hit');

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, fullName, userType, phone, registrationNumber, country } = req.body;
  console.log('📝 Request data:', { email, fullName, userType, phone });

  try {
    // Check if email exists
    console.log('🔍 Checking if email exists...');
    const exists = await db.query('SELECT uid FROM users WHERE email=$1', [email]);
    console.log('✅ Email check completed');
    if (exists.rows.length) return res.status(409).json({ error: 'Email already registered' });

    // Hash password
    console.log('🔐 Hashing password...');
    const hash = await bcrypt.hash(password, 12);
    console.log('✅ Password hashed');

    // Insert user
    console.log('💾 Inserting user into database...');
    const { rows } = await db.query(
      `INSERT INTO users (email, password_hash, full_name, user_type, phone, registration_number, country, is_verified)
       VALUES ($1,$2,$3,$4,$5,$6,$7, FALSE) RETURNING uid, email, full_name, user_type`,
      [email, hash, fullName, userType, phone || null, registrationNumber || null, country || 'Kenya']
    );
    console.log('✅ User inserted:', rows[0].email);
    const user = rows[0];

    // Create profile based on user type
    if (userType === 'brand') {
      console.log('👤 Creating brand profile...');
      await db.query('INSERT INTO brand_profiles (uid) VALUES ($1)', [user.uid]);
      console.log('✅ Brand profile created');
    } else {
      console.log('👤 Creating vendor profile...');
      await db.query('INSERT INTO vendor_profiles (uid) VALUES ($1)', [user.uid]);
      console.log('✅ Vendor profile created');
    }

    // Generate OTP
    console.log('📧 Generating OTP...');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    console.log('🔐 OTP Generated');

    // Save OTP to database
    console.log('💾 Saving OTP to database...');
    await db.query(
      'INSERT INTO otp_codes (email, otp, expires_at) VALUES ($1, $2, $3)',
      [email, otp, expiresAt]
    );
    console.log('✅ OTP saved');

    // Send OTP email asynchronously
    console.log('📬 Sending OTP email...');
    sendOTPEmail(email, otp)
      .then(() => console.log('✅ Email sent successfully'))
      .catch((e) => console.error('❌ sendOTPEmail error:', e.message));

    // Generate JWT token
    console.log('🔑 Generating JWT token...');
    const token = jwt.sign(
      { uid: user.uid, email: user.email, userType: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    console.log('✅ Token generated');

    // Dev mode — only when SendGrid is not configured
    const isDevMode = !process.env.SENDGRID_API_KEY;

    console.log('✅ Sending success response...');
    res.status(201).json({
      token,
      user: {
        uid: user.uid,
        email: user.email,
        fullName: user.full_name,
        userType: user.user_type,
        isVerified: false,
      },
      message: 'Registration successful. Please verify your email with the OTP sent.',
      ...(isDevMode && {
        devOtp: otp,
        devNote: 'DEV MODE: SendGrid not configured. Use this OTP to verify.',
      }),
    });
  } catch (err) {
    console.error('❌ Registration failed:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ─── POST /api/auth/verify-otp ───────────────────────────────────────────────
router.post('/verify-otp', [
  body('email').isEmail(),
  body('otp').isLength({ min: 6, max: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, otp } = req.body;
  try {
    const { rows } = await db.query(
      'SELECT id FROM otp_codes WHERE email=$1 AND otp=$2 AND expires_at > NOW()',
      [email, otp]
    );

    if (!rows.length) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Mark user as verified
    await db.query('UPDATE users SET is_verified = TRUE WHERE email=$1', [email]);

    // Delete used OTP
    await db.query('DELETE FROM otp_codes WHERE email=$1', [email]);

    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error('❌ OTP verification failed:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ─── POST /api/auth/resend-otp ───────────────────────────────────────────────
router.post('/resend-otp', [
  body('email').isEmail().normalizeEmail(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email } = req.body;
  try {
    const userExists = await db.query('SELECT uid FROM users WHERE email=$1', [email]);
    if (!userExists.rows.length) return res.status(404).json({ error: 'User not found' });

    // Delete old OTPs for this email
    await db.query('DELETE FROM otp_codes WHERE email=$1', [email]);

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.query(
      'INSERT INTO otp_codes (email, otp, expires_at) VALUES ($1, $2, $3)',
      [email, otp, expiresAt]
    );

    sendOTPEmail(email, otp)
      .then(() => console.log('✅ Resend OTP email sent'))
      .catch((e) => console.error('❌ Resend OTP error:', e.message));

    const isDevMode = !process.env.SENDGRID_API_KEY;

    res.json({
      message: 'OTP resent successfully',
      ...(isDevMode && { devOtp: otp, devNote: 'DEV MODE: Use this OTP to verify.' }),
    });
  } catch (err) {
    console.error('❌ Resend OTP failed:', err);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
});

// ─── POST /api/auth/login ────────────────────────────────────────────────────
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  try {
    const { rows } = await db.query(
      'SELECT uid, email, password_hash, full_name, user_type, is_active, is_verified FROM users WHERE email=$1',
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

    res.json({
      token,
      user: {
        uid: user.uid,
        email: user.email,
        fullName: user.full_name,
        userType: user.user_type,
        isVerified: user.is_verified,
      },
    });
  } catch (err) {
    console.error('❌ Login failed:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ─── GET /api/auth/me ────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  console.log('📍 /api/auth/me called for uid:', req.user.uid);
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

    const row = rows[0];
    res.json({
      uid: row.uid,
      email: row.email,
      fullName: row.full_name,
      userType: row.user_type,
      phone: row.phone,
      avatarUrl: row.avatar_url,
      isVerified: row.is_verified,
      createdAt: row.created_at,
      companyName: row.company_name,
      brandIndustry: row.brand_industry,
      walletBalance: row.wallet_balance,
      vendorProfileId: row.vendor_profile_id,
      bio: row.bio,
      specializations: row.specializations,
      avgRating: row.avg_rating,
      verificationStatus: row.verification_status,
      credits: row.credits,
    });
  } catch (err) {
    console.error('❌ /api/auth/me failed:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;