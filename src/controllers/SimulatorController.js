// SimulatorController.js — Simulator events & coordination

import { calcularCurvas, generarQ } from "../models/IPRModel.js";
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
import { formatNumber } from "../utils/numberFormat.js";

// ── Color IPR activo ────────────────────────────────────────────────────────
let iprColor = "#2563eb";
let reporteActivo = "ipr";
let datosSimulacionActual = null;
let vistaGraficaLimpia = false;

const IPR_INPUT_IDS = ["inputPws", "inputPwf", "inputQb"];
const VLP_REQUIRED_INPUT_IDS = [
  "vlp_qmax",
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
];

const SIMULATION_INPUT_IDS = [
  "inputPws",
  "inputPwsPSI",
  "inputPwf",
  "inputPwfPSI",
  "inputQb",
  "inputJ",
  "vlp_qmax",
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

function getRawValue(id) {
  return document.getElementById(id)?.value?.trim() ?? "";
}

function getNumber(id) {
  const value = Number(getRawValue(id));
  return Number.isFinite(value) ? value : null;
}

function inputTieneNumero(id) {
  return getRawValue(id) !== "" && getNumber(id) !== null;
}

function formularioTieneAlgunaEntrada(ids) {
  return ids.some((id) => getRawValue(id) !== "");
}

function curvaTienePuntos(curva) {
  return Array.isArray(curva) && curva.length > 0;
}

function crearDatosSimulacionVacios() {
  return {
    ipr: [],
    vlp: [],
    pwfLine: [],
    puntoPrueba: null,
    puntoOperacion: null,
    vlpParams: null,
    qOperacion: 0,
    pwfSistema: 0,
    Qmax: 0,
    pws: 0,
    J: 0,
    tieneIPR: false,
    tieneVLP: false,
  };
}

function leerParametrosVLP(qmax) {
  return {
    qmax,
    profundidadDisponible: getNumber("vlp_prof_disp"),
    profBSN: getNumber("vlp_bsn_depth"),
    nivelLiquido: getNumber("vlp_nl"),
    pl: getNumber("vlp_pl"),
    pwh: getNumber("vlp_pwh"),
    tubingId: getNumber("vlp_tubing_id"),
    bsw: getNumber("vlp_bsw"),
    api: getNumber("vlp_api"),
    gor: getNumber("vlp_gor"),
    viscosidad: getNumber("vlp_visc"),
    etapas: getNumber("vlp_bsn_etapas"),
    freq: getNumber("vlp_bsn_freq"),
  };
}

export function formularioIPRCompleto() {
  if (!IPR_INPUT_IDS.every(inputTieneNumero)) return false;

  const pws = getNumber("inputPws");
  const pwf = getNumber("inputPwf");
  const qb = getNumber("inputQb");

  return pws > 0 && pwf >= 0 && pwf < pws && qb > 0;
}

export function formularioVLPCompleto() {
  if (!VLP_REQUIRED_INPUT_IDS.every(inputTieneNumero)) return false;

  const qmax = getNumber("vlp_qmax");
  const profDisp = getNumber("vlp_prof_disp");
  const profBSN = getNumber("vlp_bsn_depth");
  const nl = getNumber("vlp_nl");
  const pwh = getNumber("vlp_pwh");
  const pl = getNumber("vlp_pl");
  const tubingId = getNumber("vlp_tubing_id");
  const bsw = getNumber("vlp_bsw");
  const api = getNumber("vlp_api");
  const gor = getNumber("vlp_gor");
  const viscosidad = getNumber("vlp_visc");
  const etapas = getNumber("vlp_bsn_etapas");
  const freq = getNumber("vlp_bsn_freq");

  return (
    qmax > 0 &&
    profDisp > 0 &&
    profBSN > 0 &&
    profBSN <= profDisp &&
    nl >= 0 &&
    pwh >= 0 &&
    pl >= 0 &&
    tubingId > 0 &&
    bsw >= 0 &&
    bsw <= 100 &&
    api > 0 &&
    gor >= 0 &&
    viscosidad > 0 &&
    etapas > 0 &&
    freq > 0
  );
}

function mensajeValidacionIPR() {
  if (!formularioTieneAlgunaEntrada(IPR_INPUT_IDS)) return "";
  if (!IPR_INPUT_IDS.every(inputTieneNumero)) {
    return "IPR incompleta: capture Pws, Pwf y Qb para graficar la curva IPR.";
  }
  if (!formularioIPRCompleto()) {
    return "IPR invalida: use Pws > 0, 0 <= Pwf < Pws y Qb > 0.";
  }
  return "";
}

function mensajeValidacionVLP() {
  if (!formularioTieneAlgunaEntrada(VLP_REQUIRED_INPUT_IDS)) return "";
  if (!VLP_REQUIRED_INPUT_IDS.every(inputTieneNumero)) {
    return "VLP incompleta: capture todos los parametros VLP, incluido Qmax VLP.";
  }
  if (!formularioVLPCompleto()) {
    return "VLP invalida: revise rangos fisicos, profundidad BSN <= profundidad disponible, BSW 0-100 y valores positivos.";
  }
  return "";
}

function calcularSimulacionDesdeFormularios() {
  const datos = crearDatosSimulacionVacios();
  const iprValida = formularioIPRCompleto();
  const vlpValida = formularioVLPCompleto();

  if (iprValida) {
    const pws = getNumber("inputPws");
    const pwf = getNumber("inputPwf");
    const qb = getNumber("inputQb");
    const J = getFloat("inputJ", 1);
    const datosIPR = calcularCurvas(pws, pwf, qb, J);

    if (!datosIPR.error && curvaTienePuntos(datosIPR.ipr)) {
      Object.assign(datos, datosIPR, {
        tieneIPR: true,
        pwfSistema: datosIPR.pwfReferencia,
      });
    } else {
      mostrarErrorVogel(datosIPR.error);
    }
  }

  if (vlpValida) {
    const vlpParams = leerParametrosVLP(getNumber("vlp_qmax"));
    const qVals = datos.tieneIPR
      ? datos.ipr.map((pt) => pt.x)
      : generarQ(vlpParams.qmax);
    const vlp = calcularCurvaVLP(qVals, vlpParams);

    Object.assign(datos, {
      vlp,
      vlpParams,
      tieneVLP: curvaTienePuntos(vlp),
    });
  }

  if (datos.tieneIPR && datos.tieneVLP) {
    const puntoOperacion = encontrarInterseccionCurvas(datos.ipr, datos.vlp);
    datos.puntoOperacion = puntoOperacion;
    datos.qOperacion = puntoOperacion?.x || 0;
    datos.pwfSistema = puntoOperacion?.y || datos.pwfReferencia;
  }

  return datos;
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

function validarDatosGrafica(mensaje) {
  const tieneDatosCalculados =
    datosSimulacionActual &&
    !vistaGraficaLimpia &&
    (curvaTienePuntos(datosSimulacionActual.ipr) ||
      curvaTienePuntos(datosSimulacionActual.vlp));

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
  const p = vlp?.parametros;
  if (!p || typeof p !== "object") return false;

  return (
    Number(p.qmax) > 0 &&
    Number(p.profundidadDisponible) > 0 &&
    Number(p.profBSN) > 0 &&
    Number(p.profBSN) <= Number(p.profundidadDisponible) &&
    Number(p.nivelLiquido) >= 0 &&
    Number(p.pwh) >= 0 &&
    Number(p.pl) >= 0 &&
    Number(p.tubingId) > 0 &&
    Number(p.bsw) >= 0 &&
    Number(p.bsw) <= 100 &&
    Number(p.api) > 0 &&
    Number(p.gor) >= 0 &&
    Number(p.viscosidad) > 0 &&
    Number(p.etapas) > 0 &&
    Number(p.freq) > 0
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
  const datos = calcularSimulacionDesdeFormularios();

  if (datos.tieneIPR) {
    actualizarInputJ(datos.J);
    mostrarErrorVogel(datos.error);
    mostrarResultadosQmax(datos.Qmax);
  }

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
    tieneIPR: true,
    tieneVLP: false,
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
  const mensajeIPR = mensajeValidacionIPR();
  const mensajeVLP = mensajeValidacionVLP();
  const datos = _calcularYActualizar();

  datosSimulacionActual = datos;
  vistaGraficaLimpia = !datos.tieneIPR && !datos.tieneVLP;

  limpiarResultadosSimulacion();

  if (datos.tieneIPR) {
    renderResultadosYTabla(datos);
    mostrarResultadosQmax(datos.Qmax);
  } else {
    mostrarErrorVogel(mensajeIPR);
  }

  renderResumenVLP(crearResumenVLP(datos));
  actualizarGraficoView(datos);
  if (reporteActivo === "vlp") actualizarReporteVLP(datos);

  const mensajes = [mensajeIPR, mensajeVLP].filter(Boolean);
  if (vistaGraficaLimpia) {
    mostrarFeedbackGrafica(
      mensajes[0] || "No hay datos completos para graficar IPR ni VLP.",
      "warning",
    );
  } else if (mensajes.length) {
    mostrarFeedbackGrafica(mensajes.join(" "), "warning");
  } else {
    limpiarFeedbackGrafica();
  }
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
      pws: formatNumber(convertirPresion(pws), 2, "N/D"),
      pwf: formatNumber(convertirPresion(pwf), 2, "N/D"),
      qb: formatNumber(qb, 0, "N/D"),
      j: formatNumber(isPSI ? datos.J / KGcm2_TO_PSI : datos.J, 2, "N/D"),
    },
    parametrosVLP: vlpParams,
    resumenIPR: {
      qmax: formatNumber(datos.Qmax, 0, "N/D"),
      qOperacion: formatNumber(datos.qOperacion, 0, "N/D"),
      pwfSistema: formatNumber(convertirPresion(datos.pwfSistema), 2, "N/D"),
      drawdown: formatNumber(convertirPresion(pws - (datos.pwfSistema || 0)), 2, "N/D"),
    },
    resumenVLP: {
      presionMin: formatNumber(resumenVLP.presionMin, 2, "N/D"),
      presionMax: formatNumber(resumenVLP.presionMax, 2, "N/D"),
      caudalMax: formatNumber(resumenVLP.caudalMax, 0, "N/D"),
      totalPuntos: formatNumber(resumenVLP.totalPuntos, 0, "N/D"),
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

  const datos = datosSimulacionActual && !vistaGraficaLimpia
    ? datosSimulacionActual
    : calcularSimulacionDesdeFormularios();

  datosSimulacionActual = datos;
  actualizarReporteVLP(datos.tieneVLP ? datos : crearDatosSimulacionVacios());
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
  const raw = getRawValue(id);
  const targetId = id === "inputPwsPSI" ? "inputPws" : "inputPwf";

  if (raw === "") {
    document.getElementById(targetId).value = "";
    return;
  }

  const val = getFloat(id);
  const kgVal = (val / KGcm2_TO_PSI).toFixed(4);
  document.getElementById(targetId).value = kgVal;
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
  const datos = calcularSimulacionDesdeFormularios();
  const snapshot = {
    schema_version: 1,
    saved_at: new Date().toISOString(),
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
  };

  if (datos.tieneIPR) {
    snapshot.ipr = {
      pws: getNumber("inputPws"),
      pwf: getNumber("inputPwf"),
      qb: getNumber("inputQb"),
      j_index: datos.J,
      unidad: getCurrentUnidad(),
      ipr_color: iprColor,
    };
  }

  if (datos.tieneVLP) {
    snapshot.vlp = {
      modelo: "vertical_lift_performance_bsn",
      parametros: datos.vlpParams,
      puntos: datos.vlp,
      punto_operacion: datos.puntoOperacion,
      q_operacion: datos.qOperacion,
      pwf_operacion: datos.pwfSistema,
      version: 1,
    };
  }

  return snapshot;
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
  const datos = datosSimulacionActual && !vistaGraficaLimpia
    ? datosSimulacionActual
    : calcularSimulacionDesdeFormularios();

  if (!datos.tieneIPR) {
    limpiarResultadosSimulacion();
    return;
  }

  const pws = getNumber("inputPws");
  const pwf = getNumber("inputPwf");
  const isPSI = esPSI();

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
    "vlp_qmax",
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

      setValue("vlp_qmax", p.qmax);
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
