// main.js — Application entry point
//
// Initializes all controllers and exposes the public API on `window` so that
// existing inline onclick attributes in the HTML continue to work.

import {
  crearGraficoInicial,
  actualizarGrafico,
  setUnidad,
  syncPSItoKG,
  setIPRColor,
  calcularProduccionHandler,
  calcularBSNHandler,
  mostrarPanel,
  mostrarReporte,
  mostrarTab,
  mostrarYacimientoTab,
  actualizarSensibilidadHandler,
  calcularRPFHandler,
  iniciarReloj,
  registrarListeners,
} from './controllers/SimulatorController.js';

import {
  mostrarFormProyecto,
  cancelarFormProyecto,
  guardarProyecto,
  editarProyecto,
  toggleEstado,
  eliminarProyecto,
  abrirProyecto,
  volverAProyectos,
  inicializarProyectos,
} from './controllers/ProjectController.js';

import {
  activarSubnav,
  guardarSubnavForm,
  agregarOrden,
  agregarComentario,
} from './controllers/AppController.js';

import {
  guardarProyectoActivo,
  inicializarGuardadoProyecto,
} from './controllers/SaveController.js';

import { mostrarPanelProyectos } from './views/AppView.js';

// ── Expose public API on window (required for inline onclick attributes) ──

window.actualizarGrafico    = actualizarGrafico;
window.setUnidad            = setUnidad;
window.syncPSItoKG          = syncPSItoKG;
window.setIPRColor          = setIPRColor;
window.calcularProduccion   = calcularProduccionHandler;
window.calcularBSN          = calcularBSNHandler;
window.mostrarPanel         = mostrarPanel;
window.mostrarReporte       = mostrarReporte;
window.mostrarTab           = mostrarTab;
window.mostrarYacimientoTab = mostrarYacimientoTab;
window.actualizarSensibilidad = actualizarSensibilidadHandler;
window.calcularRPF          = calcularRPFHandler;

window.mostrarFormProyecto  = mostrarFormProyecto;
window.cancelarFormProyecto = cancelarFormProyecto;
window.guardarProyecto      = guardarProyecto;
window.editarProyecto       = editarProyecto;
window.toggleEstado         = toggleEstado;
window.eliminarProyecto     = eliminarProyecto;
window.abrirProyecto        = abrirProyecto;
window.volverAProyectos     = volverAProyectos;
window.guardarProyectoActivo = guardarProyectoActivo;

window.activarSubnav        = activarSubnav;
window.guardarSubnavForm    = guardarSubnavForm;
window.agregarOrden         = agregarOrden;
window.agregarComentario    = agregarComentario;

// ── Initialization ────────────────────────────────────────────────────────

// ES module scripts are deferred — DOM is ready when this runs.
crearGraficoInicial();
registrarListeners();
iniciarReloj();
inicializarGuardadoProyecto();

// Start on the Projects tab
mostrarPanelProyectos();

// Load projects from SQL Server (non-blocking — UI is already usable)
inicializarProyectos();
