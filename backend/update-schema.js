require('dotenv').config();
const db = require('./config/db');
(async () => {
  try {
    await db.query("ALTER TABLE brand_profiles ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(12,2) DEFAULT 0.00");
    await db.query("ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS credits NUMERIC(10,2) DEFAULT 10.00");
    console.log('Schema update completed successfully');
  } catch (err) {
    console.error('Schema update failed:', err);
  } finally {
    process.exit(0);
  }
})();