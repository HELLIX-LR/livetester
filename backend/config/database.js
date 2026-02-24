const { Pool } = require('pg');

// Determine if we're in production (Render)
const isProduction = process.env.NODE_ENV === 'production';

// Database configuration
const config = {
  // If DATABASE_URL is provided (Render), use it
  ...(process.env.DATABASE_URL ? {
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? {
      rejectUnauthorized: false // Required for Render PostgreSQL
    } : false
  } : {
    // Otherwise use individual connection parameters
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'live_russia_dashboard',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  }),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased timeout for Render
};

const pool = new Pool(config);

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
