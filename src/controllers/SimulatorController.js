// SimulatorController.js — Simulator events & coordination

import { calcularCurvas } from "../models/IPRModel.js";
import {
  calcularCurvaVLP,
  encontrarInterseccionCurvas,
} from "../models/VLPModel.js";
import { calcularProduccion } from "../models/ProductionModel.js";
import { calcularBSN } from "../models/BSNModel.js";
import { calcularRPF, calcularSensibilidad } from "../models/RPFModel.js";
import { api } from "../services/ApiService.js";
import {
  esPSI,
  getCurrentUnidad,
  setCurrentUnidad,
  KGcm2_TO_PSI,
} from "../models/UnitModel.js";

import {
  crearGrafico,
  actualizarGrafico as actualizarGraficoView,
  descargarGraficoPrincipalPNG,
  crearGraficoPrincipalVacio,
  destruirGraficosSimulacion,
  forzarResizeGraficoPrincipal,
  graficoPrincipalTieneDatos,
  obtenerImagenGraficoPrincipalPNG,
  setIPRChartColor,
  renderReporteVLPChart,
  renderSensibilidadChart,
  renderPerfilRPFChart,
} from "../views/ChartView.js";

import {
  mostrarResultadosQmax,
  mostrarErrorVogel,
  actualizarInputJ,
  renderResultadosYTabla,
  renderResumenVLP,
  renderReporteVLP,
  mostrarReporteUI,
  actualizarUnidadUI,
  actualizarColorSwatch,
  actualizarTablasDatos,
  actualizarResultadosProduccion,
  actualizarResultadosBSN,
  actualizarResultadosRPF,
  actualizarResultadosSensibilidad,
  actualizarReloj,
  abrirInformeTecnicoImprimible,
  limpiarResultadosSimulacion,
  limpiarFeedbackGrafica,
  mostrarFeedbackGrafica,
  reiniciarFormularioSimulacion,
} from "../views/SimulatorView.js";

import {
  mostrarPanelUI,
  mostrarTabUI,
  mostrarYacimientoTabUI,
} from "../views/AppView.js";
import { getProyecto, getProyectoActivoIdx } from "../models/ProjectModel.js";

// ── Color IPR activo ────────────────────────────────────────────────────────
let iprColor = "#2563eb";
let reporteActivo = "ipr";
let datosSimulacionActual = null;
let vistaGraficaLimpia = false;

const SIMULATION_INPUT_IDS = [
  "inputPws",
  "inputPwsPSI",
  "inputPwf",
  "inputPwfPSI",
  "inputQb",
  "inputJ",
  "vlp_prof_disp",
  "vlp_bsn_depth",
  "vlp_nl",
  "vlp_pwh",
  "vlp_pl",
  "vlp_tubing_id",
  "vlp_bsw",
  "vlp_api",
  "vlp_gor",
  "vlp_visc",
  "vlp_bsn_etapas",
  "vlp_bsn_freq",
  "pozo_prof_disp",
  "pozo_pl",
  "pozo_pwh",
  "pozo_nl",
  "pozo_tubing_id",
  "prod_qt",
  "prod_bsw",
  "prod_api",
  "prod_gor",
  "prod_bo",
  "prod_visc",
  "bsn_etapas",
  "bsn_freq",
  "bsn_hp",
  "bsn_volt",
  "bsn_amp",
  "bsn_depth",
  "bsn_tempfondo",
];

// ── Helpers para leer inputs del DOM ───────────────────────────────────────
function getFloat(id, fallback = 0) {
  return parseFloat(document.getElementById(id)?.value) || fallback;
}

