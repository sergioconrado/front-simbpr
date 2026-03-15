// AppView.js — Application navigation DOM updates

/**
 * Activa un botón del subnav y muestra el panel correspondiente.
 * Oculta los demás paneles y botones.
 * @param {Element} btn    - botón del subnav que se activó
 * @param {string}  tabId  - id del panel a mostrar
 */
export function activarSubnavUI(btn, tabId) {
  document.querySelectorAll('.subnav-btn').forEach((b) => {
    b.classList.remove('subnav-active');
    b.setAttribute('aria-selected', 'false');
  });
  document.querySelectorAll('.subnav-panel').forEach((p) => {
    p.classList.add('hidden');
    p.classList.remove('flex');
  });

  btn.classList.add('subnav-active');
  btn.setAttribute('aria-selected', 'true');

  const panel = document.getElementById(tabId);
  if (panel) {
    panel.classList.remove('hidden');
    panel.classList.add('flex');
  }
}

/**
 * Desactiva todos los botones del subnav (sin activar ninguno).
 */
export function desactivarSubnavUI() {
  document.querySelectorAll('.subnav-btn').forEach((b) => {
    b.classList.remove('subnav-active');
    b.setAttribute('aria-selected', 'false');
  });
  document.querySelectorAll('.subnav-panel').forEach((p) => {
    p.classList.add('hidden');
    p.classList.remove('flex');
  });
}

/**
 * Muestra u oculta el panel del simulador.
 */
export function mostrarSimulador(visible) {
  const panel = document.getElementById('panel-simulador');
  if (!panel) return;
  if (visible) {
    panel.classList.remove('hidden');
  } else {
    panel.classList.add('hidden');
  }
}

/**
 * Activa un panel del lado derecho del simulador y actualiza el tab activo.
 * @param {string}  panelId - id del panel a mostrar
 * @param {Element} boton   - botón tab que disparó la acción
 */
export function mostrarPanelUI(panelId, boton) {
  ['panel-grafico', 'panel-datos', 'panel-sensibilidad', 'panel-perfilrpf'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  const target = document.getElementById(panelId);
  if (target) target.classList.remove('hidden');

  document.querySelectorAll('.tab-btn-panel').forEach((btn) => {
    btn.classList.remove('tab-active');
    btn.classList.add('tab-inactive');
  });
  boton.classList.remove('tab-inactive');
  boton.classList.add('tab-active');
}

/**
 * Muestra una pestaña del panel izquierdo del simulador (Yacimiento / Pozo / etc.).
 * @param {string}  tab   - id de la sección a mostrar
 * @param {Element} boton - botón tab que disparó la acción
 */
export function mostrarTabUI(tab, boton) {
  ['yacimiento', 'pozo', 'produccion', 'bsn'].forEach((id) => {
    document.getElementById(id).classList.add('hidden');
  });
  document.getElementById(tab).classList.remove('hidden');

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.remove('tab-active');
    btn.classList.add('tab-inactive');
  });
  boton.classList.remove('tab-inactive');
  boton.classList.add('tab-active');
}

/**
 * Activa el botón del subnav de Proyectos y muestra su panel.
 */
export function mostrarPanelProyectos() {
  const proyBtn = document.querySelector('[data-tab="tab-proyecto"]');
  if (proyBtn) {
    activarSubnavUI(proyBtn, 'tab-proyecto');
  }
}
