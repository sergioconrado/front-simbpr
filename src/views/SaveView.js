// SaveView.js - visual state for the active project save action

const STATE = {
  clean: {
    label: 'Sin cambios',
    classes: 'bg-gray-100 text-gray-400 cursor-not-allowed',
    disabled: true,
  },
  dirty: {
    label: 'Cambios pendientes',
    classes: 'bg-amber-500 text-white hover:bg-amber-600',
    disabled: false,
  },
  saving: {
    label: 'Guardando...',
    classes: 'bg-blue-600 text-white cursor-wait',
    disabled: true,
  },
  saved: {
    label: 'Guardado correctamente',
    classes: 'bg-emerald-600 text-white',
    disabled: true,
  },
  error: {
    label: 'Error al guardar',
    classes: 'bg-red-600 text-white hover:bg-red-700',
    disabled: false,
  },
};

const BASE_CLASSES = 'shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition';

export function actualizarEstadoGuardado(estado, detalle = '') {
  const config = STATE[estado] || STATE.clean;
  const btn = document.getElementById('btn-guardar-proyecto-activo');
  const label = document.getElementById('save-status-label');
  if (!btn || !label) return;

  btn.disabled = config.disabled;
  btn.className = `${BASE_CLASSES} ${config.classes}`;
  btn.title = detalle || config.label;
  label.textContent = config.label;
}
