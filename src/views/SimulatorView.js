// SimulatorView.js — Simulator DOM rendering (no business logic)

import { samplearPuntosIPR } from '../models/IPRModel.js';
import { KGcm2_TO_PSI } from '../models/UnitModel.js';
import { formatNumber, formatNumberWithUnit } from '../utils/numberFormat.js';

const set = (id, val) => {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
};

const isFiniteNumber = (value) => Number.isFinite(Number(value));
const formatOrND = (value, decimals = 2) => formatNumber(value, decimals, 'N/D');
const EMPTY_VALUE = '—';
const escapeHTML = (value) =>
  String(value ?? 'N/D')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

let feedbackTimer = null;

const estadoVLPUI = {
  calculada: {
    label: 'Calculada',
    className: 'inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700',
  },
  incompleta: {
    label: 'Incompleta',
    className: 'inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-500',
  },
  sin_interseccion: {
    label: 'Sin intersecci\u00f3n IPR/VLP',
    className: 'inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700',
  },
};

/**
 * Renderiza el resumen compacto VLP en el panel de resultados.
 * @param {object} resumen - datos derivados por el controlador desde la curva VLP calculada
 */
export function renderResumenVLP(resumen = {}) {
  const pressureDecimals = resumen.unidadPresion === 'PSI' ? 1 : 1;
  const caudalUnit = resumen.unidadCaudal || 'bpd';
  const pressureUnit = resumen.unidadPresion || 'kg/cm\u00b2';

  set('vlp-presion-min', formatOrND(resumen.presionMin, pressureDecimals));
  set('vlp-presion-max', formatOrND(resumen.presionMax, pressureDecimals));
  set('vlp-caudal-max', formatOrND(resumen.caudalMax, 0));
  set('vlp-total-puntos', formatOrND(resumen.totalPuntos, 0));
  set('vlp-presion-min-unit', pressureUnit);
  set('vlp-presion-max-unit', pressureUnit);
  set('vlp-caudal-max-unit', caudalUnit);

  const estado = estadoVLPUI[resumen.estado] || estadoVLPUI.incompleta;
  const estadoEl = document.getElementById('vlp-resumen-estado');
  if (estadoEl) {
    estadoEl.textContent = estado.label;
    estadoEl.className = estado.className;
  }

  const operacionEl = document.getElementById('vlp-punto-operacion');
  const punto = resumen.puntoOperacion;
  const tieneOperacion = punto && isFiniteNumber(punto.caudal) && isFiniteNumber(punto.pwf);

  if (operacionEl) operacionEl.classList.toggle('hidden', !tieneOperacion);
  if (!tieneOperacion) return;

  set('vlp-caudal-operacion', formatOrND(punto.caudal, 0));
  set('vlp-pwf-operacion', formatOrND(punto.pwf, pressureDecimals));
  set('vlp-caudal-operacion-unit', caudalUnit);
  set('vlp-pwf-operacion-unit', pressureUnit);
}

export function mostrarFeedbackGrafica(mensaje, tipo = 'info') {
  const feedback = document.getElementById('grafica-action-feedback');
  if (!feedback) return;

  const estilos = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    error: 'border-red-200 bg-red-50 text-red-700',
    info: 'border-gray-200 bg-white/80 text-gray-600',
  };

  feedback.textContent = mensaje;
  feedback.className = `mt-3 min-h-[32px] rounded-lg border px-3 py-2 text-xs font-semibold transition ${estilos[tipo] || estilos.info}`;

  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => {
    feedback.textContent = '';
    feedback.className = 'mt-3 min-h-[32px] rounded-lg border border-transparent px-3 py-2 text-xs font-semibold text-transparent transition';
  }, 8000);
}

export function limpiarFeedbackGrafica() {
  const feedback = document.getElementById('grafica-action-feedback');
  if (!feedback) return;

  clearTimeout(feedbackTimer);
  feedback.textContent = '';
  feedback.className = 'mt-3 min-h-[32px] rounded-lg border border-transparent px-3 py-2 text-xs font-semibold text-transparent transition';
}

