// routes/proyectos.js — REST CRUD for Proyectos
'use strict';

const { Router } = require('express');
const { getPool, sql } = require('../db');

const router = Router();

// ── GET /api/proyectos ────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(
      'SELECT * FROM dbo.Proyectos ORDER BY created_at DESC',
    );
    res.json(result.recordset);
  } catch (err) {
    console.error('[proyectos] GET /', err.message);
    res.status(500).json({ error: 'Error al obtener proyectos' });
  }
});

// ── GET /api/proyectos/:id ────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM dbo.Proyectos WHERE id = @id');
    if (!result.recordset.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('[proyectos] GET /:id', err.message);
    res.status(500).json({ error: 'Error al obtener proyecto' });
  }
});

// ── POST /api/proyectos ───────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { nombre, usuario, compania = '', cliente, orden = '', comentarios = '', fecha, estado = 'Activo' } = req.body;
  if (!nombre || !usuario || !cliente || !fecha) {
    return res.status(400).json({ error: 'Campos requeridos: nombre, usuario, cliente, fecha' });
  }
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('nombre',      sql.NVarChar(255), nombre)
      .input('usuario',     sql.NVarChar(255), usuario)
      .input('compania',    sql.NVarChar(255), compania)
      .input('cliente',     sql.NVarChar(255), cliente)
      .input('orden',       sql.NVarChar(100), orden)
      .input('comentarios', sql.NVarChar(sql.MAX), comentarios)
      .input('fecha',       sql.NVarChar(50),  fecha)
      .input('estado',      sql.NVarChar(50),  estado)
      .query(`
        INSERT INTO dbo.Proyectos (nombre, usuario, compania, cliente, orden, comentarios, fecha, estado)
        OUTPUT INSERTED.*
        VALUES (@nombre, @usuario, @compania, @cliente, @orden, @comentarios, @fecha, @estado)
      `);
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('[proyectos] POST /', err.message);
    res.status(500).json({ error: 'Error al crear proyecto' });
  }
});

// ── PUT /api/proyectos/:id ────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });
  const { nombre, usuario, compania = '', cliente, orden = '', comentarios = '', estado } = req.body;
  if (!nombre || !usuario || !cliente) {
    return res.status(400).json({ error: 'Campos requeridos: nombre, usuario, cliente' });
  }
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id',          sql.Int,           id)
      .input('nombre',      sql.NVarChar(255), nombre)
      .input('usuario',     sql.NVarChar(255), usuario)
      .input('compania',    sql.NVarChar(255), compania)
      .input('cliente',     sql.NVarChar(255), cliente)
      .input('orden',       sql.NVarChar(100), orden)
      .input('comentarios', sql.NVarChar(sql.MAX), comentarios)
      .input('estado',      sql.NVarChar(50),  estado || 'Activo')
      .query(`
        UPDATE dbo.Proyectos
        SET nombre = @nombre, usuario = @usuario, compania = @compania,
            cliente = @cliente, orden = @orden, comentarios = @comentarios,
            estado = @estado, updated_at = GETUTCDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);
    if (!result.recordset.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('[proyectos] PUT /:id', err.message);
    res.status(500).json({ error: 'Error al actualizar proyecto' });
  }
});

// ── PATCH /api/proyectos/:id/estado ──────────────────────────────────────
router.patch('/:id/estado', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });
  const ESTADOS = ['Activo', 'En pausa', 'Cerrado'];
  try {
    const pool = await getPool();
    // Get current estado
    const cur = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT estado FROM dbo.Proyectos WHERE id = @id');
    if (!cur.recordset.length) return res.status(404).json({ error: 'No encontrado' });
    const curEstado = cur.recordset[0].estado;
    const nextEstado = ESTADOS[(ESTADOS.indexOf(curEstado) + 1) % ESTADOS.length];
    const result = await pool
      .request()
      .input('id',     sql.Int,          id)
      .input('estado', sql.NVarChar(50), nextEstado)
      .query(`
        UPDATE dbo.Proyectos SET estado = @estado, updated_at = GETUTCDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('[proyectos] PATCH /:id/estado', err.message);
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
});

// ── DELETE /api/proyectos/:id ─────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    const pool = await getPool();
    await pool
      .request()
      .input('id', sql.Int, id)
      .query('DELETE FROM dbo.Proyectos WHERE id = @id');
    res.status(204).end();
  } catch (err) {
    console.error('[proyectos] DELETE /:id', err.message);
    res.status(500).json({ error: 'Error al eliminar proyecto' });
  }
});

module.exports = router;
