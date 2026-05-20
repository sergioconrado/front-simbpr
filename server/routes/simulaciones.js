// routes/simulaciones.js — Save/load simulation inputs per project
"use strict";

const { Router } = require("express");
const { getPool, sql } = require("../db");

const router = Router({ mergeParams: true }); // :proyectoId comes from parent

// ── Helper: validate proyectoId ───────────────────────────────────────────
function parseId(req, res) {
  const id = parseInt(req.params.proyectoId, 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "ID de proyecto inválido" });
    return null;
  }
  return id;
}

// ── GET /api/proyectos/:proyectoId/simulacion ─────────────────────────────
// Returns all simulation data for the project in one response.
router.get("/", async (req, res) => {
  const proyectoId = parseId(req, res);
  if (proyectoId === null) return;
  try {
    const pool = await getPool();
    const [ipr, prod, bsn, vlp] = await Promise.all([
      pool
        .request()
        .input("pid", sql.Int, proyectoId)
        .query("SELECT * FROM dbo.SimulacionIPR WHERE proyecto_id = @pid"),
      pool
        .request()
        .input("pid", sql.Int, proyectoId)
        .query(
          "SELECT * FROM dbo.SimulacionProduccion WHERE proyecto_id = @pid",
        ),
      pool
        .request()
        .input("pid", sql.Int, proyectoId)
        .query("SELECT * FROM dbo.SimulacionBSN WHERE proyecto_id = @pid"),
      pool
        .request()
        .input("pid", sql.Int, proyectoId)
        .query("SELECT * FROM dbo.SimulacionVLP WHERE proyecto_id = @pid"),
    ]);
    const vlpData = vlp.recordset[0];

    if (vlpData) {
      vlpData.parametros = vlpData.parametros_json
        ? JSON.parse(vlpData.parametros_json)
        : {};

      vlpData.puntos = vlpData.puntos_json
        ? JSON.parse(vlpData.puntos_json)
        : [];

      vlpData.punto_operacion = vlpData.punto_operacion_json
        ? JSON.parse(vlpData.punto_operacion_json)
        : null;
    }

    res.json({
      ipr: ipr.recordset[0] || null,
      produccion: prod.recordset[0] || null,
      bsn: bsn.recordset[0] || null,
      vlp: vlpData || null,
    });
  } catch (err) {
    console.error("[simulaciones] GET /", err.message);
    res.status(500).json({ error: "Error al obtener datos de simulación" });
  }
});

