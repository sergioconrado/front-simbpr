// ProjectView.js — Project list/form DOM rendering

import {
  ESTADO_COLORS,
  AVATAR_COLORS,
  iniciales,
  escHtml,
} from '../models/ProjectModel.js';

/**
 * Renderiza la lista de tarjetas de proyectos.
 * @param {Array}    proyectos        - arreglo de proyectos
 * @param {Function} onAbrirProyecto  - callback(idx)
 * @param {Function} onEditar         - callback(idx)
 * @param {Function} onEliminar       - callback(idx)
 * @param {Function} onToggleEstado   - callback(idx)
 */
export function renderProyectos(
  proyectos,
  onAbrirProyecto,
  onEditar,
  onEliminar,
  onToggleEstado,
) {
  const lista = document.getElementById('proy-lista');
  const empty = document.getElementById('proy-empty');
  lista.innerHTML = '';

  // Actualizar badge del subnav
  const badge = document.getElementById('subnav-proy-count');
  if (badge) badge.textContent = proyectos.length;

  if (proyectos.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  proyectos.forEach((p, i) => {
    const col  = AVATAR_COLORS[i % AVATAR_COLORS.length];
    const ec   = ESTADO_COLORS[p.estado] || ESTADO_COLORS['Activo'];
    const card = document.createElement('div');
    card.className =
      'bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 ' +
      'hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group';
    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      onAbrirProyecto(i);
    });

    card.innerHTML =
      '<div class="flex items-start justify-between gap-2">' +
        '<div class="flex items-center gap-3 min-w-0">' +
          `<div class="w-10 h-10 rounded-xl ${col} flex items-center justify-center text-xs font-bold text-gray-700 shrink-0">` +
            iniciales(p.nombre) +
          '</div>' +
          '<div class="min-w-0">' +
            `<p class="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">${escHtml(p.nombre)}</p>` +
            `<p class="text-xs text-gray-400 truncate">${escHtml(p.cliente)}</p>` +
          '</div>' +
        '</div>' +
        `<button data-action="toggle-estado" title="Cambiar estado" class="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${ec.bg} ${ec.text} hover:opacity-80 transition whitespace-nowrap">` +
          p.estado +
        '</button>' +
      '</div>' +
      '<div class="space-y-1 text-xs text-gray-500">' +
        (p.usuario  ? `<div class="flex gap-1.5"><span class="text-gray-400 w-16 shrink-0">Usuario</span><span class="font-medium text-gray-700 truncate">${escHtml(p.usuario)}</span></div>`  : '') +
        (p.compania ? `<div class="flex gap-1.5"><span class="text-gray-400 w-16 shrink-0">Compañía</span><span class="font-medium text-gray-700 truncate">${escHtml(p.compania)}</span></div>` : '') +
        (p.orden    ? `<div class="flex gap-1.5"><span class="text-gray-400 w-16 shrink-0">OT</span><span class="font-medium text-gray-700">${escHtml(p.orden)}</span></div>`                  : '') +
      '</div>' +
      (p.comentarios ? `<p class="text-xs text-gray-400 italic line-clamp-2">${escHtml(p.comentarios)}</p>` : '') +
      '<div class="flex items-center justify-between pt-1 border-t border-gray-50">' +
        `<span class="text-[10px] text-gray-300">${p.fecha}</span>` +
        '<span class="text-[10px] text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity font-medium flex items-center gap-0.5">' +
          '<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>' +
          'Abrir' +
        '</span>' +
        '<div class="flex gap-2">' +
          '<button data-action="editar" title="Editar" class="text-gray-400 hover:text-gray-700 transition">' +
            '<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>' +
          '</button>' +
          '<button data-action="eliminar" title="Eliminar" class="text-gray-400 hover:text-red-500 transition">' +
            '<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>' +
          '</button>' +
        '</div>' +
      '</div>';

    // Attach button events
    card.querySelector('[data-action="toggle-estado"]').addEventListener('click', () => onToggleEstado(i));
    card.querySelector('[data-action="editar"]').addEventListener('click',        () => onEditar(i));
    card.querySelector('[data-action="eliminar"]').addEventListener('click',      () => onEliminar(i));

    lista.appendChild(card);
  });
}

/**
 * Muestra el formulario para nuevo o editar proyecto.
 * @param {object|null} proyecto - null para nuevo, objeto para editar
 */
