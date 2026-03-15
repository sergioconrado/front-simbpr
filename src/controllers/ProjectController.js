// ProjectController.js — Project CRUD events & coordination

import {
  getProyectos,
  getProyecto,
  getProyectoActivoIdx,
  setProyectoActivoIdx,
  agregarProyectoAPI,
  actualizarProyectoAPI,
  eliminarProyectoAPI,
  toggleEstadoProyectoAPI,
  crearDatosProyecto,
  cargarProyectosDesdeAPI,
} from '../models/ProjectModel.js';

import {
  renderProyectos,
  mostrarFormProyecto as mostrarFormView,
  ocultarFormProyecto,
  resaltarCamposRequeridos,
  leerFormProyecto,
  actualizarBarraContexto,
  actualizarFooter,
  mostrarBarraContexto,
} from '../views/ProjectView.js';

import { desactivarSubnavUI, mostrarSimulador, mostrarPanelProyectos } from '../views/AppView.js';

// ── índice del proyecto en edición (-1 = nuevo) ──────────────────────────
let _proyEditIndex = -1;

// ── Helpers ──────────────────────────────────────────────────────────────

function _renderizar() {
  renderProyectos(
    getProyectos(),
    abrirProyecto,
    editarProyecto,
    eliminarProyecto,
    toggleEstado,
  );
}

// ── Acciones públicas ─────────────────────────────────────────────────────

export function mostrarFormProyecto() {
  _proyEditIndex = -1;
  mostrarFormView(null);
}

export function cancelarFormProyecto() {
  ocultarFormProyecto();
}

export async function guardarProyecto() {
  const campos = leerFormProyecto();

  if (!campos.nombre || !campos.usuario || !campos.cliente) {
    resaltarCamposRequeridos(['proy-nombre', 'proy-usuario', 'proy-cliente']);
    return;
  }

  if (_proyEditIndex >= 0) {
    // Edición: conservar estado y fecha originales
    const original = getProyecto(_proyEditIndex);
    const data = { ...crearDatosProyecto(campos), estado: original.estado, fecha: original.fecha };
    await actualizarProyectoAPI(_proyEditIndex, data);
  } else {
    const idx = await agregarProyectoAPI(crearDatosProyecto(campos));
    ocultarFormProyecto();
    _renderizar();
    // Abrir automáticamente el nuevo proyecto
    abrirProyecto(idx);
    return;
  }

  ocultarFormProyecto();
  _renderizar();

  // Si editamos el proyecto activo, refrescar la barra de contexto
  if (getProyectoActivoIdx() === _proyEditIndex) {
    abrirProyecto(_proyEditIndex);
  }
}

export function editarProyecto(idx) {
  _proyEditIndex = idx;
  mostrarFormView(getProyecto(idx));
}

export async function toggleEstado(idx) {
  await toggleEstadoProyectoAPI(idx);
  _renderizar();
  if (getProyectoActivoIdx() === idx) abrirProyecto(idx);
}

export async function eliminarProyecto(idx) {
  if (!confirm(`¿Eliminar el proyecto "${getProyecto(idx)?.nombre}"?`)) return;
  const { wasActive } = await eliminarProyectoAPI(idx);
  if (wasActive) {
    mostrarBarraContexto(false);
    actualizarFooter(null);
  }
  _renderizar();
}

export function abrirProyecto(idx) {
  const p = getProyecto(idx);
  if (!p) return;
  setProyectoActivoIdx(idx);

  actualizarFooter(p);
  actualizarBarraContexto(p, idx);
  mostrarBarraContexto(true);

  // Desactivar subnav y mostrar simulador
  desactivarSubnavUI();
  mostrarSimulador(true);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function volverAProyectos() {
  setProyectoActivoIdx(-1);
  mostrarBarraContexto(false);
  mostrarSimulador(false);
  actualizarFooter(null);
  mostrarPanelProyectos();
}

/**
 * Loads all projects from SQL Server and renders the project list.
 * Called once on application startup (non-blocking).
 */
export async function inicializarProyectos() {
  await cargarProyectosDesdeAPI();
  _renderizar();
}