function leerParametrosVLP(Qmax) {
  const profundidadDisponible = getFloat(
    "vlp_prof_disp",
    getFloat("pozo_prof_disp", 2450),
  );
  return {
    qmax: Qmax,
    profundidadDisponible,
    profBSN: getFloat(
      "vlp_bsn_depth",
      getFloat("bsn_depth", profundidadDisponible),
    ),
    nivelLiquido: getFloat("vlp_nl", getFloat("pozo_nl", 500)),
    pl: getFloat("vlp_pl", getFloat("pozo_pl", 15)),
    pwh: getFloat("vlp_pwh", getFloat("pozo_pwh", 20)),
    tubingId: getFloat("vlp_tubing_id", getFloat("pozo_tubing_id", 2.441)),
    bsw: getFloat("vlp_bsw", getFloat("prod_bsw", 30)),
    api: getFloat("vlp_api", getFloat("prod_api", 35)),
    gor: getFloat("vlp_gor", getFloat("prod_gor", 150)),
    viscosidad: getFloat("vlp_visc", getFloat("prod_visc", 2.5)),
    etapas: getFloat("vlp_bsn_etapas", getFloat("bsn_etapas", 120)),
    freq: getFloat("vlp_bsn_freq", getFloat("bsn_freq", 60)),
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

function crearResumenVLP(datos, isPSI = esPSI()) {
  const vlp = Array.isArray(datos.vlp) ? datos.vlp : [];
  const presiones = vlp.map((pt) => Number(pt?.y)).filter(Number.isFinite);
  const caudales = vlp.map((pt) => Number(pt?.x)).filter(Number.isFinite);
  const convertirPresion = (value) => (isPSI ? value * KGcm2_TO_PSI : value);
  const tieneCurva =
    vlp.length > 0 && presiones.length > 0 && caudales.length > 0;
  const punto = datos.puntoOperacion;
  const tieneInterseccion =
    punto &&
    Number.isFinite(Number(punto.x)) &&
    Number.isFinite(Number(punto.y));

  return {
    presionMin: tieneCurva ? convertirPresion(Math.min(...presiones)) : null,
    presionMax: tieneCurva ? convertirPresion(Math.max(...presiones)) : null,
    caudalMax: tieneCurva ? Math.max(...caudales) : null,
    totalPuntos: vlp.length || null,
    puntoOperacion: tieneInterseccion
      ? {
          caudal: punto.x,
          pwf: convertirPresion(punto.y),
        }
      : null,
    estado: !tieneCurva
      ? "incompleta"
      : tieneInterseccion
        ? "calculada"
        : "sin_interseccion",
    unidadPresion: isPSI ? "PSI" : "kg/cm\u00b2",
    unidadCaudal: "bpd",
  };
}

function getNombreProyectoActivo() {
  const idx = getProyectoActivoIdx();
  return getProyecto(idx)?.nombre || null;
}

function formatFechaArchivo(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-");
}

function formatNumber(value, decimals = 0) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "N/D";
  return numericValue.toLocaleString("es-MX", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function validarDatosGrafica(mensaje) {
  const tieneDatosCalculados =
    datosSimulacionActual &&
    !vistaGraficaLimpia &&
    Array.isArray(datosSimulacionActual.ipr) &&
    datosSimulacionActual.ipr.length > 0 &&
    Array.isArray(datosSimulacionActual.vlp) &&
    datosSimulacionActual.vlp.length > 0;

  if (tieneDatosCalculados && graficoPrincipalTieneDatos()) return true;

  mostrarFeedbackGrafica(mensaje, "warning");
  return false;
}

function crearDatosReporteVLP(datos) {
  return {
    fechaGeneracion: new Date().toLocaleString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    proyectoNombre: getNombreProyectoActivo(),
    resumen: crearResumenVLP(datos),
  };
}

function actualizarReporteVLP(datos) {
  renderReporteVLP(crearDatosReporteVLP(datos));
  renderReporteVLPChart(datos);
}

function tieneSimulacionGuardada(data) {
  return Boolean(data?.ipr || data?.produccion || data?.bsn || data?.vlp);
}

function tieneParametrosVLPGuardados(vlp) {
  return Boolean(
    vlp?.parametros &&
      typeof vlp.parametros === "object" &&
      Object.keys(vlp.parametros).length > 0,
  );
}

function simulacionPerteneceAProyecto(data, proyectoId) {
  const rows = [data?.ipr, data?.produccion, data?.bsn, data?.vlp].filter(Boolean);
  return rows.every((row) => Number(row.proyecto_id) === Number(proyectoId));
}

function getProyectoIdActivo() {
  const idx = getProyectoActivoIdx();
  return getProyecto(idx)?.id || null;
}

function esProyectoActivo(proyectoId) {
  return Number(getProyectoIdActivo()) === Number(proyectoId);
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value ?? "";
}

function limpiarAlmacenamientoTemporalSimulacion() {
  const prefixes = ["simbpr:simulacion:", "simbpr:temp-simulacion:"];

  [window.localStorage, window.sessionStorage].forEach((storage) => {
    if (!storage) return;
    prefixes.forEach((prefix) => {
      Object.keys(storage)
        .filter((key) => key.startsWith(prefix))
        .forEach((key) => storage.removeItem(key));
    });
  });
}

function mostrarPanelGraficoPorDefecto() {
  const btnGrafico = document.querySelector('[onclick*="panel-grafico"]');
  if (btnGrafico) mostrarPanel("panel-grafico", btnGrafico);
}

function mostrarEntradaYacimientoPorDefecto() {
  const btnYacimiento = document.querySelector('#leftTabsPanel [onclick*="yacimiento"]');
  const btnIPR = document.querySelector('.yacimiento-tab-btn[onclick*="yacimiento-ipr"]');

  if (btnYacimiento) mostrarTab("yacimiento", btnYacimiento);
  if (btnIPR) mostrarYacimientoTab("yacimiento-ipr", btnIPR);
}

function normalizarEtiquetasVLP() {
  const etiquetas = {
    vlp_nl: "Nivel de liquido NL (m)",
    vlp_pwh: "Pwh (kg/cm2)",
    vlp_pl: "PL (kg/cm2)",
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
  const pws = getFloat("inputPws");
  const pwf = getFloat("inputPwf");
  const qb = getFloat("inputQb");
  const J = getFloat("inputJ", 1);

  const datos = calcularSistemaIPRVLP(pws, pwf, qb, J);

  // Actualizar J calculado en el input oculto
  actualizarInputJ(datos.J);
  // Mostrar error si los parámetros son inválidos
  mostrarErrorVogel(datos.error);
  // Actualizar resumen de Qmax
  mostrarResultadosQmax(datos.Qmax);

  return datos;
}

function _calcularYActualizarIPRSolo() {
  const pws = getFloat("inputPws");
  const pwf = getFloat("inputPwf");
  const qb = getFloat("inputQb");
  const J = getFloat("inputJ", 1);
  const datosIPR = calcularCurvas(pws, pwf, qb, J);
  const datos = {
    ...datosIPR,
    vlp: [],
    vlpParams: null,
    puntoOperacion: null,
    qOperacion: 0,
    pwfSistema: datosIPR.pwfReferencia,
  };

  actualizarInputJ(datos.J);
  mostrarErrorVogel(datos.error);
  mostrarResultadosQmax(datos.Qmax);

  return datos;
}

// ── Acciones públicas ───────────────────────────────────────────────────────

export function crearGraficoInicial() {
  resetSimulationView();
}

export function actualizarGrafico() {
  const datos = _calcularYActualizar();
  datosSimulacionActual = datos;
  vistaGraficaLimpia = false;
  renderResultadosYTabla(datos);
  renderResumenVLP(crearResumenVLP(datos));
  actualizarGraficoView(datos);
  if (reporteActivo === "vlp") actualizarReporteVLP(datos);
}

export function limpiarVistaSimulacion() {
  resetSimulationView({
    mostrarFeedback: true,
    mensajeFeedback:
      "Vista limpia. El proyecto y las simulaciones guardadas no fueron modificados.",
  });
}

export function resetSimulationView({
  limpiarAlmacenamientoTemporal = false,
  mostrarFeedback = false,
  mensajeFeedback = "",
} = {}) {
  try {
    datosSimulacionActual = null;
    vistaGraficaLimpia = true;
    reporteActivo = "ipr";
    iprColor = "#2563eb";

    setCurrentUnidad("kg");
    reiniciarFormularioSimulacion({ limpiarValores: true });
    limpiarResultadosSimulacion();

    if (limpiarAlmacenamientoTemporal) limpiarAlmacenamientoTemporalSimulacion();

    destruirGraficosSimulacion();
    crearGraficoPrincipalVacio();

    mostrarReporteUI(reporteActivo);
    actualizarUnidadUI(false, 0, 0);
    actualizarColorSwatch(iprColor);
    setIPRChartColor(iprColor);
    limpiarFeedbackGrafica();
    mostrarEntradaYacimientoPorDefecto();
    mostrarPanelGraficoPorDefecto();

    if (mostrarFeedback && mensajeFeedback) {
      mostrarFeedbackGrafica(mensajeFeedback, "success");
    }
  } catch (err) {
    console.error("[SimulatorController] Error al reiniciar la vista:", err);
    mostrarFeedbackGrafica("No se pudo limpiar la vista de simulacion. Revise la consola tecnica.", "error");
  } finally {
    forzarResizeGraficoPrincipal();
  }
}

export function reiniciarSimulacionNuevoProyecto() {
  resetSimulationView({ limpiarAlmacenamientoTemporal: true });
}

export function exportarGraficaActual() {
  try {
    if (!validarDatosGrafica("No hay una grafica calculada para exportar. Genere la simulacion antes de descargar la imagen.")) {
      return;
    }

    const nombreArchivo = `SIMBPR_grafica_${formatFechaArchivo()}.png`;
    const descargada = descargarGraficoPrincipalPNG(nombreArchivo);
    if (!descargada) {
      mostrarFeedbackGrafica("No fue posible preparar la imagen PNG de la grafica.", "error");
      return;
    }

    mostrarFeedbackGrafica(`Grafica exportada como ${nombreArchivo}.`, "success");
  } catch (err) {
    console.error("[SimulatorController] Error al exportar grafica:", err);
    mostrarFeedbackGrafica("Ocurrio un error al exportar la grafica PNG.", "error");
  }
}

function crearReporteTecnicoActual(imagenGrafica) {
  const datos = datosSimulacionActual;
  const isPSI = esPSI();
  const convertirPresion = (value) => (isPSI ? value * KGcm2_TO_PSI : value);
  const unidadPresion = isPSI ? "PSI" : "kg/cm²";
  const pws = getFloat("inputPws");
  const pwf = getFloat("inputPwf");
  const qb = getFloat("inputQb");
  const resumenVLP = crearResumenVLP(datos);
  const labelsEstado = {
    calculada: "Calculada",
    incompleta: "Incompleta",
    sin_interseccion: "Sin interseccion",
  };
  const vlpParams = {
    ...datos.vlpParams,
    pwh: convertirPresion(datos.vlpParams?.pwh || 0),
    pl: convertirPresion(datos.vlpParams?.pl || 0),
  };
  const puntoOperacion = datos.puntoOperacion
    ? {
        x: datos.puntoOperacion.x,
        y: convertirPresion(datos.puntoOperacion.y),
      }
    : null;

  return {
    proyectoNombre: getNombreProyectoActivo(),
    fecha: new Date().toLocaleString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    unidadPresion,
    parametrosIPR: {
      pws: formatNumber(convertirPresion(pws), isPSI ? 1 : 1),
      pwf: formatNumber(convertirPresion(pwf), isPSI ? 1 : 1),
      qb: formatNumber(qb, 0),
      j: formatNumber(isPSI ? datos.J / KGcm2_TO_PSI : datos.J, 4),
    },
    parametrosVLP: vlpParams,
    resumenIPR: {
      qmax: formatNumber(datos.Qmax, 0),
      qOperacion: formatNumber(datos.qOperacion, 0),
      pwfSistema: formatNumber(convertirPresion(datos.pwfSistema), isPSI ? 1 : 1),
      drawdown: formatNumber(convertirPresion(pws - (datos.pwfSistema || 0)), isPSI ? 1 : 1),
    },
    resumenVLP: {
      presionMin: formatNumber(resumenVLP.presionMin, isPSI ? 1 : 1),
      presionMax: formatNumber(resumenVLP.presionMax, isPSI ? 1 : 1),
      caudalMax: formatNumber(resumenVLP.caudalMax, 0),
      totalPuntos: resumenVLP.totalPuntos || "N/D",
      estadoLabel: labelsEstado[resumenVLP.estado] || "N/D",
    },
    puntoOperacion,
    imagenGrafica,
  };
}

export function generarInformeGraficaActual() {
  try {
    if (!validarDatosGrafica("No hay datos suficientes para generar el informe. Genere una grafica IPR/VLP primero.")) {
      return;
    }

    const imagenGrafica = obtenerImagenGraficoPrincipalPNG();
    if (!imagenGrafica) {
      mostrarFeedbackGrafica("No fue posible capturar la imagen de la grafica para el informe.", "error");
      return;
    }

    const abierto = abrirInformeTecnicoImprimible(crearReporteTecnicoActual(imagenGrafica));
    if (!abierto) {
      mostrarFeedbackGrafica("No fue posible preparar la vista imprimible del informe tecnico.", "error");
      return;
    }

    mostrarFeedbackGrafica("Informe tecnico preparado en vista imprimible.", "success");
  } catch (err) {
    console.error("[SimulatorController] Error al generar informe:", err);
    mostrarFeedbackGrafica("Ocurrio un error al generar el informe tecnico.", "error");
  }
}

export function mostrarReporte(tipo = "ipr") {
  reporteActivo = tipo === "vlp" ? "vlp" : "ipr";
  mostrarReporteUI(reporteActivo);

  if (reporteActivo !== "vlp") return;

  const pws = getFloat("inputPws");
  const pwf = getFloat("inputPwf");
  const qb = getFloat("inputQb");
  const J = getFloat("inputJ", 1);
  const datos = calcularSistemaIPRVLP(pws, pwf, qb, J);
  datosSimulacionActual = datos;
  actualizarReporteVLP(datos);
}

export function setUnidad(unidad) {
  setCurrentUnidad(unidad);
  const isPSI = unidad === "psi";
  const pws = getFloat("inputPws");
  const pwf = getFloat("inputPwf");
  actualizarUnidadUI(isPSI, pws, pwf);
  actualizarGrafico();
  if (!document.getElementById("panel-datos").classList.contains("hidden")) {
    _actualizarTablasDatosCompleto();
  }
  window.__simbprMarkDirty?.();
}

export function syncPSItoKG(id) {
  const val = getFloat(id);
  const kgVal = (val / KGcm2_TO_PSI).toFixed(4);
  if (id === "inputPwsPSI") {
    document.getElementById("inputPws").value = kgVal;
  } else {
    document.getElementById("inputPwf").value = kgVal;
  }
  if (document.getElementById("autoCalibrarVogel")?.checked)
    actualizarGrafico();
  if (!document.getElementById("panel-datos").classList.contains("hidden")) {
    _actualizarTablasDatosCompleto();
  }
}

export function setIPRColor(color) {
  iprColor = color;
  actualizarColorSwatch(color);
  setIPRChartColor(color);
  window.__simbprMarkDirty?.();
}

export function calcularProduccionHandler() {
  const params = {
    qt: getFloat("prod_qt"),
    bsw: getFloat("prod_bsw"),
    api: getFloat("prod_api", 35),
    gor: getFloat("prod_gor"),
    bo: getFloat("prod_bo", 1),
  };
  const resultado = calcularProduccion(params);
  actualizarResultadosProduccion(resultado);
}

export function calcularBSNHandler() {
  const params = {
    etapas: getFloat("bsn_etapas", 120),
    freq: getFloat("bsn_freq", 60),
    hp: getFloat("bsn_hp", 200),
    volt: getFloat("bsn_volt", 1150),
    amp: getFloat("bsn_amp", 92),
  };
  const resultado = calcularBSN(params);
  actualizarResultadosBSN(resultado);
}

export function obtenerSnapshotSimulacion() {
  const pws = getFloat("inputPws");
  const pwf = getFloat("inputPwf");
  const qb = getFloat("inputQb");
  const J = getFloat("inputJ", 1);
  const datos = calcularSistemaIPRVLP(pws, pwf, qb, J);

  return {
    schema_version: 1,
    saved_at: new Date().toISOString(),
    ipr: {
      pws,
      pwf,
      qb,
      j_index: datos.J,
      unidad: getCurrentUnidad(),
      ipr_color: iprColor,
    },
    produccion: {
      qt: getFloat("prod_qt"),
      bsw: getFloat("prod_bsw"),
      api: getFloat("prod_api", 35),
      gor: getFloat("prod_gor"),
      bo: getFloat("prod_bo", 1),
    },
    bsn: {
      etapas: getFloat("bsn_etapas", 120),
      freq: getFloat("bsn_freq", 60),
      hp: getFloat("bsn_hp", 200),
      volt: getFloat("bsn_volt", 1150),
      amp: getFloat("bsn_amp", 92),
      depth: getFloat("bsn_depth", 2200),
      tempfondo: getFloat("bsn_tempfondo", 90),
    },
    vlp: {
      modelo: "vertical_lift_performance_bsn",
      parametros: datos.vlpParams,
      puntos: datos.vlp,
      punto_operacion: datos.puntoOperacion,
      q_operacion: datos.qOperacion,
      pwf_operacion: datos.pwfSistema,
      version: 1,
    },
  };
}

export function haySimulacionActivaParaGuardar() {
  if (
    datosSimulacionActual &&
    !vistaGraficaLimpia &&
    Array.isArray(datosSimulacionActual.ipr) &&
    datosSimulacionActual.ipr.length > 0
  ) {
    return true;
  }

  return SIMULATION_INPUT_IDS.some((id) => {
    const value = document.getElementById(id)?.value;
    return typeof value === "string" && value.trim() !== "";
  });
}

export function mostrarPanel(panelId, boton) {
  mostrarPanelUI(panelId, boton);
  if (panelId === "panel-grafico") {
    forzarResizeGraficoPrincipal();
  }
  if (panelId === "panel-datos") {
    _actualizarTablasDatosCompleto();
    if (reporteActivo === "vlp") mostrarReporte("vlp");
  }
  if (panelId === "panel-sensibilidad") actualizarSensibilidadHandler();
  if (panelId === "panel-perfilrpf") calcularRPFHandler();
}

export function mostrarTab(tab, boton) {
  mostrarTabUI(tab, boton);
}

export function mostrarYacimientoTab(tab, boton) {
  mostrarYacimientoTabUI(tab, boton);
}

function _actualizarTablasDatosCompleto() {
  const pws = getFloat("inputPws");
  const pwf = getFloat("inputPwf");
  const J = getFloat("inputJ", 1);
  const qb = getFloat("inputQb");
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
  const pws = getFloat("inputPws", 210);
  const pwf = getFloat("inputPwf", 178);
  const J = getFloat("inputJ", 1.5);
  const variable = document.getElementById("sens-variable")?.value || "j";
  const sMin = getFloat("sens-min", 0.5);
  const sMax = getFloat("sens-max", 3.0);

  const { rows, xVals, qmaxVals, qopVals, label } = calcularSensibilidad({
    pws,
    pwf,
    J,
    variable,
    sMin,
    sMax,
  });

  actualizarResultadosSensibilidad(rows, label);
  renderSensibilidadChart(xVals, qmaxVals, qopVals, label);
}

export function calcularRPFHandler() {
  const pws = getFloat("inputPws", 210);
  const pwf = getFloat("inputPwf", 178);
  const J = getFloat("inputJ", 1.5);
  const profBSN = getFloat("bsn_depth", 2200);
  const bht = getFloat("bsn_tempfondo", 90);

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
    "inputPws",
    "inputPwf",
    "inputQb",
    "vlp_prof_disp",
    "vlp_bsn_depth",
    "vlp_nl",
    "vlp_pwh",
    "vlp_pl",
    "vlp_tubing_id",
    "vlp_bsw",
    "vlp_api",
    "vlp_gor",
    "vlp_visc",
    "vlp_bsn_etapas",
    "vlp_bsn_freq",
    "pozo_prof_disp",
    "pozo_pl",
    "pozo_pwh",
    "pozo_nl",
    "pozo_tubing_id",
    "prod_bsw",
    "prod_api",
    "prod_gor",
    "prod_visc",
    "bsn_depth",
    "bsn_etapas",
    "bsn_freq",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", () => {
        if (document.getElementById("autoCalibrarVogel")?.checked)
          actualizarGrafico();
      });
    }
  });

  document
    .getElementById("autoCalibrarVogel")
    ?.addEventListener("change", () => {
      actualizarGrafico();
    });

  document
    .getElementById("btn-limpiar-grafica")
    ?.addEventListener("click", limpiarVistaSimulacion);

  document
    .getElementById("btn-exportar-grafica")
    ?.addEventListener("click", exportarGraficaActual);

  document
    .getElementById("btn-informe-grafica")
    ?.addEventListener("click", generarInformeGraficaActual);

  // Inicializar swatch de color por defecto
  actualizarColorSwatch(iprColor);
}

