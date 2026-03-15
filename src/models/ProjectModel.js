// ProjectModel.js — Project data management (state & CRUD)

export const ESTADO_COLORS = {
  Activo:    { bg: 'bg-green-100', text: 'text-green-700' },
  'En pausa': { bg: 'bg-amber-100', text: 'text-amber-700' },
  Cerrado:   { bg: 'bg-gray-100',  text: 'text-gray-500'  },
};

export const AVATAR_COLORS = [
  'bg-blue-200',
  'bg-violet-200',
  'bg-emerald-200',
  'bg-rose-200',
  'bg-amber-200',
  'bg-cyan-200',
];

let _proyectos = [];
let _proyectoActivoIdx = -1;

export function getProyectos() {
  return _proyectos;
}

export function getProyectoActivoIdx() {
  return _proyectoActivoIdx;
}

export function setProyectoActivoIdx(idx) {
  _proyectoActivoIdx = idx;
}

export function getProyecto(idx) {
  return _proyectos[idx] || null;
}

export function agregarProyecto(data) {
  _proyectos.push(data);
  return _proyectos.length - 1;
}

export function actualizarProyecto(idx, data) {
  if (idx >= 0 && idx < _proyectos.length) {
    _proyectos[idx] = data;
  }
}

/**
 * Elimina un proyecto y ajusta el índice activo.
 * @returns {{ wasActive: boolean }}
 */
export function eliminarProyecto(idx) {
  const wasActive = _proyectoActivoIdx === idx;
  _proyectos.splice(idx, 1);
  if (wasActive) {
    _proyectoActivoIdx = -1;
  } else if (_proyectoActivoIdx > idx) {
    _proyectoActivoIdx--;
  }
  return { wasActive };
}

export function toggleEstadoProyecto(idx) {
  const estados = ['Activo', 'En pausa', 'Cerrado'];
  const cur = estados.indexOf(_proyectos[idx].estado);
  _proyectos[idx].estado = estados[(cur + 1) % estados.length];
}

/**
 * Construye el objeto de datos de un proyecto nuevo.
 */
export function crearDatosProyecto(fields) {
  return {
    nombre:      fields.nombre,
    usuario:     fields.usuario,
    compania:    fields.compania || '',
    cliente:     fields.cliente,
    orden:       fields.orden || '',
    comentarios: fields.comentarios || '',
    fecha:       new Date().toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
    }),
    estado: 'Activo',
  };
}

/**
 * Devuelve las iniciales (máximo 2) de un nombre.
 */
export function iniciales(nombre) {
  return nombre
    .trim()
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

/**
 * Escapa caracteres HTML peligrosos.
 */
export function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
