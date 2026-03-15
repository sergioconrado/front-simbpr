// BSNModel.js — Bomba Sumergible (BSN) calculations

/**
 * Calcula los parámetros de operación de la Bomba Sumergible (BSN).
 * @param {{ etapas: number, freq: number, hp: number, volt: number, amp: number }} params
 * @returns {{ cabeza: number, bhp: number, efic: number, carga: number, kw: number }}
 */
export function calcularBSN({ etapas, freq, hp, volt, amp }) {
  // Leyes de afinidad: H ∝ (n/n0)²  — referencia a 60 Hz
  const factorH = (freq / 60) * (freq / 60);
  // Cabeza típica por etapa ≈ 8 m a BEP (60 Hz)
  const cabeza = etapas * 8 * factorH;
  // BHP = HP × 0.80 (pérdidas mecánicas ~20 %)
  const bhp = hp * 0.8;
  // Eficiencia hidráulica estimada: escala con frecuencia, base 67 %
  const efic = 67 * factorH;
  // Factor de carga = BHP / HP instalado
  const carga = (bhp / hp) * 100;
  // Potencia eléctrica = √3 × V × I × FP (FP ≈ 0.85)
  const kw = (Math.sqrt(3) * volt * amp * 0.85) / 1000;
  return { cabeza, bhp, efic, carga, kw };
}
