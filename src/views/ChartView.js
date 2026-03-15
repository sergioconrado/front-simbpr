// ChartView.js — Chart.js chart creation and updates

import { samplearPuntosIPR, niceAxisMax } from '../models/IPRModel.js';
import { iprParaGrafico, yAxisLabel, pwsParaEje } from '../models/UnitModel.js';

let chartBSN  = null;
let chartSens = null;
let chartRPF  = null;

export function getChartBSN() {
  return chartBSN;
}

/**
 * Crea el gráfico IPR principal desde cero.
 * @param {object} datos - resultado de calcularCurvas()
 */
export function crearGrafico(datos) {
  const ctx = document.getElementById('graficoBSN').getContext('2d');
  const iprDisplay = iprParaGrafico(datos.ipr);
  const pwsEje     = pwsParaEje(datos.pws);

  const legendDotPlugin = {
    id: 'legendDot',
    afterDraw(chart) {
      const legend = chart.legend;
      if (!legend || !legend.legendItems) return;
      const c = chart.ctx;
      legend.legendItems.forEach((item, i) => {
        const box = legend.legendHitBoxes[i];
        if (!box) return;
        const boxW = chart.options.plugins.legend.labels.boxWidth || 40;
        const boxH = chart.options.plugins.legend.labels.boxHeight || 12;
        const cx = box.left + boxW / 2;
        const cy = box.top  + boxH / 2;
        const color = chart.data.datasets[0]?.borderColor || '#2563eb';
        c.save();
        c.beginPath();
        c.arc(cx, cy, 4, 0, Math.PI * 2);
        c.fillStyle = color;
        c.fill();
        c.strokeStyle = '#ffffff';
        c.lineWidth = 1.5;
        c.stroke();
        c.restore();
      });
    },
  };

  chartBSN = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'IPR',
          data: iprDisplay,
          borderColor: '#2563eb',
          borderWidth: 3,
          tension: 0,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
        {
          label: 'Puntos IPR',
          data: samplearPuntosIPR(iprDisplay),
          borderColor: '#2563eb',
          backgroundColor: '#2563eb',
          pointRadius: 5,
          pointBackgroundColor: '#2563eb',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5,
          hoverRadius: 7,
          showLine: false,
          legendHidden: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      clip: false,
      plugins: {
        legendDot: {},
        legend: {
          display: true,
          labels: {
            filter: (item) => item.text !== 'Puntos IPR',
            font: { size: 12 },
          },
        },
        tooltip: {
          callbacks: {
            title: () => '',
            label: (ctx) => {
              const x = Math.round(ctx.raw.x);
              const y = Math.round(ctx.raw.y);
              return `${x} bpd  |  ${y} ${yAxisLabel()}`;
            },
          },
        },
      },
      scales: {
        x: {
          type: 'linear',
          min: 0,
          max: niceAxisMax(datos.Qmax).max,
          title: {
            display: true,
            text: 'Ql (bpd)',
            font: { weight: 'bold', size: 13 },
            color: '#111827',
          },
          grid:   { color: '#e5e7eb', lineWidth: 1 },
          border: { color: '#000000', width: 2 },
          ticks:  { color: '#111827', stepSize: niceAxisMax(datos.Qmax).stepSize },
        },
        y: {
          min: 0,
          max: niceAxisMax(pwsEje).max,
          title: {
            display: true,
            text: yAxisLabel(),
            font: { weight: 'bold', size: 13 },
            color: '#111827',
          },
          grid:   { color: '#e5e7eb', lineWidth: 1 },
          border: { color: '#000000', width: 2 },
          ticks:  { color: '#111827', stepSize: niceAxisMax(pwsEje).stepSize },
        },
      },
    },
    plugins: [legendDotPlugin],
  });
}

/**
 * Actualiza el gráfico IPR existente con nuevos datos.
 * @param {object} datos - resultado de calcularCurvas()
 */
export function actualizarGrafico(datos) {
  if (!chartBSN) return;
  const iprDisplay = iprParaGrafico(datos.ipr);
  const pwsEje     = pwsParaEje(datos.pws);

  chartBSN.data.datasets[0].data = iprDisplay;
  chartBSN.data.datasets[1].data = samplearPuntosIPR(iprDisplay);

  const axX = niceAxisMax(datos.Qmax);
  const axY = niceAxisMax(pwsEje);
  chartBSN.options.scales.x.max = axX.max;
  chartBSN.options.scales.x.ticks.stepSize = axX.stepSize;
  chartBSN.options.scales.y.max = axY.max;
  chartBSN.options.scales.y.ticks.stepSize = axY.stepSize;
  chartBSN.options.scales.y.title.text = yAxisLabel();
  chartBSN.update();
}

/**
 * Cambia el color de la curva y puntos IPR en el gráfico.
 */
export function setIPRChartColor(color) {
  if (!chartBSN) return;
  chartBSN.data.datasets[0].borderColor = color;
  chartBSN.data.datasets[1].borderColor = color;
  chartBSN.data.datasets[1].backgroundColor = color;
  chartBSN.data.datasets[1].pointBackgroundColor = color;
  chartBSN.update();
}

/**
 * Renderiza el gráfico de sensibilidad.
 */
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
