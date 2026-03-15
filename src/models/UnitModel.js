// UnitModel.js — Unit conversion state and utility functions

export const KGcm2_TO_PSI = 14.2233;

let _currentUnidad = 'kg';

export function getCurrentUnidad() {
  return _currentUnidad;
}

export function setCurrentUnidad(unidad) {
  _currentUnidad = unidad;
}

export function esPSI() {
  return _currentUnidad === 'psi';
}

/**
 * Convierte una curva IPR de kg/cm² a PSI si la unidad activa es PSI.
 */
export function iprParaGrafico(ipr) {
  if (!esPSI()) return ipr;
  return ipr.map((p) => ({
    x: p.x,
    y: parseFloat((p.y * KGcm2_TO_PSI).toFixed(2)),
  }));
}

export function yAxisLabel() {
  return esPSI() ? 'Pwf (PSI)' : 'Pwf (kg/cm²)';
}

export function pwsParaEje(pws) {
  return esPSI() ? pws * KGcm2_TO_PSI : pws;
}
