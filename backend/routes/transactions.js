const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

const FEE = parseFloat(process.env.PLATFORM_FEE_PERCENT || '10') / 100;

// POST /api/transactions - brand initiates escrow
router.post('/', authenticate, requireRole('brand'), async (req, res) => {
  const { projectId, vendorId, amount, milestoneId, paymentMethod, paymentRef } = req.body;
  if (!projectId || !vendorId || !amount) return res.status(400).json({ error: 'projectId, vendorId, amount required' });

  const client = await require('../config/db').pool.connect();
  try {
    await client.query('BEGIN');
    const platformFee = parseFloat((amount * FEE).toFixed(2));
    const netAmount = parseFloat((amount - platformFee).toFixed(2));

    const { rows } = await client.query(
      `INSERT INTO transactions (project_id, milestone_id, brand_id, vendor_id, amount, platform_fee, net_amount, payment_method, payment_ref, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'escrow_held') RETURNING *`,
      [projectId, milestoneId || null, req.user.uid, vendorId, amount, platformFee, netAmount, paymentMethod || 'card', paymentRef || null]
    );
    await client.query('COMMIT');

    // Notify vendor
    const vp = await db.query('SELECT uid FROM vendor_profiles WHERE id=$1', [vendorId]);
    if (vp.rows.length) {
      await db.query(`INSERT INTO notifications (user_id, type, title, message) VALUES ($1,$2,$3,$4)`,
        [vp.rows[0].uid, 'payment_escrowed', 'Payment Escrowed', `KES ${amount} is held in escrow for your project.`]);
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Transaction failed' });
  } finally {
    client.release();
  }
});

// PATCH /api/transactions/:tid/release - brand releases payment
router.patch('/:tid/release', authenticate, requireRole('brand'), async (req, res) => {
  const client = await require('../config/db').pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `UPDATE transactions SET status='released', release_date=NOW()
       WHERE tid=$1 AND brand_id=$2 AND status='escrow_held' RETURNING *`,
      [req.params.tid, req.user.uid]
    );
    if (!rows.length) return res.status(404).json({ error: 'Transaction not found or not releasable' });

    // Update vendor earnings
    await client.query(
      `UPDATE vendor_profiles SET total_earnings = total_earnings + $1 WHERE id = $2`,
      [rows[0].net_amount, rows[0].vendor_id]
    );
    await client.query('COMMIT');

    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Release failed' });
  } finally {
    client.release();
  }
});

// GET /api/transactions/my
router.get('/my', authenticate, async (req, res) => {
  try {
    let query, params;
    if (req.user.userType === 'brand') {
      query = `SELECT t.*, p.title AS project_title, u.full_name AS vendor_name
               FROM transactions t JOIN projects p ON p.pid=t.project_id
               JOIN vendor_profiles vp ON vp.id=t.vendor_id JOIN users u ON u.uid=vp.uid
               WHERE t.brand_id=$1 ORDER BY t.created_at DESC`;
      params = [req.user.uid];
    } else {
      query = `SELECT t.*, p.title AS project_title, u.full_name AS brand_name
               FROM transactions t JOIN projects p ON p.pid=t.project_id
               JOIN users u ON u.uid=t.brand_id
               JOIN vendor_profiles vp ON vp.id=t.vendor_id
               WHERE vp.uid=$1 ORDER BY t.created_at DESC`;
      params = [req.user.uid];
    }
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

module.exports = router;