export function reiniciarFormularioSimulacion({ limpiarValores = false } = {}) {
  const root = document.getElementById('panel-simulador');
  if (!root) return;

  root.querySelectorAll('input, select, textarea').forEach((field) => {
    if (field.matches('[type="button"], [type="submit"], [type="reset"]')) return;

    if (field instanceof HTMLInputElement) {
      if (['checkbox', 'radio'].includes(field.type)) {
        field.checked = limpiarValores ? false : field.defaultChecked;
      } else {
        field.value = limpiarValores ? '' : (field.defaultValue || '');
      }
    } else if (field instanceof HTMLSelectElement) {
      const defaultIndex = Array.from(field.options).findIndex((option) => option.defaultSelected);
      field.selectedIndex = defaultIndex >= 0 ? defaultIndex : 0;
    } else {
      field.value = limpiarValores ? '' : (field.defaultValue || '');
    }

    field.classList.remove(
      'border-red-300',
      'border-red-400',
      'border-emerald-300',
      'border-emerald-400',
      'ring-red-200',
      'ring-emerald-200',
      'bg-red-50',
      'bg-emerald-50',
    );
    field.removeAttribute('aria-invalid');
  });

  mostrarErrorVogel('');
}

export function limpiarResultadosSimulacion() {
  [
    'resultadoQmax',
    'resultadoQmaxPanel',
    'resultadoDP',
    'resultadoJ',
    'd-pws',
    'd-pwf',
    'd-j',
    'd-modelo',
    'd-prof-disp',
    'd-nl',
    'd-pl',
    'd-pwh',
    'd-tubing-id',
    'd-qmax',
    'd-qop',
    'd-drawdown',
    'd-eficiencia',
    'prod_qo',
    'prod_qw',
    'prod_qg',
    'prod_dens',
    'prod_res',
    'bsn_cabeza',
    'bsn_bhp',
    'bsn_efic',
    'bsn_carga',
    'bsn_kw',
    'rpf_bhp_est',
    'rpf_bht',
    'rpf_grad_p',
    'rpf_grad_t',
    'rpf_prof_bsn',
    'rpf_pws_card',
    'rpf_pwf_card',
    'rpf_drawdown',
    'rpf_j_card',
    'rpf_diag_presion',
    'rpf_diag_temp',
    'rpf_diag_prod',
    'rpf_diag_bsn',
  ].forEach((id) => set(id, EMPTY_VALUE));

  set('modeloActivo', '');
  ['tablaIprBody', 'tabla-ipr-body', 'tabla-sens-body', 'tabla-rpf-body'].forEach((id) => {
    const tbody = document.getElementById(id);
    if (tbody) tbody.innerHTML = '';
  });

  renderResumenVLP({ estado: 'incompleta' });
  document.getElementById('vlp-punto-operacion')?.classList.add('hidden');
  document.getElementById('rep-vlp-operacion')?.classList.add('hidden');
  renderReporteVLP({
    fechaGeneracion: 'N/D',
    proyectoNombre: 'N/D',
    resumen: { estado: 'incompleta' },
  });
}

function crearFilaInforme(label, value, unit = '') {
  return `<tr><td>${escapeHTML(label)}</td><td>${escapeHTML(value ?? 'N/D')}</td><td>${escapeHTML(unit)}</td></tr>`;
}

