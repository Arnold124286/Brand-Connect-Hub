const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // 1. Clean existing records (optional, but good for testing)
    // await db.query('TRUNCATE users CASCADE');

    const defaultPassword = 'password123';
    const hash = await bcrypt.hash(defaultPassword, 12);

    // 2. Insert Admin User
    const adminRes = await db.query(
      `INSERT INTO users (email, password_hash, full_name, user_type, is_verified) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (email) DO NOTHING
       RETURNING uid`,
      ['admin@brandconnecthub.com', hash, 'Admin User', 'admin', true]
    );
    if (adminRes.rows.length) {
      console.log('✅ Admin user created: admin@brandconnecthub.com / password123');
    }

    // 3. Insert Brand User
    const brandRes = await db.query(
      `INSERT INTO users (email, password_hash, full_name, user_type, is_verified) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (email) DO NOTHING
       RETURNING uid`,
      ['brand@example.com', hash, 'Awesome Brand Inc.', 'brand', true]
    );

    if (brandRes.rows.length) {
      const brandUid = brandRes.rows[0].uid;
      await db.query(
        `INSERT INTO brand_profiles (uid, company_name, industry) VALUES ($1, $2, $3)`,
        [brandUid, 'Awesome Brand Inc.', 'Technology']
      );
      console.log('✅ Brand user created: brand@example.com / password123');
    }

    // 4. Insert Vendor User
    const vendorRes = await db.query(
      `INSERT INTO users (email, password_hash, full_name, user_type, is_verified) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (email) DO NOTHING
       RETURNING uid`,
      ['vendor@example.com', hash, 'Creative Vendor', 'vendor', true]
    );

    if (vendorRes.rows.length) {
      const vendorUid = vendorRes.rows[0].uid;
      await db.query(
        `INSERT INTO vendor_profiles (uid, bio, specializations, verification_status) VALUES ($1, $2, $3, $4)`,
        [vendorUid, 'Expert in Web Development and SEO', '{Web Development, SEO}', 'approved']
      );
      console.log('✅ Vendor user created: vendor@example.com / password123');
    }

    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
