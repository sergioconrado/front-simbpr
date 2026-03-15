// server/index.js — Express API server for SIMBPR
'use strict';

require('dotenv').config({ path: __dirname + '/.env' });

const express   = require('express');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');
const path      = require('path');

const proyectosRouter    = require('./routes/proyectos');
const simulacionesRouter = require('./routes/simulaciones');

const app  = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// ── Middleware ────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Global rate limiter: max 500 requests per minute per IP (covers static + API)
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes, intenta de nuevo en un minuto.' },
});
app.use(globalLimiter);

// Stricter rate limiter for the API: max 200 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes, intenta de nuevo en un minuto.' },
});
app.use('/api', apiLimiter);

// ── API routes ────────────────────────────────────────────────────────────
app.use('/api/proyectos', proyectosRouter);
app.use('/api/proyectos/:proyectoId/simulacion', simulacionesRouter);

// ── Serve static frontend ─────────────────────────────────────────────────
// When running in production, the Express server also serves index.html
// so the frontend and API share the same origin (no CORS needed in prod).
const frontendDir = path.join(__dirname, '..');
app.use(express.static(frontendDir));
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[SIMBPR API] Servidor iniciado en http://localhost:${PORT}`);
  console.log(`[SIMBPR API] Usando base de datos: ${process.env.DB_DATABASE || 'SIMBPR'} en ${process.env.DB_SERVER || 'localhost'}`);
});
