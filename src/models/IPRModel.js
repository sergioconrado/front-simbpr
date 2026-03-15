// IPRModel.js — Pure IPR calculation logic (Vogel model)

/**
 * Calcula Qmax calibrado para Vogel a partir del punto de prueba.
 * Vogel: Qmax = Qb / (1 - 0.2*(Pwf/Pws) - 0.8*(Pwf/Pws)^2)
 * @returns {number|null} Qmax > 0 o null si los parámetros son inválidos
 */
export function calcularQmaxDesdePuntoVogel(pws, pwf, qb) {
  if (pws <= 0 || qb <= 0 || pwf < 0 || pwf > pws) return null;
  const a = pwf / pws;
  const denom = 1 - 0.2 * a - 0.8 * a * a;
  if (denom <= 0) return null;
  return qb / denom;
}

/**
 * Devuelve los 11 puntos de la tabla (índices 0,20,40…200)
 * de la curva generada con 201 puntos — tabla y gráfica siempre sincronizados.
 */
export function samplearPuntosIPR(ipr) {
  return [0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200]
    .map((i) => ipr[i])
    .filter(Boolean);
}

/**
 * Genera N+1 valores de caudal equidistantes de 0 a Qmax.
 */
export function generarQ(Qmax, N = 200) {
  const arr = [];
  for (let i = 0; i <= N; i++) {
    arr.push((i / N) * Qmax);
  }
  return arr;
}

/**
 * Calcula las curvas IPR y el punto de operación (sin acceder al DOM).
 * @param {number} pws - Presión estática (kg/cm²)
 * @param {number} pwf - Presión de fondo fluyente (kg/cm²)
 * @param {number} qb  - Caudal base de prueba (bpd)
 * @param {number} J   - Índice de productividad
 * @returns {{ ipr, pwfLine, qOperacion, pwfSistema, Qmax, pws, J, error }}
 */
export function calcularCurvas(pws, pwf, qb, J) {
  let Qmax;
  let error = null;
  let Jcalc = J;

  const Qcalc = calcularQmaxDesdePuntoVogel(pws, pwf, qb);
  if (Qcalc !== null && Qcalc > 0) {
    Qmax = Qcalc;
    Jcalc = (1.8 * Qmax) / (pws || 1);
  } else {
    Qmax = (J * pws) / 1.8;
    error = '⚠ Parámetros inválidos para calibración (revisar Pws, Pwf, Qb).';
  }

  const N = 200;
  const ipr = Array.from({ length: N + 1 }, (_, i) => {
    const pwfVal = pws * (1 - i / N);
    const r = pwfVal / pws;
    const q = Qmax * (1 - 0.2 * r - 0.8 * r * r);
    return { x: Math.max(q, 0), y: pwfVal };
  });

  const pwfLine = ipr.map((pt) => ({ x: pt.x, y: pwf }));

  let qOperacion = 0;
  let diffMin = Infinity;
  ipr.forEach((p) => {
    const diff = Math.abs(p.y - pwf);
    if (diff < diffMin) {
      diffMin = diff;
      qOperacion = p.x;
    }
  });

  return { ipr, pwfLine, qOperacion, pwfSistema: pwf, Qmax, pws, J: Jcalc, error };
}

/**
 * Devuelve { max, stepSize } con valores redondeados a números bonitos (50, 100, etc.)
 */
export function niceAxisMax(rawMax) {
  const target = rawMax * 1.1;
  const rough = target / 6;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  let step;
  if (norm < 1.5) step = 1;
  else if (norm < 3) step = 2;
  else if (norm < 7) step = 5;
  else step = 10;
  step *= mag;
  const nice = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000];
  step = nice.reduce((prev, cur) =>
    Math.abs(cur - step) < Math.abs(prev - step) ? cur : prev,
  );
  const max = Math.ceil(target / step) * step;
  return { max, stepSize: step };
}
