// SimulatorController.js — Simulator events & coordination

import { calcularCurvas, calcularQmaxDesdePuntoVogel } from '../models/IPRModel.js';
import { calcularProduccion } from '../models/ProductionModel.js';
import { calcularBSN }        from '../models/BSNModel.js';
import { calcularRPF, calcularSensibilidad } from '../models/RPFModel.js';
import {
  esPSI,
  setCurrentUnidad,
  KGcm2_TO_PSI,
  pwsParaEje,
} from '../models/UnitModel.js';

import {
  crearGrafico,
  actualizarGrafico as actualizarGraficoView,
  setIPRChartColor,
  renderSensibilidadChart,
  renderPerfilRPFChart,
} from '../views/ChartView.js';

import {
  mostrarResultadosQmax,
  mostrarErrorVogel,
  actualizarInputJ,
  renderResultadosYTabla,
  actualizarUnidadUI,
  actualizarColorSwatch,
  actualizarTablasDatos,
  actualizarResultadosProduccion,
  actualizarResultadosBSN,
  actualizarResultadosRPF,
  actualizarResultadosSensibilidad,
  actualizarReloj,
} from '../views/SimulatorView.js';

import { mostrarPanelUI, mostrarTabUI } from '../views/AppView.js';

// ── Color IPR activo ────────────────────────────────────────────────────────
let iprColor = '#2563eb';

// ── Helpers para leer inputs del DOM ───────────────────────────────────────
function getFloat(id, fallback = 0) {
  return parseFloat(document.getElementById(id)?.value) || fallback;
}

// ── Cálculo y sincronización central ───────────────────────────────────────

/**
 * Lee los inputs del DOM, calcula las curvas y actualiza Model + View.
 * @returns {object} resultado de calcularCurvas()
 */
function _calcularYActualizar() {
  const pws = getFloat('inputPws');
  const pwf = getFloat('inputPwf');
  const qb  = getFloat('inputQb');
  const J   = getFloat('inputJ', 1);

  const datos = calcularCurvas(pws, pwf, qb, J);

  // Actualizar J calculado en el input oculto
  actualizarInputJ(datos.J);
  // Mostrar error si los parámetros son inválidos
  mostrarErrorVogel(datos.error);
  // Actualizar resumen de Qmax
  mostrarResultadosQmax(datos.Qmax);

  return datos;
}

// ── Acciones públicas ───────────────────────────────────────────────────────

export function crearGraficoInicial() {
  const datos = _calcularYActualizar();
  renderResultadosYTabla(datos);
  crearGrafico(datos);
}

export function actualizarGrafico() {
  const datos = _calcularYActualizar();
  renderResultadosYTabla(datos);
  actualizarGraficoView(datos);
}

export function setUnidad(unidad) {
  setCurrentUnidad(unidad);
  const isPSI = unidad === 'psi';
  const pws   = getFloat('inputPws');
  const pwf   = getFloat('inputPwf');
  actualizarUnidadUI(isPSI, pws, pwf);
  actualizarGrafico();
  if (!document.getElementById('panel-datos').classList.contains('hidden')) {
    _actualizarTablasDatosCompleto();
  }
}

export function syncPSItoKG(id) {
  const val   = getFloat(id);
  const kgVal = (val / KGcm2_TO_PSI).toFixed(4);
  if (id === 'inputPwsPSI') {
    document.getElementById('inputPws').value = kgVal;
  } else {
    document.getElementById('inputPwf').value = kgVal;
  }
  if (document.getElementById('autoCalibrarVogel')?.checked) actualizarGrafico();
  if (!document.getElementById('panel-datos').classList.contains('hidden')) {
    _actualizarTablasDatosCompleto();
  }
}

export function setIPRColor(color) {
  iprColor = color;
  actualizarColorSwatch(color);
  setIPRChartColor(color);
}

export function calcularProduccionHandler() {
  const params = {
    qt:  getFloat('prod_qt'),
    bsw: getFloat('prod_bsw'),
    api: getFloat('prod_api', 35),
    gor: getFloat('prod_gor'),
    bo:  getFloat('prod_bo', 1),
  };
  const resultado = calcularProduccion(params);
  actualizarResultadosProduccion(resultado);
}