// ── PUT /api/proyectos/:proyectoId/simulacion/ipr ─────────────────────────
router.put("/ipr", async (req, res) => {
  const proyectoId = parseId(req, res);
  if (proyectoId === null) return;
  const {
    pws = 0,
    pwf = 0,
    qb = 0,
    j_index = 1,
    unidad = "kg",
    ipr_color = "#2563eb",
  } = req.body;
  try {
    const pool = await getPool();
    // Upsert: update if exists, insert if not
    const existing = await pool
      .request()
      .input("pid", sql.Int, proyectoId)
      .query("SELECT id FROM dbo.SimulacionIPR WHERE proyecto_id = @pid");

    let result;
    if (existing.recordset.length) {
      result = await pool
        .request()
        .input("pid", sql.Int, proyectoId)
        .input("pws", sql.Float, pws)
        .input("pwf", sql.Float, pwf)
        .input("qb", sql.Float, qb)
        .input("j_index", sql.Float, j_index)
        .input("unidad", sql.NVarChar(20), unidad)
        .input("ipr_color", sql.NVarChar(20), ipr_color).query(`
          UPDATE dbo.SimulacionIPR
          SET pws=@pws, pwf=@pwf, qb=@qb, j_index=@j_index,
              unidad=@unidad, ipr_color=@ipr_color, updated_at=GETUTCDATE()
          OUTPUT INSERTED.*
          WHERE proyecto_id = @pid
        `);
    } else {
      result = await pool
        .request()
        .input("pid", sql.Int, proyectoId)
        .input("pws", sql.Float, pws)
        .input("pwf", sql.Float, pwf)
        .input("qb", sql.Float, qb)
        .input("j_index", sql.Float, j_index)
        .input("unidad", sql.NVarChar(20), unidad)
        .input("ipr_color", sql.NVarChar(20), ipr_color).query(`
          INSERT INTO dbo.SimulacionIPR (proyecto_id, pws, pwf, qb, j_index, unidad, ipr_color)
          OUTPUT INSERTED.*
          VALUES (@pid, @pws, @pwf, @qb, @j_index, @unidad, @ipr_color)
        `);
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("[simulaciones] PUT /ipr", err.message);
    res.status(500).json({ error: "Error al guardar datos IPR" });
  }
});

// ── PUT /api/proyectos/:proyectoId/simulacion/produccion ──────────────────
router.put("/produccion", async (req, res) => {
  const proyectoId = parseId(req, res);
  if (proyectoId === null) return;
  const { qt = 0, bsw = 0, api = 35, gor = 0, bo = 1 } = req.body;
  try {
    const pool = await getPool();
    const existing = await pool
      .request()
      .input("pid", sql.Int, proyectoId)
      .query(
        "SELECT id FROM dbo.SimulacionProduccion WHERE proyecto_id = @pid",
      );

    let result;
    if (existing.recordset.length) {
      result = await pool
        .request()
        .input("pid", sql.Int, proyectoId)
        .input("qt", sql.Float, qt)
        .input("bsw", sql.Float, bsw)
        .input("api", sql.Float, api)
        .input("gor", sql.Float, gor)
        .input("bo", sql.Float, bo).query(`
          UPDATE dbo.SimulacionProduccion
          SET qt=@qt, bsw=@bsw, api=@api, gor=@gor, bo=@bo, updated_at=GETUTCDATE()
          OUTPUT INSERTED.*
          WHERE proyecto_id = @pid
        `);
    } else {
      result = await pool
        .request()
        .input("pid", sql.Int, proyectoId)
        .input("qt", sql.Float, qt)
        .input("bsw", sql.Float, bsw)
        .input("api", sql.Float, api)
        .input("gor", sql.Float, gor)
        .input("bo", sql.Float, bo).query(`
          INSERT INTO dbo.SimulacionProduccion (proyecto_id, qt, bsw, api, gor, bo)
          OUTPUT INSERTED.*
          VALUES (@pid, @qt, @bsw, @api, @gor, @bo)
        `);
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("[simulaciones] PUT /produccion", err.message);
    res.status(500).json({ error: "Error al guardar datos de producción" });
  }
});

// ── PUT /api/proyectos/:proyectoId/simulacion/bsn ─────────────────────────
router.put("/bsn", async (req, res) => {
  const proyectoId = parseId(req, res);
  if (proyectoId === null) return;
  const {
    etapas = 120,
    freq = 60,
    hp = 200,
    volt = 1150,
    amp = 92,
    depth = 2200,
    tempfondo = 90,
  } = req.body;
  try {
    const pool = await getPool();
    const existing = await pool
      .request()
      .input("pid", sql.Int, proyectoId)
      .query("SELECT id FROM dbo.SimulacionBSN WHERE proyecto_id = @pid");

    let result;
    if (existing.recordset.length) {
      result = await pool
        .request()
        .input("pid", sql.Int, proyectoId)
        .input("etapas", sql.Int, etapas)
        .input("freq", sql.Float, freq)
        .input("hp", sql.Float, hp)
        .input("volt", sql.Float, volt)
        .input("amp", sql.Float, amp)
        .input("depth", sql.Float, depth)
        .input("tempfondo", sql.Float, tempfondo).query(`
          UPDATE dbo.SimulacionBSN
          SET etapas=@etapas, freq=@freq, hp=@hp, volt=@volt,
              amp=@amp, depth=@depth, tempfondo=@tempfondo, updated_at=GETUTCDATE()
          OUTPUT INSERTED.*
          WHERE proyecto_id = @pid
        `);
    } else {
      result = await pool
        .request()
        .input("pid", sql.Int, proyectoId)
        .input("etapas", sql.Int, etapas)
        .input("freq", sql.Float, freq)
        .input("hp", sql.Float, hp)
        .input("volt", sql.Float, volt)
        .input("amp", sql.Float, amp)
        .input("depth", sql.Float, depth)
        .input("tempfondo", sql.Float, tempfondo).query(`
          INSERT INTO dbo.SimulacionBSN (proyecto_id, etapas, freq, hp, volt, amp, depth, tempfondo)
          OUTPUT INSERTED.*
          VALUES (@pid, @etapas, @freq, @hp, @volt, @amp, @depth, @tempfondo)
        `);
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("[simulaciones] PUT /bsn", err.message);
    res.status(500).json({ error: "Error al guardar datos BSN" });
  }
});

// ── PUT /api/proyectos/:proyectoId/simulacion/vlp ─────────────────────────
router.put("/vlp", async (req, res) => {
  const proyectoId = parseId(req, res);
  if (proyectoId === null) return;

  const {
    modelo = "vertical_lift_performance",
    parametros = {},
    puntos = [],
    punto_operacion = null,
    q_operacion = null,
    pwf_operacion = null,
    version = 1,
  } = req.body;

  try {
    const parametrosJson = JSON.stringify(parametros || {});
    const puntosJson = JSON.stringify(Array.isArray(puntos) ? puntos : []);
    const puntoOperacionJson = punto_operacion
      ? JSON.stringify(punto_operacion)
      : null;
    const qOperacion = Number.isFinite(Number(q_operacion))
      ? Number(q_operacion)
      : null;
    const pwfOperacion = Number.isFinite(Number(pwf_operacion))
      ? Number(pwf_operacion)
      : null;

    const pool = await getPool();
    const existing = await pool
      .request()
      .input("pid", sql.Int, proyectoId)
      .query("SELECT id FROM dbo.SimulacionVLP WHERE proyecto_id = @pid");

    let result;
    const request = pool
      .request()
      .input("pid", sql.Int, proyectoId)
      .input("modelo", sql.NVarChar(80), modelo)
      .input("parametros_json", sql.NVarChar(sql.MAX), parametrosJson)
      .input("puntos_json", sql.NVarChar(sql.MAX), puntosJson)
      .input("punto_operacion_json", sql.NVarChar(sql.MAX), puntoOperacionJson)
      .input("q_operacion", sql.Float, qOperacion)
      .input("pwf_operacion", sql.Float, pwfOperacion)
      .input(
        "version",
        sql.Int,
        Number.isFinite(Number(version)) ? Number(version) : 1,
      );

    if (existing.recordset.length) {
      result = await request.query(`
        UPDATE dbo.SimulacionVLP
        SET modelo=@modelo,
            parametros_json=@parametros_json,
            puntos_json=@puntos_json,
            punto_operacion_json=@punto_operacion_json,
            q_operacion=@q_operacion,
            pwf_operacion=@pwf_operacion,
            version=@version,
            updated_at=GETUTCDATE()
        OUTPUT INSERTED.*
        WHERE proyecto_id = @pid
      `);
    } else {
      result = await request.query(`
        INSERT INTO dbo.SimulacionVLP (
          proyecto_id, modelo, parametros_json, puntos_json,
          punto_operacion_json, q_operacion, pwf_operacion, version
        )
        OUTPUT INSERTED.*
        VALUES (
          @pid, @modelo, @parametros_json, @puntos_json,
          @punto_operacion_json, @q_operacion, @pwf_operacion, @version
        )
      `);
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("[simulaciones] PUT /vlp", err.message);
    res.status(500).json({ error: "Error al guardar datos VLP" });
  }
});

module.exports = router;
