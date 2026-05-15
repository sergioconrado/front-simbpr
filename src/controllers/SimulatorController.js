// SimulatorController.js — Simulator events & coordination

import { calcularCurvas } from '../models/IPRModel.js';
import { calcularCurvaVLP, encontrarInterseccionCurvas } from '../models/VLPModel.js';
import { calcularProduccion } from '../models/ProductionModel.js';
import { calcularBSN }        from '../models/BSNModel.js';
import { calcularRPF, calcularSensibilidad } from '../models/RPFModel.js';
import {
  esPSI,
  setCurrentUnidad,
  KGcm2_TO_PSI,
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

import { mostrarPanelUI, mostrarTabUI, mostrarYacimientoTabUI } from '../views/AppView.js';

// ── Color IPR activo ────────────────────────────────────────────────────────
let iprColor = '#2563eb';

// ── Helpers para leer inputs del DOM ───────────────────────────────────────
function getFloat(id, fallback = 0) {
  return parseFloat(document.getElementById(id)?.value) || fallback;
}

function leerParametrosVLP(Qmax) {
  const profundidadDisponible = getFloat('vlp_prof_disp', getFloat('pozo_prof_disp', 2450));
  return {
    qmax: Qmax,
    profundidadDisponible,
    profBSN: getFloat('vlp_bsn_depth', getFloat('bsn_depth', profundidadDisponible)),
    nivelLiquido: getFloat('vlp_nl', getFloat('pozo_nl', 500)),
    pl: getFloat('vlp_pl', getFloat('pozo_pl', 15)),
    pwh: getFloat('vlp_pwh', getFloat('pozo_pwh', 20)),
    tubingId: getFloat('vlp_tubing_id', getFloat('pozo_tubing_id', 2.441)),
    bsw: getFloat('vlp_bsw', getFloat('prod_bsw', 30)),
    api: getFloat('vlp_api', getFloat('prod_api', 35)),
    gor: getFloat('vlp_gor', getFloat('prod_gor', 150)),
    viscosidad: getFloat('vlp_visc', getFloat('prod_visc', 2.5)),
    etapas: getFloat('vlp_bsn_etapas', getFloat('bsn_etapas', 120)),
    freq: getFloat('vlp_bsn_freq', getFloat('bsn_freq', 60)),
  };
}

function calcularSistemaIPRVLP(pws, pwf, qb, J) {
  const datosIPR = calcularCurvas(pws, pwf, qb, J);
  const vlpParams = leerParametrosVLP(datosIPR.Qmax);
  const qVals = datosIPR.ipr.map((pt) => pt.x);
  const vlp = calcularCurvaVLP(qVals, vlpParams);
  const puntoOperacion = encontrarInterseccionCurvas(datosIPR.ipr, vlp);

  return {
    ...datosIPR,
    vlp,
    vlpParams,
    puntoOperacion,
    qOperacion: puntoOperacion?.x || 0,
    pwfSistema: puntoOperacion?.y || 0,
  };
}

function normalizarEtiquetasVLP() {
  const etiquetas = {
    vlp_nl: 'Nivel de liquido NL (m)',
    vlp_pwh: 'Pwh (kg/cm2)',
    vlp_pl: 'PL (kg/cm2)',
  };

  Object.entries(etiquetas).forEach(([inputId, texto]) => {
    const label = document.getElementById(inputId)?.previousElementSibling;
    if (label) label.textContent = texto;
  });
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

  const datos = calcularSistemaIPRVLP(pws, pwf, qb, J);

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

export function mostrarYacimientoTab(tab, boton) {
  mostrarYacimientoTabUI(tab, boton);
}

function _actualizarTablasDatosCompleto() {
  const pws   = getFloat('inputPws');
  const pwf   = getFloat('inputPwf');
  const J     = getFloat('inputJ', 1);
  const qb    = getFloat('inputQb');
  const isPSI = esPSI();
  const datos = calcularSistemaIPRVLP(pws, pwf, qb, J);

  actualizarTablasDatos({
    pws,
    pwf,
    Jactual: datos.J,
    Qmax: datos.Qmax,
    qOp: datos.qOperacion,
    isPSI,
    ipr: datos.ipr,
    vlpParams: datos.vlpParams,
  });
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
  normalizarEtiquetasVLP();

  [
    'inputPws',
    'inputPwf',
    'inputQb',
    'vlp_prof_disp',
    'vlp_bsn_depth',
    'vlp_nl',
    'vlp_pwh',
    'vlp_pl',
    'vlp_tubing_id',
    'vlp_bsw',
    'vlp_api',
    'vlp_gor',
    'vlp_visc',
    'vlp_bsn_etapas',
    'vlp_bsn_freq',
    'pozo_prof_disp',
    'pozo_pl',
    'pozo_pwh',
    'pozo_nl',
    'pozo_tubing_id',
    'prod_bsw',
    'prod_api',
    'prod_gor',
    'prod_visc',
    'bsn_depth',
    'bsn_etapas',
    'bsn_freq',
  ].forEach((id) => {
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