export function calcularBSNHandler() {
  const params = {
    etapas: getFloat('bsn_etapas', 120),
    freq:   getFloat('bsn_freq', 60),
    hp:     getFloat('bsn_hp', 200),
    volt:   getFloat('bsn_volt', 1150),
    amp:    getFloat('bsn_amp', 92),
  };
  const resultado = calcularBSN(params);
  actualizarResultadosBSN(resultado);
}

export function mostrarPanel(panelId, boton) {
  mostrarPanelUI(panelId, boton);
  if (panelId === 'panel-datos')        _actualizarTablasDatosCompleto();
  if (panelId === 'panel-sensibilidad') actualizarSensibilidadHandler();
  if (panelId === 'panel-perfilrpf')    calcularRPFHandler();
}

export function mostrarTab(tab, boton) {
  mostrarTabUI(tab, boton);
}

function _actualizarTablasDatosCompleto() {
  const pws   = getFloat('inputPws');
  const pwf   = getFloat('inputPwf');
  const J     = getFloat('inputJ', 1);
  const qb    = getFloat('inputQb');
  const isPSI = esPSI();

  // Compute Qmax & J via model
  let Jactual = J, Qmax;
  const Qcalc = calcularQmaxDesdePuntoVogel(pws, pwf, qb);
  if (Qcalc !== null && Qcalc > 0) {
    Jactual = (1.8 * Qcalc) / (pws || 1);
    Qmax    = Qcalc;
  } else {
    Qmax = (J * pws) / 1.8;
  }

  // Find operating point
  let qOp = 0, diffMin = Infinity;
  const N = 60;
  for (let i = 0; i <= N; i++) {
    const q      = (i / N) * Qmax;
    const pCalc  = pws * (1 - 0.2 * (q / Qmax) - 0.8 * Math.pow(q / Qmax, 2));
    const diff   = Math.abs(pCalc - pwf);
    if (diff < diffMin) { diffMin = diff; qOp = q; }
  }

  actualizarTablasDatos({ pws, pwf, Jactual, Qmax, qOp, isPSI });
}

export function actualizarSensibilidadHandler() {
  const pws      = getFloat('inputPws', 210);
  const pwf      = getFloat('inputPwf', 178);
  const J        = getFloat('inputJ', 1.5);
  const variable = document.getElementById('sens-variable')?.value || 'j';
  const sMin     = getFloat('sens-min', 0.5);
  const sMax     = getFloat('sens-max', 3.0);

  const { rows, xVals, qmaxVals, qopVals, label } =
    calcularSensibilidad({ pws, pwf, J, variable, sMin, sMax });

  actualizarResultadosSensibilidad(rows, label);
  renderSensibilidadChart(xVals, qmaxVals, qopVals, label);
}

export function calcularRPFHandler() {
  const pws     = getFloat('inputPws', 210);
  const pwf     = getFloat('inputPwf', 178);
  const J       = getFloat('inputJ', 1.5);
  const profBSN = getFloat('bsn_depth', 2200);
  const bht     = getFloat('bsn_tempfondo', 90);

  const resultado = calcularRPF({ pws, pwf, J, profBSN, bht });
  actualizarResultadosRPF(resultado);
  renderPerfilRPFChart(resultado.depths, resultado.pressures, resultado.temps);
}

// ── Reloj ───────────────────────────────────────────────────────────────────
export function iniciarReloj() {
  actualizarReloj();
  setInterval(actualizarReloj, 30000);
}

// ── Listeners de auto-graficado ─────────────────────────────────────────────
export function registrarListeners() {
  ['inputPws', 'inputPwf', 'inputQb'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        if (document.getElementById('autoCalibrarVogel')?.checked) actualizarGrafico();
      });
    }
  });

  document.getElementById('autoCalibrarVogel')?.addEventListener('change', () => {
    actualizarGrafico();
  });

  // Inicializar swatch de color por defecto
  actualizarColorSwatch(iprColor);
}
