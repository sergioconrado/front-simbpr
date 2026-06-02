const sql = require("mssql");

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: Number(process.env.DB_PORT || 1433),

  options: {
    encrypt: true,
    trustServerCertificate: false,
  },

  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },

  connectionTimeout: 60000,
  requestTimeout: 60000,
};

let poolPromise = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectWithRetry(retries = 3) {
  let lastError;

  for (let intento = 1; intento <= retries; intento++) {
    try {
      console.log(`[DB] Intento de conexión ${intento}/${retries}...`);
      return await sql.connect(config);
    } catch (error) {
      lastError = error;
      console.error(`[DB] Falló intento ${intento}:`, error.message);

      if (intento < retries) {
        await sleep(3000);
      }
    }
  }

  throw lastError;
}

async function getPool() {
  try {
    if (!poolPromise) {
      poolPromise = connectWithRetry(3);
    }

    return await poolPromise;
  } catch (error) {
    console.error("[DB] Error de conexión:", error.message);

    poolPromise = null;

    throw error;
  }
}

module.exports = {
  sql,
  getPool,
};
