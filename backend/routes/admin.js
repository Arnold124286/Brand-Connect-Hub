const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

const guard = [authenticate, requireRole('admin')];

// GET /api/admin/stats
router.get('/stats', ...guard, async (req, res) => {
  try {
    const [users, projects, transactions, pendingVendors] = await Promise.all([
      db.query('SELECT COUNT(*) AS total, user_type FROM users GROUP BY user_type'),
      db.query('SELECT COUNT(*) AS total, status FROM projects GROUP BY status'),
      db.query('SELECT COUNT(*) AS total, COALESCE(SUM(amount),0) AS volume FROM transactions'),
      db.query("SELECT COUNT(*) AS total FROM vendor_profiles WHERE verification_status='pending'"),
    ]);
    res.json({
      users: users.rows,
      projects: projects.rows,
      transactions: transactions.rows[0],
      pendingVendors: parseInt(pendingVendors.rows[0].total),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/admin/vendors/pending
router.get('/vendors/pending', ...guard, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT vp.*, u.full_name, u.email, u.created_at FROM vendor_profiles vp
       JOIN users u ON u.uid = vp.uid WHERE vp.verification_status='pending' ORDER BY vp.created_at`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending vendors' });
  }
});

// PATCH /api/admin/vendors/:id/verify
router.patch('/vendors/:id/verify', ...guard, async (req, res) => {
  const { status } = req.body; // 'approved' or 'rejected'
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    const { rows } = await db.query(
      `UPDATE vendor_profiles SET verification_status=$1 WHERE id=$2 RETURNING *`,
      [status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Vendor not found' });

    // Update user verified flag
    if (status === 'approved') {
      await db.query('UPDATE users SET is_verified=TRUE WHERE uid=$1', [rows[0].uid]);
    }

    await db.query(`INSERT INTO notifications (user_id, type, title, message) VALUES ($1,$2,$3,$4)`,
      [rows[0].uid, 'verification_update', `Application ${status === 'approved' ? 'Approved' : 'Rejected'}`,
       status === 'approved' ? 'Your vendor account has been verified!' : 'Your verification was not approved. Contact support.']);

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update vendor' });
  }
});

// PATCH /api/admin/users/:uid/toggle
router.patch('/users/:uid/toggle', ...guard, async (req, res) => {
  try {
    const { rows } = await db.query(
      `UPDATE users SET is_active = NOT is_active WHERE uid=$1 RETURNING uid, email, is_active`,
      [req.params.uid]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// GET /api/admin/users
router.get('/users', ...guard, async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  try {
    const { rows } = await db.query(
      `SELECT uid, email, full_name, user_type, is_verified, is_active, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;
