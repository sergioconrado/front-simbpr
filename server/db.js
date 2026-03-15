// db.js — SQL Server connection pool
// Reads configuration from environment variables (see .env.example).

'use strict';

const sql = require('mssql');

const config = {
  server:   process.env.DB_SERVER   || 'localhost',
  port:     parseInt(process.env.DB_PORT || '1433', 10),
  database: process.env.DB_DATABASE || 'SIMBPR',
  options: {
    encrypt:                process.env.DB_ENCRYPT !== 'false',
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
    enableArithAbort:       true,
  },
};

if (process.env.DB_WINDOWS_AUTH === 'true') {
  config.options.trustedConnection = true;
} else {
  config.user     = process.env.DB_USER     || 'sa';
  config.password = process.env.DB_PASSWORD || '';
}

let _pool = null;

/**
 * Returns (and lazily creates) the shared connection pool.
 * @returns {Promise<sql.ConnectionPool>}
 */
async function getPool() {
  if (_pool) return _pool;
  _pool = await new sql.ConnectionPool(config).connect();
  _pool.on('error', (err) => {
    console.error('[DB] Pool error:', err.message);
    _pool = null;
  });
  return _pool;
}

module.exports = { getPool, sql };
