const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

function buildPool() {
  if (!connectionString) {
    return {
      query: async () => {
        throw new Error('DATABASE_URL is not configured');
      },
      end: async () => undefined,
    };
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  pool.on('error', (err) => {
    console.error('PostgreSQL error:', err);
  });

  return pool;
}

module.exports = buildPool();