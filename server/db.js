// db.js — SQL Server connection pool

const sql = require("mssql");

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT || "1433"),
  database: process.env.DB_DATABASE,

  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

async function getPool() {
  return await sql.connect(config);
}

module.exports = {
  sql,
  getPool,
};
