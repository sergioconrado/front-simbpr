// db.js — SQL Server connection pool
// Reads configuration from environment variables (see .env.example).

const sql = require("mssql/msnodesqlv8");

const config = {
  connectionString:
    "Driver={ODBC Driver 18 for SQL Server};" +
    "Server=DESKTOP-GA2BORU\\SQLEXPRESS;" +
    "Database=SIMBPR;" +
    "Trusted_Connection=yes;" +
    "Encrypt=yes;" +
    "TrustServerCertificate=yes;",
};

async function getPool() {
  return await sql.connect(config);
}

module.exports = {
  sql,
  getPool,
};
