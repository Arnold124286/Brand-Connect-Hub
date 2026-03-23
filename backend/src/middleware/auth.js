const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

/**
 * Verifies the Bearer JWT token and attaches the user to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication token required.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user record (to catch deactivated accounts)
    const result = await query(
      'SELECT uid, user_type, email, full_name, is_verified, is_active FROM users WHERE uid = $1',
      [decoded.uid]
    );

    if (!result.rows.length || !result.rows[0].is_active) {
      return res.status(401).json({ error: 'User account not found or deactivated.' });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid authentication token.' });
  }
};

/**
 * Role-based access control middleware.
 * @param  {...string} roles - Allowed roles ('brand', 'vendor', 'admin')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated.' });
  if (!roles.includes(req.user.user_type)) {
    return res.status(403).json({
      error: `Access denied. Required role(s): ${roles.join(', ')}.`,
    });
  }
  next();
};

/**
 * Soft auth: attaches user if token present, doesn't fail if missing.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const result = await query(
        'SELECT uid, user_type, email, full_name FROM users WHERE uid = $1 AND is_active = TRUE',
        [decoded.uid]
      );
      if (result.rows.length) req.user = result.rows[0];
    }
  } catch (_) { /* silently ignore */ }
  next();
};

module.exports = { authenticate, authorize, optionalAuth };
