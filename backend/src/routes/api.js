const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, withTransaction } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// ══════════════════════════════════════════════════════════════
//  VENDOR ROUTES
// ══════════════════════════════════════════════════════════════

// GET /api/vendors — list approved vendors
router.get('/', async (req, res) => {
  try {
    const { category, industry, rating, search, page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = ["u.user_type = 'vendor'", "u.is_active = TRUE", "vp.verification_status = 'approved'"];

    if (rating)   { params.push(rating); conditions.push(`vp.avg_rating >= $${params.length}`); }
    if (search)   { params.push(`%${search}%`); conditions.push(`(u.full_name ILIKE $${params.length} OR u.company_name ILIKE $${params.length} OR vp.bio ILIKE $${params.length})`); }
    if (category) { params.push(`{${category}}`); conditions.push(`vp.specializations && $${params.length}::text[]`); }
    if (industry) { params.push(`{${industry}}`); conditions.push(`vp.industries && $${params.length}::text[]`); }

    const where = `WHERE ${conditions.join(' AND ')}`;
    params.push(limit, offset);

    const result = await query(
      `SELECT u.uid, u.full_name, u.company_name, u.avatar_url, u.country,
              vp.bio, vp.specializations, vp.industries, vp.avg_rating,
              vp.total_reviews, vp.hourly_rate
       FROM users u JOIN vendor_profiles vp ON vp.vendor_id = u.uid
       ${where}
       ORDER BY vp.avg_rating DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM users u JOIN vendor_profiles vp ON vp.vendor_id = u.uid ${where}`,
      params.slice(0, -2)
    );

    return res.json({
      vendors: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
    });
  } catch (err) {
    console.error('Get vendors error:', err);
    return res.status(500).json({ error: 'Failed to fetch vendors.' });
  }
});

// GET /api/vendors/:id — vendor public profile
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT u.uid, u.full_name, u.company_name, u.avatar_url, u.country, u.created_at,
              vp.*
       FROM users u JOIN vendor_profiles vp ON vp.vendor_id = u.uid
       WHERE u.uid = $1 AND u.user_type = 'vendor'`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Vendor not found.' });

    const vendor = result.rows[0];

    // Portfolio
    const portfolio = await query(
      'SELECT * FROM portfolio_items WHERE vendor_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );

    // Services
    const services = await query(
      "SELECT * FROM service_listings WHERE vendor_id = $1 AND is_active = TRUE ORDER BY created_at DESC",
      [req.params.id]
    );

    // Reviews
    const reviews = await query(
      `SELECT r.*, u.full_name AS reviewer_name, u.avatar_url AS reviewer_avatar
       FROM reviews r JOIN users u ON u.uid = r.reviewer_id
       WHERE r.reviewee_id = $1 ORDER BY r.created_at DESC LIMIT 10`,
      [req.params.id]
    );

    return res.json({ vendor, portfolio: portfolio.rows, services: services.rows, reviews: reviews.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch vendor profile.' });
  }
});

// PUT /api/vendors/profile — update own vendor profile
router.put('/profile', authenticate, authorize('vendor'), async (req, res) => {
  const { bio, specializations, industries, hourlyRate, linkedinUrl, websiteUrl, companyName, phone } = req.body;
  try {
    await query(
      `UPDATE vendor_profiles SET bio=$1, specializations=$2, industries=$3,
       hourly_rate=$4, linkedin_url=$5, website_url=$6, updated_at=NOW()
       WHERE vendor_id=$7`,
      [bio, specializations, industries, hourlyRate, linkedinUrl, websiteUrl, req.user.uid]
    );
    await query(
      'UPDATE users SET company_name=$1, phone=$2 WHERE uid=$3',
      [companyName, phone, req.user.uid]
    );
    return res.json({ message: 'Profile updated.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// POST /api/vendors/portfolio — add portfolio item
router.post('/portfolio', authenticate, authorize('vendor'), async (req, res) => {
  const { title, description, imageUrl, projectUrl, tags } = req.body;
  try {
    const result = await query(
      'INSERT INTO portfolio_items (vendor_id, title, description, image_url, project_url, tags) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [req.user.uid, title, description, imageUrl, projectUrl, tags]
    );
    return res.status(201).json({ item: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to add portfolio item.' });
  }
});

// ══════════════════════════════════════════════════════════════
//  SERVICE LISTINGS
// ══════════════════════════════════════════════════════════════

// GET /api/services
router.get('/services', async (req, res) => {
  try {
    const { category, subCategory } = req.query;
    const params = [];
    const conditions = ['sl.is_active = TRUE'];
    if (category)    { params.push(`%${category}%`);    conditions.push(`sl.category ILIKE $${params.length}`); }
    if (subCategory) { params.push(`%${subCategory}%`); conditions.push(`sl.sub_category ILIKE $${params.length}`); }

    const result = await query(
      `SELECT sl.*, u.full_name AS vendor_name, u.avatar_url, vp.avg_rating
       FROM service_listings sl
       JOIN users u ON u.uid = sl.vendor_id
       LEFT JOIN vendor_profiles vp ON vp.vendor_id = sl.vendor_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY vp.avg_rating DESC NULLS LAST`,
      params
    );
    return res.json({ services: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch services.' });
  }
});

// POST /api/services — vendor creates a service listing
router.post('/services', authenticate, authorize('vendor'), async (req, res) => {
  const { title, description, category, subCategory, priceType, priceMin, priceMax, deliveryDays, tags } = req.body;
  try {
    const result = await query(
      `INSERT INTO service_listings (vendor_id, title, description, category, sub_category, price_type, price_min, price_max, delivery_days, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.user.uid, title, description, category, subCategory, priceType, priceMin, priceMax, deliveryDays, tags]
    );
    return res.status(201).json({ service: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create service.' });
  }
});

