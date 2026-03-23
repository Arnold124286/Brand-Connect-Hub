/**
 * Brand Connect Hub — Vendor Matching Algorithm
 *
 * Weighted scoring formula (from the project proposal §5.3.4):
 *   Score = (W_Service × S) + (W_Rating × R) + (W_Budget × B) + (W_Industry × I)
 *
 * Where:
 *   S  = Service Match       (1 if vendor offers the service, else 0)
 *   R  = Avg Rating          (scaled 0–1 from 0–5 range)
 *   B  = Budget Alignment    (1 - |projectBudget - vendorBid| / projectBudget)
 *   I  = Industry Experience (1 if vendor lists the industry, else 0)
 *
 * Default weights (sum = 1.0):
 *   W_Service  = 0.40
 *   W_Rating   = 0.30
 *   W_Budget   = 0.20
 *   W_Industry = 0.10
 */

const { query } = require('../config/database');

const WEIGHTS = {
  service:  0.40,
  rating:   0.30,
  budget:   0.20,
  industry: 0.10,
};

/**
 * Compute the match score for a single vendor against a project.
 *
 * @param {Object} project  - { category, budget_max, industry }
 * @param {Object} vendor   - { specializations, avg_rating, industries }
 * @param {number} vendorBid - The vendor's proposed bid amount
 * @returns {number} score between 0 and 1
 */
function computeMatchScore(project, vendor, vendorBid) {
  // S — Service Match
  const specializations = vendor.specializations || [];
  const S = specializations.some(
    (s) => s.toLowerCase().includes(project.category.toLowerCase())
  ) ? 1 : 0;

  // R — Normalized Rating (0–5 → 0–1)
  const R = Math.min(parseFloat(vendor.avg_rating) / 5, 1);

  // B — Budget Alignment
  const projectBudget = parseFloat(project.budget_max) || 0;
  const B = projectBudget > 0
    ? Math.max(0, 1 - Math.abs(projectBudget - vendorBid) / projectBudget)
    : 0;

  // I — Industry Experience
  const industries = vendor.industries || [];
  const I = industries.some(
    (ind) => ind.toLowerCase().includes((project.industry || '').toLowerCase())
  ) ? 1 : 0;

  const score =
    WEIGHTS.service  * S +
    WEIGHTS.rating   * R +
    WEIGHTS.budget   * B +
    WEIGHTS.industry * I;

  return parseFloat(score.toFixed(4));
}

/**
 * Rank all vendors that have placed bids on a given project.
 * Returns the bids enriched with match_score, sorted best-first.
 *
 * @param {string} projectId - UUID of the project
 * @returns {Array<Object>} ranked bids
 */
async function rankVendorsForProject(projectId) {
  // Fetch project details
  const projResult = await query(
    'SELECT pid, category, budget_max, industry FROM projects WHERE pid = $1',
    [projectId]
  );
  if (!projResult.rows.length) throw new Error('Project not found');
  const project = projResult.rows[0];

  // Fetch all bids with vendor profile info
  const bidsResult = await query(
    `SELECT
       b.id AS bid_id,
       b.vendor_id,
       b.amount AS vendor_bid,
       b.proposal,
       b.delivery_days,
       b.status,
       u.full_name,
       u.avatar_url,
       vp.specializations,
       vp.industries,
       vp.avg_rating,
       vp.total_reviews
     FROM bids b
     JOIN users u ON u.uid = b.vendor_id
     LEFT JOIN vendor_profiles vp ON vp.vendor_id = b.vendor_id
     WHERE b.project_id = $1 AND b.status = 'pending'`,
    [projectId]
  );

  const ranked = bidsResult.rows.map((bid) => ({
    ...bid,
    match_score: computeMatchScore(project, bid, parseFloat(bid.vendor_bid)),
  }));

  // Sort descending by match_score
  ranked.sort((a, b) => b.match_score - a.match_score);

  return ranked;
}

/**
 * Suggest vendors for a new project (pre-bid discovery).
 * Searches vendor profiles without requiring a bid.
 *
 * @param {Object} projectData - { category, budget_max, industry }
 * @param {number} limit       - max results (default 10)
 * @returns {Array<Object>} scored vendor suggestions
 */
async function suggestVendors(projectData, limit = 10) {
  const vendorResult = await query(
    `SELECT
       u.uid,
       u.full_name,
       u.avatar_url,
       vp.specializations,
       vp.industries,
       vp.avg_rating,
       vp.total_reviews,
       vp.hourly_rate,
       vp.bio
     FROM users u
     JOIN vendor_profiles vp ON vp.vendor_id = u.uid
     WHERE u.user_type = 'vendor'
       AND u.is_active = TRUE
       AND vp.verification_status = 'approved'`,
    []
  );

  const scored = vendorResult.rows.map((vendor) => ({
    ...vendor,
    match_score: computeMatchScore(
      projectData,
      vendor,
      parseFloat(vendor.hourly_rate) || parseFloat(projectData.budget_max) * 0.8
    ),
  }));

  scored.sort((a, b) => b.match_score - a.match_score);
  return scored.slice(0, limit);
}

module.exports = { computeMatchScore, rankVendorsForProject, suggestVendors };
