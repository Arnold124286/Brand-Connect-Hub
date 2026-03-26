const db = require('../config/db');

async function seedTestProjectAndBid() {
  try {
    const brand = await db.query('SELECT uid FROM users WHERE email=$1', ['brand@example.com']);
    const vendor = await db.query('SELECT id FROM vendor_profiles vp JOIN users u ON u.uid = vp.uid WHERE u.email=$1', ['vendor@example.com']);
    
    if (!brand.rows.length || !vendor.rows.length) {
      console.log('Test users not found');
      return;
    }

    const res = await db.query(
      `INSERT INTO projects (brand_id, title, description, category, budget_type, budget_min, budget_max, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'open') 
       RETURNING pid`,
      [brand.rows[0].uid, 'Test Project for E2E Flow', 'Test description', 'Web Development', 'fixed', 10000, 20000]
    );
    const pid = res.rows[0].pid;

    await db.query(
      `INSERT INTO bids (project_id, vendor_id, proposal, bid_amount, delivery_days, status) 
       VALUES ($1, $2, $3, $4, $5, 'pending')`,
      [pid, vendor.rows[0].id, 'I can do this test project quickly!', 15000, 7]
    );

    console.log('Project and Bid seeded successfully!');
    process.exit(0);
  } catch (err) {
    if (err.code !== '23505') console.error(err);
    process.exit(0); // Ignore unique constraint if already seeded
  }
}
seedTestProjectAndBid();