// ══════════════════════════════════════════════════════════════
//  TRANSACTIONS (Escrow)
// ══════════════════════════════════════════════════════════════

// GET /api/transactions — user's transactions
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const col = req.user.user_type === 'vendor' ? 'vendor_id' : 'brand_id';
    const result = await query(
      `SELECT t.*, p.title AS project_title,
              bu.full_name AS brand_name, vu.full_name AS vendor_name
       FROM transactions t
       JOIN projects p ON p.pid = t.project_id
       JOIN users bu ON bu.uid = t.brand_id
       JOIN users vu ON vu.uid = t.vendor_id
       WHERE t.${col} = $1 ORDER BY t.created_at DESC`,
      [req.user.uid]
    );
    return res.json({ transactions: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch transactions.' });
  }
});

// POST /api/transactions/release — brand releases escrow payment
router.post('/transactions/release', authenticate, authorize('brand'), async (req, res) => {
  const { transactionId } = req.body;
  const PLATFORM_FEE = parseFloat(process.env.PLATFORM_FEE_PERCENT || '10') / 100;

  try {
    await withTransaction(async (client) => {
      const txResult = await client.query(
        "SELECT * FROM transactions WHERE tid = $1 AND brand_id = $2 AND status = 'escrow'",
        [transactionId, req.user.uid]
      );
      if (!txResult.rows.length) throw { status: 404, message: 'Transaction not found or not in escrow.' };
      const tx = txResult.rows[0];

      const fee = tx.amount * PLATFORM_FEE;
      const net = tx.amount - fee;

      await client.query(
        "UPDATE transactions SET status='released', platform_fee=$1, net_amount=$2 WHERE tid=$3",
        [fee, net, tx.tid]
      );

      // Update vendor earnings
      await client.query(
        'UPDATE vendor_profiles SET total_earnings = total_earnings + $1 WHERE vendor_id = $2',
        [net, tx.vendor_id]
      );

      // Mark project complete if all milestones paid
      await client.query(
        "UPDATE projects SET status='completed' WHERE pid=$1",
        [tx.project_id]
      );

      // Notify vendor
      await client.query(
        `INSERT INTO notifications (user_id, type, title, body, metadata) VALUES ($1,'payment_released','Payment Released!', $2, $3)`,
        [tx.vendor_id, `KES ${net} has been released to your account.`, JSON.stringify({ transaction_id: tx.tid })]
      );
    });

    return res.json({ message: 'Payment released to vendor.' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    return res.status(500).json({ error: 'Failed to release payment.' });
  }
});

// ══════════════════════════════════════════════════════════════
//  MESSAGES
// ══════════════════════════════════════════════════════════════

// GET /api/messages/:projectId — messages for a project
router.get('/messages/:projectId', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT m.*, u.full_name AS sender_name, u.avatar_url AS sender_avatar
       FROM messages m JOIN users u ON u.uid = m.sender_id
       WHERE m.project_id = $1 AND (m.sender_id = $2 OR m.receiver_id = $2)
       ORDER BY m.created_at ASC`,
      [req.params.projectId, req.user.uid]
    );
    // Mark messages as read
    await query(
      'UPDATE messages SET is_read = TRUE WHERE project_id = $1 AND receiver_id = $2 AND is_read = FALSE',
      [req.params.projectId, req.user.uid]
    );
    return res.json({ messages: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// POST /api/messages — send a message
router.post('/messages', authenticate, async (req, res) => {
  const { projectId, receiverId, content, fileUrl } = req.body;
  try {
    const result = await query(
      'INSERT INTO messages (project_id, sender_id, receiver_id, content, file_url) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [projectId || null, req.user.uid, receiverId, content, fileUrl || null]
    );
    await query(
      `INSERT INTO notifications (user_id, type, title, body, metadata) VALUES ($1,'message','New Message',$2,$3)`,
      [receiverId, `${req.user.full_name} sent you a message.`, JSON.stringify({ project_id: projectId })]
    );
    return res.status(201).json({ message: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to send message.' });
  }
});

// ══════════════════════════════════════════════════════════════
//  REVIEWS
// ══════════════════════════════════════════════════════════════

// POST /api/reviews — submit a review
router.post('/reviews', authenticate, [
  body('projectId').isUUID(),
  body('revieweeId').isUUID(),
  body('rating').isFloat({ min: 1, max: 5 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { projectId, revieweeId, rating, title, comments } = req.body;
  try {
    const result = await query(
      'INSERT INTO reviews (project_id, reviewer_id, reviewee_id, rating, title, comments) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [projectId, req.user.uid, revieweeId, rating, title, comments]
    );

    // Recompute vendor avg_rating
    await query(
      `UPDATE vendor_profiles
       SET avg_rating = (SELECT AVG(rating) FROM reviews WHERE reviewee_id = $1),
           total_reviews = (SELECT COUNT(*) FROM reviews WHERE reviewee_id = $1)
       WHERE vendor_id = $1`,
      [revieweeId]
    );

    return res.status(201).json({ review: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'You have already reviewed this project.' });
    return res.status(500).json({ error: 'Failed to submit review.' });
  }
});

// ══════════════════════════════════════════════════════════════
//  NOTIFICATIONS
// ══════════════════════════════════════════════════════════════

// GET /api/notifications
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.uid]
    );
    return res.json({ notifications: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

// PUT /api/notifications/read-all
router.put('/notifications/read-all', authenticate, async (req, res) => {
  try {
    await query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [req.user.uid]);
    return res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update notifications.' });
  }
});

// ══════════════════════════════════════════════════════════════
//  ADMIN ROUTES
// ══════════════════════════════════════════════════════════════

// GET /api/admin/stats
router.get('/admin/stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [users, projects, transactions, pending] = await Promise.all([
      query("SELECT COUNT(*) FROM users WHERE user_type != 'admin'"),
      query("SELECT COUNT(*) FROM projects"),
      query("SELECT SUM(amount) AS total, COUNT(*) AS count FROM transactions WHERE status = 'released'"),
      query("SELECT COUNT(*) FROM vendor_profiles WHERE verification_status = 'pending'"),
    ]);

    return res.json({
      totalUsers:    parseInt(users.rows[0].count),
      totalProjects: parseInt(projects.rows[0].count),
      totalRevenue:  parseFloat(transactions.rows[0].total) || 0,
      totalTx:       parseInt(transactions.rows[0].count),
      pendingVerifications: parseInt(pending.rows[0].count),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch admin stats.' });
  }
});

// GET /api/admin/users
router.get('/admin/users', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { type, search, page = 1, limit = 20 } = req.query;
    const params = [];
    const conditions = [];
    if (type)   { params.push(type);         conditions.push(`user_type = $${params.length}`); }
    if (search) { params.push(`%${search}%`); conditions.push(`(full_name ILIKE $${params.length} OR email ILIKE $${params.length})`); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, (page - 1) * limit);
    const result = await query(
      `SELECT uid, user_type, email, full_name, company_name, is_verified, is_active, created_at
       FROM users ${where} ORDER BY created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`,
      params
    );
    return res.json({ users: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// PUT /api/admin/vendor/:id/verify
router.put('/admin/vendor/:id/verify', authenticate, authorize('admin'), async (req, res) => {
  const { status } = req.body; // 'approved' or 'rejected'
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved or rejected.' });
  }
  try {
    await query(
      'UPDATE vendor_profiles SET verification_status = $1 WHERE vendor_id = $2',
      [status, req.params.id]
    );
    if (status === 'approved') {
      await query('UPDATE users SET is_verified = TRUE WHERE uid = $1', [req.params.id]);
    }
    await query(
      `INSERT INTO notifications (user_id, type, title, body) VALUES ($1, 'verification', $2, $3)`,
      [req.params.id, `Account ${status}`, `Your vendor account has been ${status} by BCH admin.`]
    );
    return res.json({ message: `Vendor ${status} successfully.` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update vendor status.' });
  }
});

// PUT /api/admin/user/:id/suspend
router.put('/admin/user/:id/suspend', authenticate, authorize('admin'), async (req, res) => {
  try {
    await query('UPDATE users SET is_active = FALSE WHERE uid = $1', [req.params.id]);
    return res.json({ message: 'User suspended.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to suspend user.' });
  }
});

// GET /api/admin/disputes
router.get('/admin/disputes', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await query(
      `SELECT d.*, p.title AS project_title,
              u1.full_name AS raised_by_name, u2.full_name AS against_name
       FROM disputes d
       JOIN projects p ON p.pid = d.project_id
       JOIN users u1 ON u1.uid = d.raised_by
       JOIN users u2 ON u2.uid = d.against
       ORDER BY d.created_at DESC`
    );
    return res.json({ disputes: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch disputes.' });
  }
});

// POST /api/admin/dispute/:id/resolve
router.post('/admin/dispute/:id/resolve', authenticate, authorize('admin'), async (req, res) => {
  const { resolution } = req.body;
  try {
    await query(
      "UPDATE disputes SET status='resolved', resolution=$1, resolved_by=$2 WHERE id=$3",
      [resolution, req.user.uid, req.params.id]
    );
    return res.json({ message: 'Dispute resolved.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to resolve dispute.' });
  }
});

module.exports = router;
