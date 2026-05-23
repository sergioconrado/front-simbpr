// ChartView.js — Chart.js chart creation and updates

import { samplearPuntosIPR, niceAxisMax } from '../models/IPRModel.js';
import { iprParaGrafico, yAxisLabel } from '../models/UnitModel.js';

let chartBSN  = null;
let chartSens = null;
let chartRPF  = null;
let chartReporteVLP = null;
let mainChartResizeObserver = null;

const mainChartFont = {
  legend: 15,
  axisTitle: 14,
  ticks: 13,
  tooltip: 13,
};

const OPERATION_POINT_LABEL = 'Punto de operacion';
const AXIS_MARGIN_RATIO = 0.025;
const AXIS_TARGET_TICKS = 6;
const MAIN_CHART_RESIZE_RETRIES = 8;
const OPERATION_LABEL_FONT_SIZE = 13;

function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

function puntosValidos(...series) {
  return series
    .flat()
    .filter((pt) => pt && isFiniteNumber(pt.x) && isFiniteNumber(pt.y))
    .map((pt) => ({ x: Number(pt.x), y: Number(pt.y) }));
}

function samplearPuntosCurva(curva, muestras = 9) {
  if (!Array.isArray(curva) || curva.length <= muestras) return curva || [];

  const lastIndex = curva.length - 1;
  return Array.from({ length: muestras }, (_, index) => {
    const curveIndex = Math.round((index / (muestras - 1)) * lastIndex);
    return curva[curveIndex];
  }).filter(Boolean);
}

function niceTickStep(min, max, ticks = AXIS_TARGET_TICKS) {
  const range = Math.max(max - min, 1);
  const rough = range / ticks;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
  const normalized = rough / magnitude;
  let nice;

  if (normalized <= 1) nice = 1;
  else if (normalized <= 2) nice = 2;
  else if (normalized <= 5) nice = 5;
  else nice = 10;

  return nice * magnitude;
}

function axisBounds(values, { forceZeroMin = true } = {}) {
  const finiteValues = values.map(Number).filter(Number.isFinite);
  if (!finiteValues.length) {
    return { min: 0, max: 1, stepSize: 1 };
  }

  const dataMin = forceZeroMin ? Math.min(0, ...finiteValues) : Math.min(...finiteValues);
  const dataMax = Math.max(...finiteValues);
  const range = Math.max(dataMax - dataMin, Math.abs(dataMax) || 1);
  const margin = range * AXIS_MARGIN_RATIO;
  const rawMin = forceZeroMin ? 0 : dataMin - margin;
  const rawMax = dataMax + margin;
  const stepSize = niceTickStep(rawMin, rawMax);
  const min = forceZeroMin ? 0 : Math.floor(rawMin / stepSize) * stepSize;

  return {
    min,
    max: rawMax,
    stepSize,
  };
}

export function calcularLimitesAutomaticosEjes({
  ipr = [],
  vlp = [],
  pwfLine = [],
  puntoPrueba = [],
  puntoOperacion = [],
} = {}) {
  const puntos = puntosValidos(ipr, vlp, pwfLine, puntoPrueba, puntoOperacion);

  return {
    x: axisBounds(puntos.map((pt) => pt.x), { forceZeroMin: true }),
    y: axisBounds(puntos.map((pt) => pt.y), { forceZeroMin: true }),
  };
}

function formatChartNumber(value, decimals = 0) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 'N/D';
  return numericValue.toLocaleString('es-MX', {
    maximumFractionDigits: decimals,
  });
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, width, height, radius);
    return;
  }

  const r = Math.min(radius, width / 2, height / 2);
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

