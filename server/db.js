// db.js — SQL Server connection pool

const sql = require("mssql");

const sql = require("mssql");

const config = {
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_DATABASE || "SIMBPR",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "1433", 10),
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
  },
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log("[DB] Conectado a SQL Server");
    return pool;
  })
  .catch((err) => {
    console.error("[DB] Error de conexión:", err.message);
    throw err;
  });

module.exports = {
  sql,
  poolPromise,
};

async function getPool() {
  return await sql.connect(config);
}

module.exports = {
  sql,
  getPool,
};
