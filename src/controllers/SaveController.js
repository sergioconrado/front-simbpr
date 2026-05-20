// SaveController.js - active project save flow, autosave and dirty tracking

import {
  getProyecto,
  getProyectoActivoIdx,
  guardarProyectoActivoAPI,
} from '../models/ProjectModel.js';
import { guardarSimulacionCompleta } from '../models/SimulationSaveModel.js';
import { obtenerSnapshotSimulacion } from './SimulatorController.js';
import { actualizarEstadoGuardado } from '../views/SaveView.js';

const AUTOSAVE_MS = 30000;

let hasPendingChanges = false;
let isSaving = false;
let autosaveTimer = null;

function getBackupKey(proyecto, idx) {
  return `simbpr:backup:${proyecto?.id || `local-${idx}`}`;
}

function crearSnapshotCompleto(proyecto, simulacion) {
  return {
    schema_version: 1,
    proyecto,
    simulacion,
    versioning_ready: true,
    created_at: new Date().toISOString(),
  };
}

function crearBackupTemporal(proyecto, idx, simulacion) {
  localStorage.setItem(
    getBackupKey(proyecto, idx),
    JSON.stringify(crearSnapshotCompleto(proyecto, simulacion)),
  );
}

export function marcarCambiosPendientes() {
  if (getProyectoActivoIdx() < 0 || isSaving) return;
  hasPendingChanges = true;
  actualizarEstadoGuardado('dirty');
}

export function reiniciarEstadoGuardado() {
  hasPendingChanges = false;
  isSaving = false;
  actualizarEstadoGuardado('clean');
}

export function desactivarGuardado() {
  hasPendingChanges = false;
  isSaving = false;
  actualizarEstadoGuardado('clean');
}

export async function guardarProyectoActivo({ automatico = false } = {}) {
  if (isSaving) return false;

  const idx = getProyectoActivoIdx();
  const proyecto = getProyecto(idx);

  if (idx < 0 || !proyecto) {
    actualizarEstadoGuardado('error', 'Selecciona un proyecto antes de guardar');
    return false;
  }

  try {
    isSaving = true;
    actualizarEstadoGuardado('saving');

    const simulacion = obtenerSnapshotSimulacion();
    crearBackupTemporal(proyecto, idx, simulacion);

    const proyectoGuardado = await guardarProyectoActivoAPI(idx);
    await guardarSimulacionCompleta(proyectoGuardado.id, simulacion);

    hasPendingChanges = false;
    actualizarEstadoGuardado('saved');

    setTimeout(() => {
      if (!hasPendingChanges && !isSaving) actualizarEstadoGuardado('clean');
    }, automatico ? 1800 : 2500);

    return true;
  } catch (err) {
    hasPendingChanges = true;
    actualizarEstadoGuardado('error', err.message);
    console.error('[SaveController] Error al guardar proyecto activo', err);
    return false;
  } finally {
    isSaving = false;
  }
}

function registrarDeteccionCambios() {
  document.addEventListener('input', (event) => {
    if (event.target.closest('#panel-simulador')) marcarCambiosPendientes();
  });

  document.addEventListener('change', (event) => {
    if (event.target.closest('#panel-simulador')) marcarCambiosPendientes();
  });

  window.__simbprMarkDirty = marcarCambiosPendientes;
}

function registrarAutosave() {
  autosaveTimer = setInterval(() => {
    if (hasPendingChanges && !isSaving && getProyectoActivoIdx() >= 0) {
      guardarProyectoActivo({ automatico: true });
    }
  }, AUTOSAVE_MS);
}

function registrarAvisoCierre() {
  window.addEventListener('beforeunload', (event) => {
    if (!hasPendingChanges || isSaving) return;
    event.preventDefault();
    event.returnValue = '';
  });
}

export function inicializarGuardadoProyecto() {
  reiniciarEstadoGuardado();
  registrarDeteccionCambios();
  registrarAvisoCierre();
  if (!autosaveTimer) registrarAutosave();
}
