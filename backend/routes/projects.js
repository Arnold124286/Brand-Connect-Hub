const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const { rankVendors } = require('../utils/matchingAlgorithm');

// GET /api/projects - list open projects (vendors can browse)
router.get('/', authenticate, async (req, res) => {
  try {
    const { category, budget_min, budget_max, status = 'open', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let conditions = ['p.status = $1'];
    let params = [status];
    let idx = 2;

    if (category) { conditions.push(`p.category = $${idx++}`); params.push(category); }
    if (budget_min) { conditions.push(`p.budget_max >= $${idx++}`); params.push(budget_min); }
    if (budget_max) { conditions.push(`p.budget_min <= $${idx++}`); params.push(budget_max); }

    const whereClause = conditions.join(' AND ');
    params.push(limit, offset);

    const { rows } = await db.query(
      `SELECT p.*, u.full_name AS brand_name, u.avatar_url AS brand_avatar,
              COUNT(b.id) AS bid_count
       FROM projects p
       JOIN users u ON u.uid = p.brand_id
       LEFT JOIN bids b ON b.project_id = p.pid
       WHERE ${whereClause}
       GROUP BY p.pid, u.full_name, u.avatar_url
       ORDER BY p.created_at DESC
       LIMIT $${idx} OFFSET $${idx+1}`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET /api/projects/my - brand's own projects
router.get('/my', authenticate, requireRole('brand'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT p.*, COUNT(b.id) AS bid_count
       FROM projects p
       LEFT JOIN bids b ON b.project_id = p.pid
       WHERE p.brand_id = $1
       GROUP BY p.pid
       ORDER BY p.created_at DESC`,
      [req.user.uid]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch your projects' });
  }
});

// GET /api/projects/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT p.*, u.full_name AS brand_name, u.avatar_url AS brand_avatar
       FROM projects p
       JOIN users u ON u.uid = p.brand_id
       WHERE p.pid = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Project not found' });

    // Get bids
    const bids = await db.query(
      `SELECT b.*, u.full_name AS vendor_name, u.avatar_url AS vendor_avatar,
              vp.avg_rating, vp.specializations
       FROM bids b
       JOIN vendor_profiles vp ON vp.id = b.vendor_id
       JOIN users u ON u.uid = vp.uid
       WHERE b.project_id = $1
       ORDER BY b.created_at DESC`,
      [req.params.id]
    );

    res.json({ ...rows[0], bids: bids.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// POST /api/projects - brand posts a project
router.post('/', authenticate, requireRole('brand'), [
  body('title').notEmpty().trim(),
  body('description').notEmpty(),
  body('category').notEmpty(),
  body('budgetType').isIn(['fixed', 'hourly']),
  body('budgetMin').isNumeric(),
  body('budgetMax').isNumeric(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description, category, subcategory, budgetType, budgetMin, budgetMax, deadline, industry, skillsRequired } = req.body;
  try {
    const { rows } = await db.query(
      `INSERT INTO projects (brand_id, title, description, category, subcategory, budget_type, budget_min, budget_max, deadline, industry, skills_required)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [req.user.uid, title, description, category, subcategory || null, budgetType, budgetMin, budgetMax,
       deadline || null, industry || null, skillsRequired || []]
    );

    // Notify matching vendors
    const vendors = await db.query(
      `SELECT vp.*, u.uid AS user_uid FROM vendor_profiles vp JOIN users u ON u.uid = vp.uid WHERE vp.verification_status = 'approved'`
    );
    const ranked = rankVendors(rows[0], vendors.rows).slice(0, 10);
    for (const v of ranked) {
      await db.query(
        `INSERT INTO notifications (user_id, type, title, message, meta) VALUES ($1,$2,$3,$4,$5)`,
        [v.user_uid, 'project_match', 'New Project Match!', `"${title}" matches your profile`, JSON.stringify({ projectId: rows[0].pid, score: v.matchScore })]
      );
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PATCH /api/projects/:id/status
router.patch('/:id/status', authenticate, requireRole('brand', 'admin'), async (req, res) => {
  const { status } = req.body;
  const allowed = ['open', 'in_review', 'in_progress', 'completed', 'cancelled', 'disputed'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  try {
    const { rows } = await db.query(
      `UPDATE projects SET status=$1 WHERE pid=$2 AND (brand_id=$3 OR $4='admin') RETURNING *`,
      [status, req.params.id, req.user.uid, req.user.userType]
    );
    if (!rows.length) return res.status(404).json({ error: 'Project not found or unauthorized' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// GET /api/projects/:id/matches - get ranked vendors for a project
router.get('/:id/matches', authenticate, requireRole('brand'), async (req, res) => {
  try {
    const project = await db.query('SELECT * FROM projects WHERE pid=$1 AND brand_id=$2', [req.params.id, req.user.uid]);
    if (!project.rows.length) return res.status(404).json({ error: 'Project not found' });

    const vendors = await db.query(
      `SELECT vp.*, u.full_name, u.email, u.avatar_url
       FROM vendor_profiles vp JOIN users u ON u.uid = vp.uid
       WHERE vp.verification_status = 'approved'`
    );
    const ranked = rankVendors(project.rows[0], vendors.rows);
    res.json(ranked.slice(0, 20));
  } catch (err) {
    res.status(500).json({ error: 'Matching failed' });
  }
});

module.exports = router;
