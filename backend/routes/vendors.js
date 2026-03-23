const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/vendors - search vendors
router.get('/', authenticate, async (req, res) => {
  try {
    const { category, industry, min_rate, max_rate, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let conditions = ["vp.verification_status = 'approved'"];
    let params = [];
    let idx = 1;

    if (category) {
      conditions.push(`$${idx} = ANY(vp.specializations)`);
      params.push(category); idx++;
    }
    if (industry) {
      conditions.push(`$${idx} = ANY(vp.industries)`);
      params.push(industry); idx++;
    }
    if (min_rate) { conditions.push(`vp.hourly_rate >= $${idx++}`); params.push(min_rate); }
    if (max_rate) { conditions.push(`vp.hourly_rate <= $${idx++}`); params.push(max_rate); }

    params.push(limit, offset);
    const { rows } = await db.query(
      `SELECT vp.*, u.full_name, u.email, u.avatar_url, u.country
       FROM vendor_profiles vp JOIN users u ON u.uid = vp.uid
       WHERE ${conditions.join(' AND ')}
       ORDER BY vp.avg_rating DESC NULLS LAST, vp.total_reviews DESC
       LIMIT $${idx} OFFSET $${idx+1}`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// GET /api/vendors/:id - vendor public profile
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT vp.*, u.full_name, u.email, u.avatar_url, u.country, u.created_at AS member_since
       FROM vendor_profiles vp JOIN users u ON u.uid = vp.uid
       WHERE vp.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Vendor not found' });

    const services = await db.query('SELECT * FROM service_listings WHERE vendor_id=$1 AND is_active=TRUE', [req.params.id]);
    const portfolio = await db.query('SELECT * FROM portfolio_items WHERE vendor_id=$1 ORDER BY created_at DESC', [req.params.id]);
    const reviews = await db.query(
      `SELECT r.*, u.full_name AS reviewer_name, u.avatar_url AS reviewer_avatar
       FROM reviews r JOIN users u ON u.uid = r.reviewer_id
       WHERE r.reviewee_id = (SELECT uid FROM vendor_profiles WHERE id=$1)
       ORDER BY r.created_at DESC LIMIT 10`,
      [req.params.id]
    );

    res.json({ ...rows[0], services: services.rows, portfolio: portfolio.rows, reviews: reviews.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vendor' });
  }
});

// PATCH /api/vendors/profile - vendor updates own profile
router.patch('/profile', authenticate, requireRole('vendor'), async (req, res) => {
  const { bio, specializations, industries, hourlyRate, yearsExperience } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE vendor_profiles SET
         bio = COALESCE($1, bio),
         specializations = COALESCE($2, specializations),
         industries = COALESCE($3, industries),
         hourly_rate = COALESCE($4, hourly_rate),
         years_experience = COALESCE($5, years_experience)
       WHERE uid = $6 RETURNING *`,
      [bio, specializations, industries, hourlyRate, yearsExperience, req.user.uid]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/vendors/services - add service listing
router.post('/services', authenticate, requireRole('vendor'), async (req, res) => {
  const { title, category, subcategory, description, priceFrom, priceTo, deliveryDays } = req.body;
  try {
    const vp = await db.query('SELECT id FROM vendor_profiles WHERE uid=$1', [req.user.uid]);
    if (!vp.rows.length) return res.status(400).json({ error: 'Vendor profile not found' });

    const { rows } = await db.query(
      `INSERT INTO service_listings (vendor_id, title, category, subcategory, description, price_from, price_to, delivery_days)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [vp.rows[0].id, title, category, subcategory, description, priceFrom, priceTo, deliveryDays]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create service listing' });
  }
});

module.exports = router;
