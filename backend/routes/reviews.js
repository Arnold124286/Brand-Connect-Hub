const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

// POST /api/reviews - Brand reviews Vendor
router.post('/', authenticate, [
  body('projectId').isUUID(),
  body('reviewerId').isUUID(),
  body('revieweeId').isUUID(),
  body('rating').isInt({ min: 1, max: 5 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { projectId, reviewerId, revieweeId, rating, comment } = req.body;
  
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert review
    const { rows: reviewRows } = await client.query(
      `INSERT INTO reviews (project_id, reviewer_id, reviewee_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [projectId, reviewerId, revieweeId, rating, comment]
    );

    // 2. Adjust Vendor Credits
    // Positive (4, 5) -> +5.00
    // Negative (1, 2) -> -5.00
    let creditAdjustment = 0;
    if (rating >= 4) creditAdjustment = 5.00;
    else if (rating <= 2) creditAdjustment = -5.00;

    if (creditAdjustment !== 0) {
      await client.query(
        `UPDATE vendor_profiles SET credits = credits + $1 WHERE uid = $2`,
        [creditAdjustment, revieweeId]
      );
    }

    // 3. Update Vendor Avg Rating
    await client.query(
      `UPDATE vendor_profiles SET 
         avg_rating = (SELECT AVG(rating) FROM reviews WHERE reviewee_id = $1),
         total_reviews = total_reviews + 1
       WHERE uid = $1`,
      [revieweeId]
    );

    await client.query('COMMIT');
    res.status(201).json(reviewRows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to submit review' });
  } finally {
    client.release();
  }
});

// GET /api/reviews/vendor/:uid
router.get('/vendor/:uid', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT r.*, p.title AS project_title, u.full_name AS reviewer_name 
       FROM reviews r
       JOIN projects p ON p.pid = r.project_id
       JOIN users u ON u.uid = r.reviewer_id
       WHERE r.reviewee_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.uid]
    );
    res.json({ reviews: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