const operationPointLabelPlugin = {
  id: 'operationPointLabel',
  afterDatasetsDraw(chart) {
    const { ctx, data } = chart;

    data.datasets.forEach((dataset, datasetIndex) => {
      if (!dataset.operationPoint || !dataset.data.length) return;

      const meta = chart.getDatasetMeta(datasetIndex);
      const point = meta.data[0];
      if (!point) return;

      const { x, y } = point.getProps(['x', 'y'], true);
      const label = dataset.operationLabel || 'Operacion';
      const paddingX = 9;
      const radius = 5;

      ctx.save();
      ctx.font = `700 ${OPERATION_LABEL_FONT_SIZE}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      const textWidth = ctx.measureText(label).width;
      const boxWidth = textWidth + paddingX * 2;
      const boxHeight = 26;
      const boxX = Math.min(x + 14, chart.chartArea.right - boxWidth);
      const boxY = Math.max(y - 34, chart.chartArea.top + 2);

      ctx.beginPath();
      drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, radius);
      ctx.fillStyle = 'rgba(17, 24, 39, 0.94)';
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, boxX + paddingX, boxY + boxHeight / 2);
      ctx.restore();
    });
  },
};

export function getChartBSN() {
  return chartBSN;
}

export function graficoPrincipalTieneDatos() {
  if (!chartBSN) return false;
  return chartBSN.data.datasets.some((dataset) => {
    if (dataset.legendHidden) return false;
    return Array.isArray(dataset.data) && dataset.data.length > 0;
  });
}

export function limpiarGraficoPrincipal() {
  if (!chartBSN) return false;

  chartBSN.data.datasets.forEach((dataset) => {
    dataset.data = [];
  });
  chartBSN.options.scales.x.min = 0;
  chartBSN.options.scales.x.max = 1;
  chartBSN.options.scales.x.ticks.stepSize = 1;
  chartBSN.options.scales.y.min = 0;
  chartBSN.options.scales.y.max = 1;
  chartBSN.options.scales.y.ticks.stepSize = 1;
  chartBSN.options.scales.y.title.text = yAxisLabel();
  chartBSN.update();
  return true;
}

export function obtenerImagenGraficoPrincipalPNG({ background = '#ffffff' } = {}) {
  if (!chartBSN || !graficoPrincipalTieneDatos()) return null;

  chartBSN.update('none');

  const sourceCanvas = chartBSN.canvas;
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = sourceCanvas.width;
  exportCanvas.height = sourceCanvas.height;

  const ctx = exportCanvas.getContext('2d');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  ctx.drawImage(sourceCanvas, 0, 0);

  return exportCanvas.toDataURL('image/png', 1);
}

export function descargarGraficoPrincipalPNG(nombreArchivo) {
  const dataUrl = obtenerImagenGraficoPrincipalPNG();
  if (!dataUrl) return false;

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  return true;
}

export function forzarResizeGraficoPrincipal(intentos = MAIN_CHART_RESIZE_RETRIES) {
  if (!chartBSN) return;

  const canvas = document.getElementById('graficoBSN');
  const wrapper = canvas?.parentElement;
  if (!canvas || !wrapper) return;

  const resizeWhenReady = (remaining) => {
    requestAnimationFrame(() => {
      const { width, height } = wrapper.getBoundingClientRect();
      const isVisible = width > 0 && height > 0 && canvas.offsetParent !== null;

      if (isVisible) {
        chartBSN.resize(width, height);
        chartBSN.update('none');
        return;
      }

      if (remaining > 0) {
        setTimeout(() => resizeWhenReady(remaining - 1), 50);
      }
    });
  };

  resizeWhenReady(intentos);
}

function observarResizeGraficoPrincipal() {
  const canvas = document.getElementById('graficoBSN');
  const wrapper = canvas?.parentElement;
  if (!wrapper || typeof ResizeObserver === 'undefined') return;

  mainChartResizeObserver?.disconnect();
  mainChartResizeObserver = new ResizeObserver(() => {
    forzarResizeGraficoPrincipal(2);
  });
  mainChartResizeObserver.observe(wrapper);
}

function destruirGrafico(chart) {
  if (chart) chart.destroy();
}

export function destruirGraficosSimulacion() {
  mainChartResizeObserver?.disconnect();
  mainChartResizeObserver = null;

  destruirGrafico(chartBSN);
  destruirGrafico(chartSens);
  destruirGrafico(chartRPF);
  destruirGrafico(chartReporteVLP);

  chartBSN = null;
  chartSens = null;
  chartRPF = null;
  chartReporteVLP = null;
}

/**
 * Crea el gráfico IPR principal desde cero.
 * @param {object} datos - resultado de calcularCurvas()
 */
export function crearGrafico(datos = {}) {
  if (chartBSN) {
    chartBSN.destroy();
    chartBSN = null;
  }

  const ctx = document.getElementById('graficoBSN').getContext('2d');
  const iprDisplay = iprParaGrafico(datos.ipr || []);
  const vlpDisplay = iprParaGrafico(datos.vlp || []);
  const pwfLineDisplay = iprParaGrafico(datos.pwfLine || []);
  const puntoOperacion = datos.puntoOperacion ? iprParaGrafico([datos.puntoOperacion]) : [];
  const puntoPrueba = datos.puntoPrueba ? iprParaGrafico([datos.puntoPrueba]) : [];
  const axis = calcularLimitesAutomaticosEjes({
    ipr: iprDisplay,
    vlp: vlpDisplay,
    pwfLine: pwfLineDisplay,
    puntoPrueba,
    puntoOperacion,
  });

  chartBSN = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'IPR',
          data: iprDisplay,
          borderColor: '#2563eb',
          borderWidth: 3.5,
          tension: 0,
          pointRadius: 0,
          pointHoverRadius: 7,
          hitRadius: 11,
          borderCapStyle: 'round',
          borderJoinStyle: 'round',
        },
        {
          label: 'VLP',
          data: vlpDisplay,
          borderColor: '#dc2626',
          backgroundColor: 'rgba(220,38,38,0.08)',
          borderWidth: 3.5,
          borderDash: [8, 5],
          tension: 0.25,
          pointRadius: 0,
          pointHoverRadius: 7,
          hitRadius: 11,
          borderCapStyle: 'round',
          borderJoinStyle: 'round',
        },
        {
          label: 'Puntos VLP',
          data: samplearPuntosCurva(vlpDisplay),
          borderColor: '#dc2626',
          backgroundColor: '#dc2626',
          pointRadius: 5.5,
          pointBackgroundColor: '#dc2626',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.75,
          pointHoverRadius: 7.5,
          hitRadius: 10,
          showLine: false,
          legendHidden: true,
        },
        {
          label: 'Pwf prueba',
          data: pwfLineDisplay,
          borderColor: '#6b7280',
          borderWidth: 2,
          borderDash: [6, 5],
          pointRadius: 0,
          pointHoverRadius: 0,
        },
        {
          label: OPERATION_POINT_LABEL,
          data: puntoOperacion,
          borderColor: '#111827',
          backgroundColor: '#facc15',
          pointBackgroundColor: '#facc15',
          pointRadius: 10,
          pointHoverRadius: 12,
          hitRadius: 14,
          pointStyle: 'circle',
          pointBorderColor: '#111827',
          pointBorderWidth: 2.5,
          showLine: false,
          order: -10,
          operationPoint: true,
          operationLabel: 'Operacion',
        },
        {
          label: 'Prueba Qb-Pwf',
          data: puntoPrueba,
          borderColor: '#d97706',
          backgroundColor: 'rgba(217,119,6,0.15)',
          pointStyle: 'rectRot',
          pointRadius: 10,
          pointHoverRadius: 12,
          pointBorderColor: '#d97706',
          pointBorderWidth: 2.5,
          hitRadius: 12,
          showLine: false,
        },
        {
          label: 'Puntos IPR',
          data: samplearPuntosIPR(iprDisplay),
          borderColor: '#2563eb',
          backgroundColor: '#2563eb',
          pointRadius: 5.5,
          pointBackgroundColor: '#2563eb',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.75,
          pointHoverRadius: 7.5,
          hitRadius: 10,
          showLine: false,
          legendHidden: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      clip: false,
      layout: {
        padding: { top: 10, right: 14, bottom: 4, left: 6 },
      },
      interaction: {
        mode: 'nearest',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            filter: (item) => !['Puntos IPR', 'Puntos VLP'].includes(item.text),
            usePointStyle: true,
            boxWidth: 12,
            boxHeight: 12,
            padding: 14,
            color: '#374151',
            font: { size: mainChartFont.legend, weight: '600' },
          },
        },
        tooltip: {
          backgroundColor: 'rgba(17, 24, 39, 0.94)',
          borderColor: 'rgba(255, 255, 255, 0.18)',
          borderWidth: 1,
          titleFont: { size: mainChartFont.tooltip, weight: '700' },
          mode: 'nearest',
          intersect: false,
          bodyFont: { size: mainChartFont.tooltip, weight: '600' },
          padding: 12,
          boxPadding: 6,
          displayColors: true,
          callbacks: {
            title: (items) => {
              const item = items?.[0];
              return item?.dataset?.operationPoint ? 'Interseccion IPR/VLP' : '';
            },
            label: (ctx) => {
              const x = formatChartNumber(ctx.raw.x, 0);
              const y = formatChartNumber(ctx.raw.y, 1);

              if (ctx.dataset.operationPoint) {
                return [
                  `${OPERATION_POINT_LABEL}`,
                  `Ql: ${x} bpd`,
                  `${yAxisLabel()}: ${y}`,
                ];
              }

              return `${ctx.dataset.label}: Ql ${x} bpd  |  ${yAxisLabel()} ${y}`;
            },
          },
        },
      },
      scales: {
        x: {
          type: 'linear',
          min: axis.x.min,
          max: axis.x.max,
          title: {
            display: true,
            text: 'Ql (bpd)',
            font: { weight: 'bold', size: mainChartFont.axisTitle },
            color: '#111827',
          },
          grid:   { color: '#e5e7eb', lineWidth: 1 },
          border: { color: '#111827', width: 1.5 },
          ticks:  {
            color: '#111827',
            stepSize: axis.x.stepSize,
            font: { size: mainChartFont.ticks, weight: '600' },
            padding: 7,
            maxTicksLimit: AXIS_TARGET_TICKS + 1,
          },
        },
        y: {
          min: axis.y.min,
          max: axis.y.max,
          title: {
            display: true,
            text: yAxisLabel(),
            font: { weight: 'bold', size: mainChartFont.axisTitle },
            color: '#111827',
          },
          grid:   { color: '#e5e7eb', lineWidth: 1 },
          border: { color: '#111827', width: 1.5 },
          ticks:  {
            color: '#111827',
            stepSize: axis.y.stepSize,
            font: { size: mainChartFont.ticks, weight: '600' },
            padding: 7,
            maxTicksLimit: AXIS_TARGET_TICKS + 1,
          },
        },
      },
    },
    plugins: [operationPointLabelPlugin],
  });
  observarResizeGraficoPrincipal();
  forzarResizeGraficoPrincipal();
}

export function crearGraficoPrincipalVacio() {
  crearGrafico({ ipr: [], vlp: [], pwfLine: [] });
}

/**
 * Actualiza el gráfico IPR existente con nuevos datos.
 * @param {object} datos - resultado de calcularCurvas()
 */
export function actualizarGrafico(datos) {
  if (!chartBSN) return;
  const iprDisplay = iprParaGrafico(datos.ipr);
  const vlpDisplay = iprParaGrafico(datos.vlp || []);
  const pwfLineDisplay = iprParaGrafico(datos.pwfLine || []);
  const puntoOperacion = datos.puntoOperacion ? iprParaGrafico([datos.puntoOperacion]) : [];
  const puntoPrueba = datos.puntoPrueba ? iprParaGrafico([datos.puntoPrueba]) : [];
  const axis = calcularLimitesAutomaticosEjes({
    ipr: iprDisplay,
    vlp: vlpDisplay,
    pwfLine: pwfLineDisplay,
    puntoPrueba,
    puntoOperacion,
  });

  chartBSN.data.datasets[0].data = iprDisplay;
  chartBSN.data.datasets[1].data = vlpDisplay;
  chartBSN.data.datasets[2].data = samplearPuntosCurva(vlpDisplay);
  chartBSN.data.datasets[3].data = pwfLineDisplay;
  chartBSN.data.datasets[4].data = puntoOperacion;
  chartBSN.data.datasets[5].data = puntoPrueba;
  chartBSN.data.datasets[6].data = samplearPuntosIPR(iprDisplay);

  chartBSN.options.scales.x.min = axis.x.min;
  chartBSN.options.scales.x.max = axis.x.max;
  chartBSN.options.scales.x.ticks.stepSize = axis.x.stepSize;
  chartBSN.options.scales.y.min = axis.y.min;
  chartBSN.options.scales.y.max = axis.y.max;
  chartBSN.options.scales.y.ticks.stepSize = axis.y.stepSize;
  chartBSN.options.scales.y.title.text = yAxisLabel();
  forzarResizeGraficoPrincipal();
}

/**
 * Cambia el color de la curva y puntos IPR en el gráfico.
 */
export function setIPRChartColor(color) {
  if (!chartBSN) return;
  chartBSN.data.datasets[0].borderColor = color;
  chartBSN.data.datasets[6].borderColor = color;
  chartBSN.data.datasets[6].backgroundColor = color;
  chartBSN.data.datasets[6].pointBackgroundColor = color;
  chartBSN.update();
}

/**
 * Renderiza el gráfico de sensibilidad.
 */
export function renderReporteVLPChart(datos) {
  const canvas = document.getElementById('graficoReporteVLP');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const vlpDisplay = iprParaGrafico(datos.vlp || []);
  const puntoOperacion = datos.puntoOperacion ? iprParaGrafico([datos.puntoOperacion]) : [];

  if (chartReporteVLP) chartReporteVLP.destroy();

  const maxQ = Math.max(...vlpDisplay.map((pt) => pt.x), 1);
  const maxP = Math.max(...vlpDisplay.map((pt) => pt.y), 1);
  const axX = niceAxisMax(maxQ);
  const axY = niceAxisMax(maxP);

  chartReporteVLP = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'VLP',
          data: vlpDisplay,
          borderColor: '#dc2626',
          backgroundColor: 'rgba(220,38,38,0.08)',
          borderWidth: 2.5,
          tension: 0.25,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
        {
          label: 'Punto de operacion',
          data: puntoOperacion,
          borderColor: '#047857',
          backgroundColor: '#047857',
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          showLine: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: { usePointStyle: true, boxWidth: 10, font: { size: 12 } },
        },
        tooltip: {
          callbacks: {
            title: () => '',
            label: (ctx) => {
              const x = Math.round(ctx.raw.x);
              const y = Math.round(ctx.raw.y);
              return `${ctx.dataset.label}: ${x} bpd  |  ${y} ${yAxisLabel()}`;
            },
          },
        },
      },
      scales: {
        x: {
          type: 'linear',
          min: 0,
          max: axX.max,
          title: { display: true, text: 'Ql (bpd)', font: { weight: 'bold', size: 13 }, color: '#111827' },
          grid: { color: '#e5e7eb' },
          ticks: { color: '#111827', stepSize: axX.stepSize },
        },
        y: {
          min: 0,
          max: axY.max,
          title: { display: true, text: yAxisLabel(), font: { weight: 'bold', size: 13 }, color: '#111827' },
          grid: { color: '#e5e7eb' },
          ticks: { color: '#111827', stepSize: axY.stepSize },
        },
      },
    },
  });
}

export function renderSensibilidadChart(xVals, qmaxVals, qopVals, labelVar) {
  const ctx = document.getElementById('graficoSens').getContext('2d');
  if (chartSens) chartSens.destroy();
  chartSens = new Chart(ctx, {
    type: 'line',
    data: {
      labels: xVals,
      datasets: [
        {
          label: 'Qmax (bpd)',
          data: qmaxVals,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37,99,235,0.1)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
        },
        {
          label: 'Q Operación (bpd)',
          data: qopVals,
          borderColor: '#16a34a',
          backgroundColor: 'rgba(22,163,74,0.1)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: {
        x: { title: { display: true, text: labelVar }, grid: { color: '#e5e7eb' } },
        y: { title: { display: true, text: 'Caudal (bpd)' }, min: 0, grid: { color: '#e5e7eb' } },
      },
    },
  });
}

/**
 * Renderiza el gráfico de perfil RPF.
 */
export function renderPerfilRPFChart(depths, pressures, temps) {
  const ctx = document.getElementById('graficoRPF').getContext('2d');
  if (chartRPF) chartRPF.destroy();
  chartRPF = new Chart(ctx, {
    type: 'line',
    data: {
      labels: depths.map((d) => d.toFixed(0)),
      datasets: [
        {
          label: 'Presión (kg/cm²)',
          data: pressures.map((p) => parseFloat(p.toFixed(2))),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37,99,235,0.08)',
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          yAxisID: 'yP',
        },
        {
          label: 'Temperatura (°C)',
          data: temps.map((t) => parseFloat(t.toFixed(1))),
          borderColor: '#ea580c',
          backgroundColor: 'rgba(234,88,12,0.08)',
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          yAxisID: 'yT',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: {
        x:  { title: { display: true, text: 'Profundidad (m)' }, grid: { color: '#e5e7eb' } },
        yP: { type: 'linear', position: 'left',  title: { display: true, text: 'Presión (kg/cm²)' },     min: 0, grid: { color: '#e5e7eb' } },
        yT: { type: 'linear', position: 'right', title: { display: true, text: 'Temperatura (°C)' }, min: 0, grid: { drawOnChartArea: false } },
      },
    },
  });
}
