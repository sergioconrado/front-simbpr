// ProductionModel.js — Fluid production calculations

/**
 * Calcula el desglose de fluidos a partir de los parámetros de producción.
 * @param {{ qt: number, bsw: number, api: number, gor: number, bo: number }} params
 * @returns {{ qo: number, qw: number, qg: number, dens: number, qRes: number }}
 */
export function calcularProduccion({ qt, bsw, api, gor, bo }) {
  const qo = qt * (1 - bsw / 100);
  const qw = qt * (bsw / 100);
  const qg = (qo * gor) / 1000; // Mscf/d
  const dens = 141.5 / (api + 131.5); // g/cc (fórmula API)
  const qRes = qo * bo; // rb/d en yacimiento
  return { qo, qw, qg, dens, qRes };
}
