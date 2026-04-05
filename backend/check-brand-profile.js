require('dotenv').config();
const db = require('./config/db');
(async () => {
  try {
    const { rows } = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name='brand_profiles' ORDER BY ordinal_position");
    console.log(rows.map(r => r.column_name).join('\n'));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
})();