export function abrirInformeTecnicoImprimible(reporte) {
  const parametrosIPR = reporte.parametrosIPR || {};
  const resumenIPR = reporte.resumenIPR || {};
  const resumenVLP = reporte.resumenVLP || {};
  const vlpParams = reporte.parametrosVLP || {};
  const punto = reporte.puntoOperacion;
  const puntoOperacion = punto
    ? `${formatNumber(punto.x, 0)} bpd / ${formatNumber(punto.y, 2)} ${reporte.unidadPresion}`
    : 'Sin interseccion calculada';
  const proyectoNombre = escapeHTML(reporte.proyectoNombre || 'Sin proyecto activo');
  const fecha = escapeHTML(reporte.fecha);
  const unidadPresion = escapeHTML(reporte.unidadPresion);
  const estadoVLP = escapeHTML(resumenVLP.estadoLabel || 'N/D');

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Informe tecnico SIMBPR</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #f3f4f6; color: #111827; font-family: Arial, Helvetica, sans-serif; }
    main { max-width: 980px; margin: 0 auto; padding: 32px; background: #fff; min-height: 100vh; }
    header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #111827; padding-bottom: 18px; margin-bottom: 24px; }
    h1 { margin: 0; font-size: 24px; letter-spacing: 0; }
    h2 { margin: 24px 0 10px; font-size: 15px; text-transform: uppercase; letter-spacing: .08em; color: #374151; }
    .meta { text-align: right; font-size: 12px; color: #4b5563; line-height: 1.6; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; }
    th { background: #f9fafb; color: #374151; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 12px 0 20px; }
    .kpi { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; background: #f9fafb; }
    .kpi span { display: block; font-size: 11px; color: #6b7280; margin-bottom: 4px; }
    .kpi strong { font-size: 18px; }
    img { width: 100%; border: 1px solid #e5e7eb; border-radius: 8px; margin-top: 8px; }
    .note { margin-top: 24px; font-size: 11px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 12px; }
    @media print {
      body { background: #fff; }
      main { padding: 16mm; max-width: none; }
      button { display: none; }
      .grid { break-inside: avoid; }
      img { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>Informe tecnico de simulacion SIMBPR</h1>
        <p>Curvas IPR / VLP y punto de operacion</p>
      </div>
      <div class="meta">
        <div><strong>Proyecto:</strong> ${proyectoNombre}</div>
        <div><strong>Fecha:</strong> ${fecha}</div>
        <div><strong>Unidad:</strong> ${unidadPresion}</div>
      </div>
    </header>

    <section class="kpis">
      <div class="kpi"><span>Qmax</span><strong>${escapeHTML(resumenIPR.qmax)}</strong><small> bpd</small></div>
      <div class="kpi"><span>Q operacion</span><strong>${escapeHTML(resumenIPR.qOperacion)}</strong><small> bpd</small></div>
      <div class="kpi"><span>Pwf operacion</span><strong>${escapeHTML(resumenIPR.pwfSistema)}</strong><small> ${unidadPresion}</small></div>
      <div class="kpi"><span>Estado VLP</span><strong>${estadoVLP}</strong></div>
    </section>

    <div class="grid">
      <section>
        <h2>Parametros principales IPR</h2>
        <table>
          <thead><tr><th>Parametro</th><th>Valor</th><th>Unidad</th></tr></thead>
          <tbody>
            ${crearFilaInforme('Pws', escapeHTML(parametrosIPR.pws), unidadPresion)}
            ${crearFilaInforme('Pwf prueba', escapeHTML(parametrosIPR.pwf), unidadPresion)}
            ${crearFilaInforme('Qb', parametrosIPR.qb, 'bpd')}
            ${crearFilaInforme('Indice J', escapeHTML(parametrosIPR.j), `bpd/${unidadPresion}`)}
            ${crearFilaInforme('Modelo', 'Vogel', '')}
          </tbody>
        </table>
      </section>
      <section>
        <h2>Parametros principales VLP</h2>
        <table>
          <thead><tr><th>Parametro</th><th>Valor</th><th>Unidad</th></tr></thead>
          <tbody>
            ${crearFilaInforme('Profundidad disponible', formatOrND(vlpParams.profundidadDisponible, 0), 'm')}
            ${crearFilaInforme('Prof. asentamiento BSN', formatOrND(vlpParams.profBSN, 0), 'm')}
            ${crearFilaInforme('Nivel de liquido', formatOrND(vlpParams.nivelLiquido, 0), 'm')}
            ${crearFilaInforme('Pwh', formatOrND(vlpParams.pwh, 2), unidadPresion)}
            ${crearFilaInforme('PL', formatOrND(vlpParams.pl, 2), unidadPresion)}
            ${crearFilaInforme('ID tubing', formatOrND(vlpParams.tubingId, 2), 'pg')}
          </tbody>
        </table>
      </section>
    </div>

    <section>
      <h2>Resumen IPR</h2>
      <table>
        <tbody>
          ${crearFilaInforme('Caudal maximo calculado', escapeHTML(resumenIPR.qmax), 'bpd')}
          ${crearFilaInforme('Drawdown operativo', escapeHTML(resumenIPR.drawdown), unidadPresion)}
          ${crearFilaInforme('Punto de operacion', escapeHTML(puntoOperacion), '')}
        </tbody>
      </table>
    </section>

    <section>
      <h2>Resumen VLP</h2>
      <table>
        <tbody>
          ${crearFilaInforme('Presion minima', escapeHTML(resumenVLP.presionMin), unidadPresion)}
          ${crearFilaInforme('Presion maxima', escapeHTML(resumenVLP.presionMax), unidadPresion)}
          ${crearFilaInforme('Caudal maximo VLP', escapeHTML(resumenVLP.caudalMax), 'bpd')}
          ${crearFilaInforme('Puntos calculados', escapeHTML(resumenVLP.totalPuntos), 'puntos')}
        </tbody>
      </table>
    </section>

    <section>
      <h2>Grafica IPR / VLP</h2>
      <img alt="Grafica IPR VLP SIMBPR" src="${reporte.imagenGrafica}">
    </section>

    <p class="note">Informe generado automaticamente por SIMBPR. Revise supuestos operativos y datos de entrada antes de emitir recomendaciones finales.</p>
  </main>
</body>
</html>`;

  let frame = document.getElementById('simbpr-print-frame');
  if (!frame) {
    frame = document.createElement('iframe');
    frame.id = 'simbpr-print-frame';
    frame.title = 'Informe tecnico SIMBPR';
    frame.style.position = 'fixed';
    frame.style.right = '0';
    frame.style.bottom = '0';
    frame.style.width = '0';
    frame.style.height = '0';
    frame.style.border = '0';
    frame.style.visibility = 'hidden';
    document.body.appendChild(frame);
  }

  const printWindow = frame.contentWindow;
  const printDocument = frame.contentDocument || printWindow?.document;
  if (!printWindow || !printDocument) return false;

  let printRequested = false;
  const imprimir = () => {
    if (printRequested) return;
    printRequested = true;
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };
  frame.onload = imprimir;

  printDocument.open();
  printDocument.write(html);
  printDocument.close();
  setTimeout(imprimir, 350);

  return true;
}

export function mostrarReporteUI(tipo) {
  const esVLP = tipo === 'vlp';
  document.getElementById('reporte-ipr')?.classList.toggle('hidden', esVLP);
  document.getElementById('reporte-vlp')?.classList.toggle('hidden', !esVLP);

  const activeClass = 'px-4 py-2 rounded-lg bg-white text-gray-800 shadow-sm transition';
  const inactiveClass = 'px-4 py-2 rounded-lg text-gray-400 transition hover:text-gray-700';
  const btnIPR = document.getElementById('btn-reporte-ipr');
  const btnVLP = document.getElementById('btn-reporte-vlp');
  if (btnIPR) btnIPR.className = esVLP ? inactiveClass : activeClass;
  if (btnVLP) btnVLP.className = esVLP ? activeClass : inactiveClass;
}

/**
 * Renderiza el reporte tecnico VLP dentro del panel Reporte.
 */
export function renderReporteVLP(reporte = {}) {
  const resumen = reporte.resumen || {};
  const punto = resumen.puntoOperacion;
  const pressureDecimals = resumen.unidadPresion === 'PSI' ? 1 : 1;
  const caudalUnit = resumen.unidadCaudal || 'bpd';
  const pressureUnit = resumen.unidadPresion || 'kg/cm\u00b2';

  set('rep-vlp-fecha', reporte.fechaGeneracion || 'N/D');
  set('rep-vlp-proyecto', reporte.proyectoNombre || 'N/D');
  set('rep-vlp-presion-min', formatOrND(resumen.presionMin, pressureDecimals));
  set('rep-vlp-presion-max', formatOrND(resumen.presionMax, pressureDecimals));
  set('rep-vlp-caudal-max', formatOrND(resumen.caudalMax, 0));
  set('rep-vlp-total-puntos', formatOrND(resumen.totalPuntos, 0));
  set('rep-vlp-presion-min-unit', pressureUnit);
  set('rep-vlp-presion-max-unit', pressureUnit);
  set('rep-vlp-caudal-max-unit', caudalUnit);

  const estado = estadoVLPUI[resumen.estado] || estadoVLPUI.incompleta;
  const estadoEl = document.getElementById('rep-vlp-estado');
  if (estadoEl) {
    estadoEl.textContent = estado.label;
    estadoEl.className = estado.className.replace('text-[11px]', 'text-xs').replace('px-2.5 py-1', 'px-3 py-1.5');
  }

  const operacionEl = document.getElementById('rep-vlp-operacion');
  const tieneOperacion = punto && isFiniteNumber(punto.caudal) && isFiniteNumber(punto.pwf);
  if (operacionEl) operacionEl.classList.toggle('hidden', !tieneOperacion);
  if (!tieneOperacion) return;

  set('rep-vlp-caudal-operacion', formatOrND(punto.caudal, 0));
  set('rep-vlp-pwf-operacion', formatOrND(punto.pwf, pressureDecimals));
  set('rep-vlp-caudal-operacion-unit', caudalUnit);
  set('rep-vlp-pwf-operacion-unit', pressureUnit);
}

/**
 * Actualiza los campos de resumen de Qmax en el panel izquierdo.
 */
export function mostrarResultadosQmax(Qmax) {
  set('resultadoQmax', formatNumber(Qmax, 0));
  set('modeloActivo', 'Modelo: Vogel');
  set('resultadoQmaxPanel', formatNumber(Qmax, 0));
}

/**
 * Muestra u oculta el mensaje de error de calibración Vogel.
 */
export function mostrarErrorVogel(msg) {
  const errEl = document.getElementById('vogelCalibError');
  if (!errEl) return;
  if (msg) {
    errEl.textContent = msg;
    errEl.classList.remove('hidden');
  } else {
    errEl.textContent = '';
    errEl.classList.add('hidden');
  }
}

/**
 * Actualiza el campo oculto del índice de productividad J.
 */
export function actualizarInputJ(J) {
  const el = document.getElementById('inputJ');
  if (el) el.value = J.toFixed(4);
}

/**
 * Renderiza el panel de resultados y la mini-tabla IPR (panel izquierdo).
 * @param {object} datos - resultado de calcularCurvas()
 */
export function renderResultadosYTabla(datos) {
  const { pws, pwfSistema: pwf, qOperacion: qop, Qmax, ipr } = datos;
  const J = (1.8 * Qmax) / (pws || 1);

  set('resultadoDP', formatNumber(pws - pwf, 2));
  set('resultadoJ', formatNumber(J, 2));
  set('resultadoQmaxPanel', formatNumber(Qmax, 0));

  const tbody = document.getElementById('tablaIprBody');
  if (!tbody || ipr.length === 0) return;

  tbody.innerHTML = '';
  samplearPuntosIPR(ipr).forEach((pt) => {
    if (!pt) return;
    const isOp = Qmax > 0 && Math.abs(pt.x - qop) < Qmax * 0.07;
    tbody.innerHTML += `<tr class="${isOp ? 'bg-blue-50 font-semibold' : ''}">
      <td class="px-4 py-2">${formatNumber(pt.x, 0)}</td>
      <td class="px-4 py-2">${formatNumber(pt.y + 0.1, 0)}</td>
    </tr>`;
  });
}

/**
 * Actualiza los botones de unidad y muestra/oculta los campos PSI/kg.
 */
export function actualizarUnidadUI(isPSI, pws, pwf) {
  const K = KGcm2_TO_PSI;
  const activeClass   = 'flex-1 text-xs font-semibold py-1.5 rounded-[10px] bg-white text-gray-800 shadow-sm transition-all duration-200';
  const inactiveClass = 'flex-1 text-xs font-semibold py-1.5 rounded-[10px] text-gray-400 transition-all duration-200';

  const btnKg  = document.getElementById('unitBtn-kg');
  const btnPsi = document.getElementById('unitBtn-psi');
  if (btnKg)  btnKg.className  = isPSI ? inactiveClass : activeClass;
  if (btnPsi) btnPsi.className = isPSI ? activeClass   : inactiveClass;

  document.getElementById('rowPws').classList.toggle('hidden', isPSI);
  document.getElementById('rowPwf').classList.toggle('hidden', isPSI);
  document.getElementById('rowPwsPSI').classList.toggle('hidden', !isPSI);
  document.getElementById('rowPwfPSI').classList.toggle('hidden', !isPSI);

  if (isPSI) {
    const pwsKg = document.getElementById('inputPws')?.value?.trim();
    const pwfKg = document.getElementById('inputPwf')?.value?.trim();
    document.getElementById('inputPwsPSI').value = pwsKg === '' ? '' : (pws * K).toFixed(1);
    document.getElementById('inputPwfPSI').value = pwfKg === '' ? '' : (pwf * K).toFixed(1);
  }
}

/**
 * Resalta el swatch de color IPR activo.
 */
export function actualizarColorSwatch(color) {
  document.querySelectorAll('.ipr-swatch').forEach((btn) => {
    const isActive = btn.dataset.color === color;
    btn.style.outline = isActive ? `2px solid ${color}` : 'none';
    btn.style.outlineOffset = '2px';
    btn.classList.toggle('ring-gray-800', isActive);
    btn.classList.toggle('ring-transparent', !isActive);
  });
}

/**
 * Actualiza las tablas y métricas del panel "Reporte".
 * Recibe valores ya calculados por el controlador.
 * @param {{ pws, pwf, Jactual, Qmax, qOp, isPSI }} params
 */
export function actualizarTablasDatos({ pws, pwf, Jactual, Qmax, qOp, isPSI, ipr = [], vlpParams = {} }) {
  const K = KGcm2_TO_PSI;
  const pressUnit = isPSI ? 'PSI' : 'kg/cm²';

  set('d-pws-sym',       isPSI ? 'Pws (PSI)' : 'Pws');
  set('d-pwf-sym',       isPSI ? 'Pwf (PSI)' : 'Pwf');
  set('d-j-sym',         isPSI ? 'J (PSI)'   : 'J');
  set('d-pws-unit',      pressUnit);
  set('d-pwf-unit',      pressUnit);
  set('d-j-unit',        isPSI ? 'bpd/PSI' : 'bpd/kg/cm²');
  set('d-drawdown-unit', pressUnit);

  const pwfHeader = document.getElementById('d-ipr-pwf-header');
  if (pwfHeader) pwfHeader.textContent = `Pwf (${pressUnit})`;

  set('d-pws',         formatNumber(isPSI ? pws * K : pws, isPSI ? 2 : 0));
  set('d-pwf',         formatNumber(isPSI ? pwf * K : pwf, isPSI ? 2 : 0));
  set('d-j',           formatNumber(isPSI ? Jactual / K : Jactual, 2));
  set('d-modelo',      'Vogel');
  set('d-qmax',        formatNumber(Qmax, 0));
  set('d-qop',         formatNumber(qOp, 0));
  const drawdown = pws - pwf;
  set('d-drawdown',    formatNumber(isPSI ? drawdown * K : drawdown, isPSI ? 2 : 0));
  set('d-eficiencia',  formatNumber(Qmax > 0 ? (qOp / Qmax) * 100 : 0, 0));
  set('d-prof-disp',   formatNumber(vlpParams.profundidadDisponible || vlpParams.profBSN || 0, 0));
  set('d-nl',          formatNumber(vlpParams.nivelLiquido || 0, 0));
  set('d-pl',          formatNumber(isPSI ? (vlpParams.pl || 0) * K : (vlpParams.pl || 0), isPSI ? 2 : 0));
  set('d-pwh',         formatNumber(isPSI ? (vlpParams.pwh || 0) * K : (vlpParams.pwh || 0), isPSI ? 2 : 0));
  set('d-tubing-id',   formatNumber(vlpParams.tubingId || 0, 2));

  // Tabla de puntos IPR (cada 5 % de Qmax)
  const tbody = document.getElementById('tabla-ipr-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  for (let i = 0; i <= 20; i++) {
    const pt     = ipr[i * 10] || { x: (i / 20) * Qmax, y: 0 };
    const q      = pt.x;
    const pCalc  = Math.max(pt.y, 0);
    const pDisp  = formatNumber(isPSI ? pCalc * K : pCalc, isPSI ? 2 : 0);
    const pct    = i * 5;
    const isOp   = Math.abs(q - qOp) < Qmax / 15;
    tbody.innerHTML += `<tr class="${isOp ? 'bg-blue-50 font-semibold' : ''}">
      <td class="px-4 py-1.5">${i + 1}</td>
      <td class="px-4 py-1.5">${formatNumber(q, 0)}</td>
      <td class="px-4 py-1.5">${pDisp}</td>
      <td class="px-4 py-1.5">${pct}%</td>
    </tr>`;
  }
}

/**
 * Muestra los resultados calculados de producción de fluidos.
 */
export function actualizarResultadosProduccion({ qo, qw, qg, dens, qRes }) {
  set('prod_qo',   formatNumberWithUnit(qo, 'bpd', 0));
  set('prod_qw',   formatNumberWithUnit(qw, 'bpd', 0));
  set('prod_qg',   formatNumberWithUnit(qg, 'Mscf/d', 2));
  set('prod_dens', formatNumberWithUnit(dens, 'g/cc', 2));
  set('prod_res',  formatNumberWithUnit(qRes, 'rb/d', 2));
}

/**
 * Muestra los resultados calculados de la BSN.
 */
export function actualizarResultadosBSN({ cabeza, bhp, efic, carga, kw }) {
  set('bsn_cabeza', formatNumberWithUnit(cabeza, 'm', 0));
  set('bsn_bhp',    formatNumberWithUnit(bhp, 'HP', 0));
  set('bsn_efic',   formatNumberWithUnit(efic, '%', 2));
  set('bsn_carga',  formatNumberWithUnit(carga, '%', 2));
  set('bsn_kw',     formatNumberWithUnit(kw, 'kW', 2));
}

/**
 * Actualiza las KPI cards, tabla y diagnóstico del perfil RPF.
 */
export function actualizarResultadosRPF(result) {
  const { kpis, operacion, diagnostico, depths, pressures, temps, gradPs, gradTs } = result;

  set('rpf_bhp_est',  formatNumber(kpis.pws, 2));
  set('rpf_bht',      formatNumber(kpis.bht, 2));
  set('rpf_grad_p',   formatNumber(kpis.gradP, 2));
  set('rpf_grad_t',   formatNumber(kpis.gradT, 2));

  set('rpf_prof_bsn', formatNumberWithUnit(operacion.profBSN, 'm', 0));
  set('rpf_pws_card', formatNumberWithUnit(operacion.pws, 'kg/cm²', 2));
  set('rpf_pwf_card', formatNumberWithUnit(operacion.pwf, 'kg/cm²', 2));
  set('rpf_drawdown', formatNumberWithUnit(operacion.drawdown, 'kg/cm²', 2));
  set('rpf_j_card',   formatNumberWithUnit(operacion.J, 'bpd/kg/cm²', 2));

  set('rpf_diag_presion', diagnostico.presion);
  set('rpf_diag_temp',    diagnostico.temp);
  set('rpf_diag_prod',    diagnostico.prod);
  set('rpf_diag_bsn',     diagnostico.bsn);

  const tbody = document.getElementById('tabla-rpf-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  depths.forEach((d, i) => {
    const isBSN = i === depths.length - 1;
    tbody.innerHTML += `<tr class="${isBSN ? 'bg-blue-50 font-semibold' : i % 2 === 0 ? 'bg-gray-50' : ''}">
      <td class="px-4 py-1.5">${formatNumber(d, 0)}${isBSN ? ' ★' : ''}</td>
      <td class="px-4 py-1.5">${formatNumber(pressures[i], 2)}</td>
      <td class="px-4 py-1.5">${formatNumber(temps[i], 2)}</td>
      <td class="px-4 py-1.5">${formatNumber(gradPs[i], 2)}</td>
      <td class="px-4 py-1.5">${formatNumber(gradTs[i], 2)}</td>
    </tr>`;
  });
}

/**
 * Actualiza la tabla de escenarios del análisis de sensibilidad.
 */
export function actualizarResultadosSensibilidad(rows, labelVar) {
  set('sens-col-var', labelVar);
  const tbody = document.getElementById('tabla-sens-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  rows.forEach((r, idx) => {
    tbody.innerHTML += `<tr class="${idx % 2 === 0 ? 'bg-gray-50' : ''}">
      <td class="px-4 py-2">Escenario ${idx + 1}</td>
      <td class="px-4 py-2">${formatNumber(r.val, 2)}</td>
      <td class="px-4 py-2 font-medium">${formatNumber(r.Qmax, 0)}</td>
      <td class="px-4 py-2">${formatNumber(r.qOp, 0)}</td>
      <td class="px-4 py-2">${formatNumber(r.drawdown, 2)}</td>
      <td class="px-4 py-2">${formatNumber(r.eficiencia, 2)}</td>
    </tr>`;
  });
}

/**
 * Actualiza el reloj en tiempo real del header.
 */
export function actualizarReloj() {
  const el = document.getElementById('header-datetime');
  if (!el) return;
  const now   = new Date();
  const fecha = now.toLocaleDateString('es-MX',  { day: '2-digit', month: 'short', year: 'numeric' });
  const hora  = now.toLocaleTimeString('es-MX',  { hour: '2-digit', minute: '2-digit' });
  el.textContent = fecha + '  ' + hora;
}
