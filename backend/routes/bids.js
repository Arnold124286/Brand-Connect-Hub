const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

// POST /api/bids - vendor submits a bid
router.post('/', authenticate, requireRole('vendor'), [
  body('projectId').isUUID(),
  body('proposal').notEmpty(),
  body('bidAmount').isNumeric(),
  body('deliveryDays').isInt({ min: 1 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { projectId, proposal, bidAmount, deliveryDays } = req.body;
  try {
    const vp = await db.query('SELECT id FROM vendor_profiles WHERE uid=$1', [req.user.uid]);
    if (!vp.rows.length) return res.status(400).json({ error: 'Vendor profile not found' });

    const vendorId = vp.rows[0].id;
    const { rows } = await db.query(
      `INSERT INTO bids (project_id, vendor_id, proposal, bid_amount, delivery_days)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [projectId, vendorId, proposal, bidAmount, deliveryDays]
    );

    // Notify brand
    const proj = await db.query('SELECT brand_id, title FROM projects WHERE pid=$1', [projectId]);
    if (proj.rows.length) {
      await db.query(
        `INSERT INTO notifications (user_id, type, title, message, meta) VALUES ($1,$2,$3,$4,$5)`,
        [proj.rows[0].brand_id, 'new_bid', 'New Bid Received!',
         `A vendor submitted a bid on "${proj.rows[0].title}"`,
         JSON.stringify({ projectId, bidId: rows[0].id })]
      );
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Already submitted a bid' });
    res.status(500).json({ error: 'Failed to submit bid' });
  }
});

// PATCH /api/bids/:id/accept - brand accepts a bid
router.patch('/:id/accept', authenticate, requireRole('brand'), async (req, res) => {
  try {
    const bid = await db.query(`
      SELECT b.*, p.brand_id FROM bids b JOIN projects p ON p.pid = b.project_id WHERE b.id=$1
    `, [req.params.id]);

    if (!bid.rows.length) return res.status(404).json({ error: 'Bid not found' });
    if (bid.rows[0].brand_id !== req.user.uid) return res.status(403).json({ error: 'Unauthorized' });

    // Accept this bid, reject others
    await db.query(`UPDATE bids SET status='rejected' WHERE project_id=$1 AND id != $2`, [bid.rows[0].project_id, req.params.id]);
    const { rows } = await db.query(`UPDATE bids SET status='accepted' WHERE id=$1 RETURNING *`, [req.params.id]);

    // Update project
    await db.query(`UPDATE projects SET status='in_progress', assigned_vendor=$1 WHERE pid=$2`,
      [bid.rows[0].vendor_id, bid.rows[0].project_id]);

    // Notify vendor
    const vp = await db.query('SELECT uid FROM vendor_profiles WHERE id=$1', [bid.rows[0].vendor_id]);
    if (vp.rows.length) {
      await db.query(`INSERT INTO notifications (user_id, type, title, message) VALUES ($1,$2,$3,$4)`,
        [vp.rows[0].uid, 'bid_accepted', 'Your Bid Was Accepted!', 'Congratulations! A brand accepted your proposal.']);
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to accept bid' });
  }
});

// PATCH /api/bids/:id/withdraw - vendor withdraws a pending bid
router.patch('/:id/withdraw', authenticate, requireRole('vendor'), async (req, res) => {
  try {
    const vp = await db.query('SELECT id FROM vendor_profiles WHERE uid=$1', [req.user.uid]);
    if (!vp.rows.length) return res.status(403).json({ error: 'Vendor profile not found' });

    const vendorId = vp.rows[0].id;
    const { rows } = await db.query(
      `UPDATE bids SET status='withdrawn' 
       WHERE id=$1 AND vendor_id=$2 AND status='pending' 
       RETURNING *`,
      [req.params.id, vendorId]
    );

    if (!rows.length) return res.status(404).json({ error: 'Bid not found or no longer pending' });
    
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to withdraw bid' });
  }
});

// GET /api/bids/my - vendor's own bids
router.get('/my', authenticate, requireRole('vendor'), async (req, res) => {
  try {
    const vp = await db.query('SELECT id FROM vendor_profiles WHERE uid=$1', [req.user.uid]);
    if (!vp.rows.length) return res.json([]);

    const { rows } = await db.query(
      `SELECT b.*, p.title AS project_title, p.category, p.budget_min, p.budget_max, p.status AS project_status
       FROM bids b JOIN projects p ON p.pid = b.project_id
       WHERE b.vendor_id = $1 ORDER BY b.created_at DESC`,
      [vp.rows[0].id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

module.exports = router;