export function mostrarFormProyecto(proyecto) {
  const wrap = document.getElementById('form-proyecto-wrap');
  document.getElementById('form-proyecto-title').textContent =
    proyecto ? 'Editar Proyecto' : 'Nuevo Proyecto';

  const campos = ['proy-nombre', 'proy-usuario', 'proy-compania', 'proy-cliente', 'proy-orden', 'proy-comentarios'];
  campos.forEach((id) => {
    const key = id.replace('proy-', '');
    document.getElementById(id).value = proyecto ? (proyecto[key] || '') : '';
  });

  wrap.classList.remove('hidden');
  document.getElementById('proy-nombre').focus();
}

/**
 * Oculta el formulario de proyecto.
 */
export function ocultarFormProyecto() {
  document.getElementById('form-proyecto-wrap').classList.add('hidden');
}

/**
 * Resalta los campos obligatorios faltantes.
 */
export function resaltarCamposRequeridos(ids) {
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el || el.value.trim()) return;
    el.classList.add('border-red-300', 'ring-1', 'ring-red-200');
    setTimeout(() => el.classList.remove('border-red-300', 'ring-1', 'ring-red-200'), 1800);
  });
}

/**
 * Lee los valores del formulario de proyecto.
 * @returns {{ nombre, usuario, compania, cliente, orden, comentarios }}
 */
export function leerFormProyecto() {
  return {
    nombre:      document.getElementById('proy-nombre').value.trim(),
    usuario:     document.getElementById('proy-usuario').value.trim(),
    compania:    document.getElementById('proy-compania').value.trim(),
    cliente:     document.getElementById('proy-cliente').value.trim(),
    orden:       document.getElementById('proy-orden').value.trim(),
    comentarios: document.getElementById('proy-comentarios').value.trim(),
  };
}

/**
 * Actualiza la barra de contexto del proyecto activo.
 */
export function actualizarBarraContexto(proyecto, idx) {
  const col = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  const ec  = ESTADO_COLORS[proyecto.estado] || ESTADO_COLORS['Activo'];

  const avatarEl = document.getElementById('ctx-avatar');
  avatarEl.textContent = iniciales(proyecto.nombre);
  avatarEl.className   =
    `w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-gray-700 shrink-0 ${col}`;

  document.getElementById('ctx-nombre').textContent = proyecto.nombre;
  document.getElementById('ctx-cliente').textContent = proyecto.cliente;
  document.getElementById('ctx-cliente-wrap').style.display = proyecto.cliente ? 'flex' : 'none';
  document.getElementById('ctx-compania').textContent = proyecto.compania;
  document.getElementById('ctx-compania-wrap').style.display = proyecto.compania ? 'flex' : 'none';
  document.getElementById('ctx-usuario').textContent = proyecto.usuario;
  document.getElementById('ctx-usuario-wrap').style.display = proyecto.usuario ? 'flex' : 'none';
  document.getElementById('ctx-orden').textContent = proyecto.orden;
  document.getElementById('ctx-orden-wrap').style.display = proyecto.orden ? 'flex' : 'none';

  const ctxComentarios = document.getElementById('ctx-comentarios-wrap');
  if (proyecto.comentarios) {
    ctxComentarios.classList.remove('hidden');
    ctxComentarios.classList.add('flex');
    ctxComentarios.title = proyecto.comentarios;
    document.getElementById('ctx-comentarios').textContent = proyecto.comentarios;
  } else {
    ctxComentarios.classList.add('hidden');
    ctxComentarios.classList.remove('flex');
  }

  const estadoEl = document.getElementById('ctx-estado');
  estadoEl.textContent = proyecto.estado;
  estadoEl.className   =
    `shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full ${ec.bg} ${ec.text}`;
}

/**
 * Actualiza el texto del footer con el proyecto activo.
 */
export function actualizarFooter(proyecto) {
  const el = document.getElementById('footer-proyecto-texto');
  if (!el) return;
  if (proyecto) {
    el.textContent =
      'Activa Local | ' +
      proyecto.nombre +
      (proyecto.cliente ? ' · ' + proyecto.cliente : '') +
      (proyecto.orden   ? ' · ' + proyecto.orden   : '');
  } else {
    el.textContent = 'Activa Local | Sin proyecto seleccionado';
  }
}

/**
 * Muestra u oculta la barra de contexto del proyecto.
 */
export function mostrarBarraContexto(visible) {
  const bar = document.getElementById('proyecto-context-bar');
  if (!bar) return;
  bar.classList.toggle('hidden', !visible);
}