export async function cargarSimulacionProyecto(
  proyectoId,
  { mantenerLimpiaSiVacia = false } = {},
) {
  const proyectoIdNum = Number(proyectoId);

  if (!Number.isFinite(proyectoIdNum) || proyectoIdNum <= 0) {
    resetSimulationView();
    return;
  }

  resetSimulationView({
    limpiarAlmacenamientoTemporal: mantenerLimpiaSiVacia,
  });

  try {
    const data = await api.simulacion.obtener(proyectoIdNum);

    if (!esProyectoActivo(proyectoIdNum)) return;

    if (!simulacionPerteneceAProyecto(data, proyectoIdNum)) {
      throw new Error(`La simulación recibida no pertenece al proyecto ${proyectoIdNum}`);
    }

    if (!tieneSimulacionGuardada(data)) {
      return;
    }

    if (data.ipr) {
      setValue("inputPws", data.ipr.pws);
      setValue("inputPwf", data.ipr.pwf);
      setValue("inputQb", data.ipr.qb);
      setValue("inputJ", data.ipr.j_index);

      if (data.ipr.ipr_color) {
        iprColor = data.ipr.ipr_color;
        actualizarColorSwatch(iprColor);
      }

      if (data.ipr.unidad) {
        setCurrentUnidad(data.ipr.unidad);
      }

      actualizarUnidadUI(
        getCurrentUnidad() === "psi",
        getFloat("inputPws"),
        getFloat("inputPwf"),
      );
    }

    if (data.produccion) {
      setValue("prod_qt", data.produccion.qt);
      setValue("prod_bsw", data.produccion.bsw);
      setValue("prod_api", data.produccion.api);
      setValue("prod_gor", data.produccion.gor);
      setValue("prod_bo", data.produccion.bo);
    }

    if (data.bsn) {
      setValue("bsn_etapas", data.bsn.etapas);
      setValue("bsn_freq", data.bsn.freq);
      setValue("bsn_hp", data.bsn.hp);
      setValue("bsn_volt", data.bsn.volt);
      setValue("bsn_amp", data.bsn.amp);
      setValue("bsn_depth", data.bsn.depth);
      setValue("bsn_tempfondo", data.bsn.tempfondo);
    }

    const tieneVLP = tieneParametrosVLPGuardados(data.vlp);

    if (tieneVLP) {
      const p = data.vlp.parametros;

      setValue("vlp_prof_disp", p.profundidadDisponible);
      setValue("vlp_bsn_depth", p.profBSN);
      setValue("vlp_nl", p.nivelLiquido);
      setValue("vlp_pl", p.pl);
      setValue("vlp_pwh", p.pwh);
      setValue("vlp_tubing_id", p.tubingId);
      setValue("vlp_bsw", p.bsw);
      setValue("vlp_api", p.api);
      setValue("vlp_gor", p.gor);
      setValue("vlp_visc", p.viscosidad);
      setValue("vlp_bsn_etapas", p.etapas);
      setValue("vlp_bsn_freq", p.freq);
    }

    if (data.ipr && !tieneVLP) {
      const datos = _calcularYActualizarIPRSolo();
      datosSimulacionActual = datos;
      vistaGraficaLimpia = false;
      renderResultadosYTabla(datos);
      renderResumenVLP({ estado: "incompleta" });
      actualizarGraficoView(datos);
    } else if (data.ipr) {
      actualizarGrafico();
    }
    if (data.produccion) calcularProduccionHandler();
    if (data.bsn) calcularBSNHandler();

    setIPRChartColor(iprColor);
  } catch (err) {
    console.error("[SimulatorController] Error cargando simulación:", err);
  } finally {
    forzarResizeGraficoPrincipal();
  }
}
