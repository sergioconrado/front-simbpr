// SimulatorView.js — Simulator DOM rendering (no business logic)

import { samplearPuntosIPR } from '../models/IPRModel.js';
import { KGcm2_TO_PSI } from '../models/UnitModel.js';

const set = (id, val) => {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
};

/**
 * Actualiza los campos de resumen de Qmax en el panel izquierdo.
 */
export function mostrarResultadosQmax(Qmax) {
  set('resultadoQmax', Qmax.toFixed(0));
  set('modeloActivo', 'Modelo: Vogel');
  set('resultadoQmaxPanel', Qmax.toFixed(0));
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

  set('resultadoDP', (pws - pwf).toFixed(1));
  set('resultadoJ', J.toFixed(4));
  set('resultadoQmaxPanel', Qmax.toFixed(0));

  const tbody = document.getElementById('tablaIprBody');
  if (!tbody || ipr.length === 0) return;

  tbody.innerHTML = '';
  samplearPuntosIPR(ipr).forEach((pt) => {
    if (!pt) return;
    const isOp = Qmax > 0 && Math.abs(pt.x - qop) < Qmax * 0.07;
    tbody.innerHTML += `<tr class="${isOp ? 'bg-blue-50 font-semibold' : ''}">
      <td class="px-4 py-2">${Math.round(pt.x)}</td>
      <td class="px-4 py-2">${Math.round(pt.y + 0.1)}</td>
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
    document.getElementById('inputPwsPSI').value = (pws * K).toFixed(1);
    document.getElementById('inputPwfPSI').value = (pwf * K).toFixed(1);
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
export function actualizarTablasDatos({ pws, pwf, Jactual, Qmax, qOp, isPSI }) {
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

  set('d-pws',         isPSI ? (pws * K).toFixed(1) : pws.toFixed(0));
  set('d-pwf',         isPSI ? (pwf * K).toFixed(1) : pwf.toFixed(0));
  set('d-j',           isPSI ? (Jactual / K).toFixed(4) : Jactual.toFixed(2));
  set('d-modelo',      'Vogel');
  set('d-qmax',        Qmax.toFixed(0));
  set('d-qop',         qOp.toFixed(0));
  const drawdown = pws - pwf;
  set('d-drawdown',    isPSI ? (drawdown * K).toFixed(1) : drawdown.toFixed(0));
  set('d-eficiencia',  Qmax > 0 ? ((qOp / Qmax) * 100).toFixed(0) : '0');

  // Tabla de puntos IPR (cada 5 % de Qmax)
  const tbody = document.getElementById('tabla-ipr-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  for (let i = 0; i <= 20; i++) {
    const q      = (i / 20) * Qmax;
    const pCalc  = Math.max(pws * (1 - 0.2 * (q / Qmax) - 0.8 * Math.pow(q / Qmax, 2)), 0);
    const pDisp  = isPSI ? (pCalc * K).toFixed(1) : pCalc.toFixed(0);
    const pct    = i * 5;
    const isOp   = Math.abs(q - qOp) < Qmax / 15;
    tbody.innerHTML += `<tr class="${isOp ? 'bg-blue-50 font-semibold' : ''}">
      <td class="px-4 py-1.5">${i + 1}</td>
      <td class="px-4 py-1.5">${q.toFixed(0)}</td>
      <td class="px-4 py-1.5">${pDisp}</td>
      <td class="px-4 py-1.5">${pct}%</td>
    </tr>`;
  }
}

/**
 * Muestra los resultados calculados de producción de fluidos.
 */
export function actualizarResultadosProduccion({ qo, qw, qg, dens, qRes }) {
  set('prod_qo',   qo.toFixed(0)   + ' bpd');
  set('prod_qw',   qw.toFixed(0)   + ' bpd');
  set('prod_qg',   qg.toFixed(2)   + ' Mscf/d');
  set('prod_dens', dens.toFixed(3) + ' g/cc');
  set('prod_res',  qRes.toFixed(1) + ' rb/d');
}

/**
 * Muestra los resultados calculados de la BSN.
 */
export function actualizarResultadosBSN({ cabeza, bhp, efic, carga, kw }) {
  set('bsn_cabeza', cabeza.toFixed(0) + ' m');
  set('bsn_bhp',    bhp.toFixed(0)    + ' HP');
  set('bsn_efic',   efic.toFixed(1)   + ' %');
  set('bsn_carga',  carga.toFixed(1)  + ' %');
  set('bsn_kw',     kw.toFixed(1)     + ' kW');
}

/**
 * Actualiza las KPI cards, tabla y diagnóstico del perfil RPF.
 */
export function actualizarResultadosRPF(result) {
  const { kpis, operacion, diagnostico, depths, pressures, temps, gradPs, gradTs } = result;

  set('rpf_bhp_est',  kpis.pws.toFixed(1));
  set('rpf_bht',      kpis.bht.toFixed(1));
  set('rpf_grad_p',   kpis.gradP.toFixed(2));
  set('rpf_grad_t',   kpis.gradT.toFixed(2));

  set('rpf_prof_bsn', operacion.profBSN.toFixed(0) + ' m');
  set('rpf_pws_card', operacion.pws.toFixed(2) + ' kg/cm²');
  set('rpf_pwf_card', operacion.pwf.toFixed(2) + ' kg/cm²');
  set('rpf_drawdown', operacion.drawdown.toFixed(2) + ' kg/cm²');
  set('rpf_j_card',   operacion.J.toFixed(2) + ' bpd/kg/cm²');

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
      <td class="px-4 py-1.5">${d.toFixed(0)}${isBSN ? ' ★' : ''}</td>
      <td class="px-4 py-1.5">${pressures[i].toFixed(2)}</td>
      <td class="px-4 py-1.5">${temps[i].toFixed(1)}</td>
      <td class="px-4 py-1.5">${gradPs[i]}</td>
      <td class="px-4 py-1.5">${gradTs[i]}</td>
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
      <td class="px-4 py-2">${r.val}</td>
      <td class="px-4 py-2 font-medium">${r.Qmax}</td>
      <td class="px-4 py-2">${r.qOp}</td>
      <td class="px-4 py-2">${r.drawdown}</td>
      <td class="px-4 py-2">${r.eficiencia}</td>
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
