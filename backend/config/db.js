const { Pool } = require('pg');

const poolConfig = {};

if (process.env.DATABASE_URL) {
  poolConfig.connectionString = process.env.DATABASE_URL;
  
  // Enable SSL for remote databases (production or external databases)
  const isLocalDb = process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');
  if (process.env.NODE_ENV === 'production' || !isLocalDb) {
    poolConfig.ssl = { rejectUnauthorized: false };
  }
} else {
  poolConfig.host = process.env.DB_HOST || 'localhost';
  poolConfig.port = parseInt(process.env.DB_PORT, 10) || 5432;
  poolConfig.user = process.env.DB_USER || 'postgres';
  poolConfig.password = process.env.DB_PASSWORD || '';
  poolConfig.database = process.env.DB_NAME || 'brand_connect_hub';
  
  if (process.env.NODE_ENV === 'production') {
    poolConfig.ssl = { rejectUnauthorized: false };
  }
}

poolConfig.max = process.env.DATABASE_URL ? 10 : 20; // limit pool size for cloud databases to avoid exceeding Neon's 10-connection limit
poolConfig.idleTimeoutMillis = 30000;
poolConfig.connectionTimeoutMillis = 15000; // 15 seconds connection timeout to support serverless database cold starts (Neon)

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected DB pool error', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};