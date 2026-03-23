const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, withTransaction } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/bids/my — vendor's own bids ────────────────────────────────────

router.get('/my', authenticate, authorize('vendor'), async (req, res) => {
  try {
    const result = await query(
      `SELECT b.*, p.title AS project_title, p.category, p.budget_max,
              p.status AS project_status, u.full_name AS brand_name, u.company_name
       FROM bids b
       JOIN projects p ON p.pid = b.project_id
       JOIN users u ON u.uid = p.brand_id
       WHERE b.vendor_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.uid]
    );
    return res.json({ bids: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch bids.' });
  }
});

// ─── GET /api/bids/project/:projectId — all bids on a project ────────────────

router.get('/project/:projectId', authenticate, async (req, res) => {
  try {
    // Only the brand that owns the project or admin can see all bids
    const proj = await query(
      'SELECT brand_id FROM projects WHERE pid = $1',
      [req.params.projectId]
    );
    if (!proj.rows.length) return res.status(404).json({ error: 'Project not found.' });
    if (req.user.user_type !== 'admin' && proj.rows[0].brand_id !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const result = await query(
      `SELECT b.*, u.full_name, u.avatar_url,
              vp.avg_rating, vp.total_reviews, vp.specializations
       FROM bids b
       JOIN users u ON u.uid = b.vendor_id
       LEFT JOIN vendor_profiles vp ON vp.vendor_id = b.vendor_id
       WHERE b.project_id = $1
       ORDER BY b.created_at DESC`,
      [req.params.projectId]
    );
    return res.json({ bids: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch bids.' });
  }
});

// ─── POST /api/bids — submit a bid ───────────────────────────────────────────

router.post(
  '/',
  authenticate,
  authorize('vendor'),
  [
    body('projectId').isUUID().withMessage('Valid project ID required'),
    body('proposal').trim().notEmpty().withMessage('Proposal text is required'),
    body('amount').isFloat({ min: 1 }).withMessage('Bid amount must be positive'),
    body('deliveryDays').isInt({ min: 1 }).withMessage('Delivery days must be a positive integer'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { projectId, proposal, amount, deliveryDays } = req.body;

    try {
      // Ensure project is open
      const proj = await query(
        "SELECT pid, brand_id, title FROM projects WHERE pid = $1 AND status = 'open'",
        [projectId]
      );
      if (!proj.rows.length) return res.status(400).json({ error: 'Project is not accepting bids.' });

      // Vendors cannot bid on their own (shouldn't happen but sanity check)
      if (proj.rows[0].brand_id === req.user.uid) {
        return res.status(400).json({ error: 'You cannot bid on your own project.' });
      }

      const result = await query(
        `INSERT INTO bids (project_id, vendor_id, proposal, amount, delivery_days)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [projectId, req.user.uid, proposal, amount, deliveryDays]
      );

      // Notify the brand
      await query(
        `INSERT INTO notifications (user_id, type, title, body, metadata)
         VALUES ($1, 'new_bid', $2, $3, $4)`,
        [
          proj.rows[0].brand_id,
          `New bid on "${proj.rows[0].title}"`,
          `A vendor submitted a bid of KES ${amount} for your project.`,
          JSON.stringify({ project_id: projectId, bid_id: result.rows[0].id }),
        ]
      );

      return res.status(201).json({ bid: result.rows[0] });
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'You have already submitted a bid for this project.' });
      }
      console.error('Create bid error:', err);
      return res.status(500).json({ error: 'Failed to submit bid.' });
    }
  }
);

// ─── PUT /api/bids/:id/accept — brand accepts a bid ──────────────────────────

router.put('/:id/accept', authenticate, authorize('brand'), async (req, res) => {
  try {
    await withTransaction(async (client) => {
      // Fetch bid and its project
      const bidResult = await client.query(
        'SELECT b.*, p.brand_id FROM bids b JOIN projects p ON p.pid = b.project_id WHERE b.id = $1',
        [req.params.id]
      );
      if (!bidResult.rows.length) throw { status: 404, message: 'Bid not found.' };
      const bid = bidResult.rows[0];

      if (bid.brand_id !== req.user.uid) throw { status: 403, message: 'Access denied.' };
      if (bid.status !== 'pending') throw { status: 400, message: 'Bid is no longer pending.' };

      // Accept this bid
      await client.query("UPDATE bids SET status = 'accepted' WHERE id = $1", [bid.id]);

      // Reject all other bids on the project
      await client.query(
        "UPDATE bids SET status = 'rejected' WHERE project_id = $1 AND id != $2",
        [bid.project_id, bid.id]
      );

      // Update project status and selected vendor
      await client.query(
        "UPDATE projects SET status = 'in_progress', selected_vendor_id = $1 WHERE pid = $2",
        [bid.vendor_id, bid.project_id]
      );

      // Notify the vendor
      await client.query(
        `INSERT INTO notifications (user_id, type, title, body, metadata)
         VALUES ($1, 'bid_accepted', 'Your bid was accepted!', $2, $3)`,
        [
          bid.vendor_id,
          `Congratulations! Your bid of KES ${bid.amount} has been accepted.`,
          JSON.stringify({ project_id: bid.project_id, bid_id: bid.id }),
        ]
      );
    });

    return res.json({ message: 'Bid accepted. Project is now in progress.' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('Accept bid error:', err);
    return res.status(500).json({ error: 'Failed to accept bid.' });
  }
});

// ─── PUT /api/bids/:id/reject — brand rejects a single bid ───────────────────

router.put('/:id/reject', authenticate, authorize('brand'), async (req, res) => {
  try {
    const result = await query(
      `UPDATE bids SET status = 'rejected'
       WHERE id = $1 AND project_id IN (SELECT pid FROM projects WHERE brand_id = $2)
       RETURNING *`,
      [req.params.id, req.user.uid]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Bid not found or unauthorized.' });
    return res.json({ message: 'Bid rejected.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to reject bid.' });
  }
});

// ─── PUT /api/bids/:id/withdraw — vendor withdraws a bid ─────────────────────

router.put('/:id/withdraw', authenticate, authorize('vendor'), async (req, res) => {
  try {
    const result = await query(
      "UPDATE bids SET status = 'withdrawn' WHERE id = $1 AND vendor_id = $2 AND status = 'pending' RETURNING *",
      [req.params.id, req.user.uid]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Bid not found or cannot be withdrawn.' });
    return res.json({ message: 'Bid withdrawn.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to withdraw bid.' });
  }
});

module.exports = router;
