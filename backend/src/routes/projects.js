const express = require('express');
const { body, query: qv, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { rankVendorsForProject, suggestVendors } = require('../algorithms/vendorMatching');

const router = express.Router();

// ─── GET /api/projects — list open projects (public + auth) ──────────────────

router.get('/', async (req, res) => {
  try {
    const { category, status, budget_min, budget_max, industry, search, page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];

    if (category)   { params.push(`%${category}%`);   conditions.push(`p.category ILIKE $${params.length}`); }
    if (status)     { params.push(status);             conditions.push(`p.status = $${params.length}`); }
    if (budget_min) { params.push(budget_min);         conditions.push(`p.budget_max >= $${params.length}`); }
    if (budget_max) { params.push(budget_max);         conditions.push(`p.budget_max <= $${params.length}`); }
    if (industry)   { params.push(`%${industry}%`);   conditions.push(`p.industry ILIKE $${params.length}`); }
    if (search)     { params.push(`%${search}%`);     conditions.push(`(p.title ILIKE $${params.length} OR p.description ILIKE $${params.length})`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    params.push(limit, offset);
    const result = await query(
      `SELECT p.*, u.full_name AS brand_name, u.company_name, u.avatar_url,
              (SELECT COUNT(*) FROM bids b WHERE b.project_id = p.pid) AS bid_count
       FROM projects p JOIN users u ON u.uid = p.brand_id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    // Get total count for pagination
    const countResult = await query(
      `SELECT COUNT(*) FROM projects p ${where}`,
      params.slice(0, params.length - 2)
    );

    return res.json({
      projects: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
    });
  } catch (err) {
    console.error('Get projects error:', err);
    return res.status(500).json({ error: 'Failed to fetch projects.' });
  }
});

// ─── GET /api/projects/my — brand's own projects ─────────────────────────────

router.get('/my', authenticate, authorize('brand'), async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*,
              (SELECT COUNT(*) FROM bids b WHERE b.project_id = p.pid) AS bid_count,
              (SELECT COUNT(*) FROM messages m WHERE m.project_id = p.pid) AS message_count
       FROM projects p WHERE p.brand_id = $1 ORDER BY p.created_at DESC`,
      [req.user.uid]
    );
    return res.json({ projects: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch your projects.' });
  }
});

// ─── GET /api/projects/:id ────────────────────────────────────────────────────

router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, u.full_name AS brand_name, u.company_name, u.avatar_url AS brand_avatar
       FROM projects p JOIN users u ON u.uid = p.brand_id WHERE p.pid = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Project not found.' });

    const project = result.rows[0];

    // Fetch milestones
    const milestones = await query(
      'SELECT * FROM milestones WHERE project_id = $1 ORDER BY created_at',
      [req.params.id]
    );
    project.milestones = milestones.rows;

    return res.json({ project });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch project.' });
  }
});

// ─── POST /api/projects — create project ─────────────────────────────────────

router.post(
  '/',
  authenticate,
  authorize('brand'),
  [
    body('title').trim().notEmpty().withMessage('Project title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('budgetType').isIn(['fixed', 'hourly']),
    body('budgetMax').isFloat({ min: 1 }).withMessage('Budget max must be a positive number'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
      title, description, category, subCategory,
      budgetType, budgetMin, budgetMax, deadline,
      requiredSkills, industry,
    } = req.body;

    try {
      const result = await query(
        `INSERT INTO projects
           (brand_id, title, description, category, sub_category,
            budget_type, budget_min, budget_max, deadline, required_skills, industry)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [
          req.user.uid, title, description, category, subCategory || null,
          budgetType, budgetMin || null, budgetMax, deadline || null,
          requiredSkills || null, industry || null,
        ]
      );

      // Create a notification for matched vendors
      const suggestions = await suggestVendors({ category, budget_max: budgetMax, industry }, 5);
      for (const vendor of suggestions) {
        await query(
          `INSERT INTO notifications (user_id, type, title, body, metadata)
           VALUES ($1, 'new_project_match', $2, $3, $4)`,
          [
            vendor.uid,
            `New project match: ${title}`,
            `A project matching your skills has been posted. Budget: KES ${budgetMax}`,
            JSON.stringify({ project_id: result.rows[0].pid }),
          ]
        );
      }

      return res.status(201).json({ project: result.rows[0] });
    } catch (err) {
      console.error('Create project error:', err);
      return res.status(500).json({ error: 'Failed to create project.' });
    }
  }
);

// ─── PUT /api/projects/:id ────────────────────────────────────────────────────

router.put('/:id', authenticate, authorize('brand'), async (req, res) => {
  const { title, description, status, deadline, requiredSkills } = req.body;
  try {
    const result = await query(
      `UPDATE projects SET title=$1, description=$2, status=$3, deadline=$4,
       required_skills=$5 WHERE pid=$6 AND brand_id=$7 RETURNING *`,
      [title, description, status, deadline, requiredSkills, req.params.id, req.user.uid]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Project not found or unauthorized.' });
    return res.json({ project: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update project.' });
  }
});

// ─── DELETE /api/projects/:id ─────────────────────────────────────────────────

router.delete('/:id', authenticate, authorize('brand', 'admin'), async (req, res) => {
  try {
    const condition = req.user.user_type === 'admin' ? '' : 'AND brand_id = $2';
    const params = req.user.user_type === 'admin' ? [req.params.id] : [req.params.id, req.user.uid];
    const result = await query(
      `UPDATE projects SET status = 'cancelled' WHERE pid = $1 ${condition} RETURNING pid`,
      params
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Project not found or unauthorized.' });
    return res.json({ message: 'Project cancelled successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to cancel project.' });
  }
});

// ─── GET /api/projects/:id/ranked-bids — vendor matching ─────────────────────

router.get('/:id/ranked-bids', authenticate, authorize('brand', 'admin'), async (req, res) => {
  try {
    // Verify brand owns this project (or admin)
    if (req.user.user_type === 'brand') {
      const proj = await query('SELECT brand_id FROM projects WHERE pid = $1', [req.params.id]);
      if (!proj.rows.length || proj.rows[0].brand_id !== req.user.uid) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    }

    const ranked = await rankVendorsForProject(req.params.id);
    return res.json({ rankedBids: ranked });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to rank vendors.' });
  }
});

// ─── GET /api/projects/:id/suggestions — pre-bid vendor suggestions ───────────

router.get('/:id/suggestions', authenticate, authorize('brand'), async (req, res) => {
  try {
    const proj = await query(
      'SELECT category, budget_max, industry FROM projects WHERE pid = $1 AND brand_id = $2',
      [req.params.id, req.user.uid]
    );
    if (!proj.rows.length) return res.status(404).json({ error: 'Project not found.' });

    const suggestions = await suggestVendors(proj.rows[0], 8);
    return res.json({ suggestions });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch suggestions.' });
  }
});

module.exports = router;
