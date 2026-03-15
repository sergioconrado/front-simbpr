// AppController.js — Application navigation & misc UI

import { getProyectoActivoIdx } from '../models/ProjectModel.js';
import { activarSubnavUI, desactivarSubnavUI, mostrarSimulador } from '../views/AppView.js';
import { mostrarBarraContexto } from '../views/ProjectView.js';

/**
 * Activa/desactiva un botón del subnav y muestra el panel correspondiente.
 * Si el botón ya estaba activo, lo desactiva y vuelve al simulador (si hay
 * proyecto activo) o simplemente muestra el simulador.
 * @param {Element} btn   - botón del subnav
 * @param {string}  tabId - id del panel a mostrar
 */
export function activarSubnav(btn, tabId) {
  const isAlreadyActive = btn.getAttribute('aria-selected') === 'true';

  desactivarSubnavUI();

  if (isAlreadyActive) {
    // Toggle off: volver al simulador con el contexto del proyecto si hay uno activo
    if (getProyectoActivoIdx() >= 0) {
      mostrarBarraContexto(true);
    }
    mostrarSimulador(true);
  } else {
    // Mostrar el panel seleccionado y ocultar el simulador
    mostrarSimulador(false);
    mostrarBarraContexto(false);
    activarSubnavUI(btn, tabId);
  }
}

export function guardarSubnavForm(section) {
  alert('Datos de ' + section + ' guardados.');
}

export function agregarOrden() {
  const lista = document.getElementById('orden-lista');
  const num   = lista.children.length + 1;
  const padded = String(num).padStart(3, '0');
  const hoy   = new Date().toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const item = document.createElement('div');
  item.className =
    'bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4';
  item.innerHTML = `
    <div class="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
      <svg class="w-4 h-4 text-gray-500" viewBox="0 0 16 16" fill="currentColor">
        <path fill-rule="evenodd" d="M2.5 1.75a.25.25 0 01.25-.25h8.5a.25.25 0 01.25.25v7.736a.75.75 0 101.5 0V1.75A1.75 1.75 0 0011.25 0h-8.5A1.75 1.75 0 001 1.75v11.5c0 .966.784 1.75 1.75 1.75h3.17a.75.75 0 000-1.5H2.75a.25.25 0 01-.25-.25V1.75zM4.75 4a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5zm0 3a.75.75 0 000 1.5h2.5a.75.75 0 000-1.5h-2.5zm9.03 3.22a.75.75 0 010 1.06l-3.25 3.25a.75.75 0 01-1.06 0l-1.5-1.5a.75.75 0 011.06-1.06l.97.97 2.72-2.72a.75.75 0 011.06 0z" clip-rule="evenodd"/>
      </svg>
    </div>
    <div class="flex-1">
      <div class="flex items-center justify-between">
        <p class="text-sm font-semibold text-gray-800">OT-2026-${padded} — Nueva orden</p>
        <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">Pendiente</span>
      </div>
      <p class="text-xs text-gray-500 mt-1">Pozo TARATUNICH 41-D · ${hoy}</p>
    </div>`;
  lista.appendChild(item);
}

export function agregarComentario() {
  const ta    = document.getElementById('nuevo-comentario');
  const texto = ta.value.trim();
  if (!texto) return;
  const lista = document.getElementById('comentarios-lista');
  const hoy   = new Date().toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const item = document.createElement('div');
  item.className = 'flex gap-3';
  item.innerHTML = `
    <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-semibold shrink-0">SC</div>
    <div class="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div class="flex items-center justify-between mb-1">
        <span class="text-sm font-semibold text-gray-800">Sergio</span>
        <span class="text-xs text-gray-400">${hoy}</span>
      </div>
      <p class="text-sm text-gray-600">${texto.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
    </div>`;
  lista.appendChild(item);
  ta.value = '';
}
