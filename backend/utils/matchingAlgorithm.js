/**
 * Vendor Matching Algorithm - BCH
 * Score = (W_service * S) + (W_rating * R) + (W_budget * B) + (W_industry * I)
 */
const W_SERVICE  = 0.40;
const W_RATING   = 0.30;
const W_BUDGET   = 0.20;
const W_INDUSTRY = 0.10;

function computeMatchScore(project, vendor) {
  // S: Service match (1 if vendor specializes in project category, else 0)
  const serviceMatch = vendor.specializations &&
    vendor.specializations.some(s =>
      s.toLowerCase().includes(project.category.toLowerCase())
    ) ? 1 : 0;

  // R: Rating normalized 0→1
  const ratingScore = parseFloat(vendor.avg_rating || 0) / 5;

  // B: Budget alignment
  const vendorRate = parseFloat(vendor.hourly_rate || 0);
  const projectMid = (parseFloat(project.budget_min || 0) + parseFloat(project.budget_max || 0)) / 2;
  const budgetScore = projectMid > 0
    ? Math.max(0, 1 - Math.abs(projectMid - vendorRate) / projectMid)
    : 0.5;

  // I: Industry match
  const industryMatch = vendor.industries &&
    project.industry &&
    vendor.industries.some(i =>
      i.toLowerCase().includes(project.industry.toLowerCase())
    ) ? 1 : 0;

  const score =
    (W_SERVICE  * serviceMatch) +
    (W_RATING   * ratingScore)  +
    (W_BUDGET   * budgetScore)  +
    (W_INDUSTRY * industryMatch);

  return parseFloat(score.toFixed(4));
}

function rankVendors(project, vendors) {
  return vendors
    .map(v => ({ ...v, matchScore: computeMatchScore(project, v) }))
    .sort((a, b) => b.matchScore - a.matchScore);
}

module.exports = { computeMatchScore, rankVendors };
