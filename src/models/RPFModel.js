// RPFModel.js — Reservoir Pressure/Temperature Profile & Sensitivity Analysis

const TEMP_SUPERFICIAL = 25; // °C estimada en superficie

/**
 * Calcula el perfil de presión y temperatura vs. profundidad.
 * @param {{ pws: number, pwf: number, J: number, profBSN: number, bht: number }} params
 * @returns {{ gradP, gradT, depths, pressures, temps, gradPs, gradTs, diagnostico, kpis, operacion }}
 */
export function calcularRPF({ pws, pwf, J, profBSN, bht }) {
  const STEPS = 10;
  const gradP = (pws / profBSN) * 100;      // kg/cm²/100 m
  const gradT = ((bht - TEMP_SUPERFICIAL) / profBSN) * 100; // °C/100 m

  const depths = [], pressures = [], temps = [], gradPs = [], gradTs = [];

  for (let i = 0; i <= STEPS; i++) {
    const d = (i / STEPS) * profBSN;
    const p = (d / profBSN) * pws;
    const t = TEMP_SUPERFICIAL + (d / profBSN) * (bht - TEMP_SUPERFICIAL);
    const gp = i > 0
      ? ((p - pressures[i - 1]) / ((d - depths[i - 1]) / 100)).toFixed(2)
      : '—';
    const gt = i > 0
      ? ((t - temps[i - 1]) / ((d - depths[i - 1]) / 100)).toFixed(2)
      : '—';
    depths.push(d);
    pressures.push(p);
    temps.push(t);
    gradPs.push(gp);
    gradTs.push(gt);
  }

  const drawdown = pws - pwf;
  const ddPct = pws > 0 ? (drawdown / pws) * 100 : 0;
  const Qmax = J * pws;

  const diagnostico = {
    presion: drawdown > 30
      ? `Drawdown elevado (${drawdown.toFixed(1)} kg/cm²). Alta diferencial disponible.`
      : `Drawdown moderado (${drawdown.toFixed(1)} kg/cm²). Pozo en régimen estable.`,
    temp: bht > 100
      ? `BHT alta (${bht}°C). Verificar elastómeros y viscosidad del aceite.`
      : `BHT normal (${bht}°C). Condiciones térmicas aceptables para BSN.`,
    prod:
      `Qmax estimado: ${Qmax.toFixed(0)} bpd. ` +
      (ddPct > 40
        ? 'Pozo sub-explotado, potencial de incremento.'
        : 'Pozo operando cerca de su potencial.'),
    bsn: profBSN > 2000
      ? `Profundidad >${profBSN}m. Revisar cable y protector de motor para alta temperatura.`
      : `Profundidad aceptable (${profBSN}m). Configuración BSN estándar aplicable.`,
  };

  return {
    gradP,
    gradT,
    depths,
    pressures,
    temps,
    gradPs,
    gradTs,
    diagnostico,
    kpis:     { pws, bht, gradP, gradT },
    operacion: { profBSN, pws, pwf, drawdown, J },
  };
}

/**
 * Calcula el análisis de sensibilidad variando un parámetro.
 * @param {{ pws: number, pwf: number, J: number, variable: string, sMin: number, sMax: number }} params
 * @returns {{ rows, xVals, qmaxVals, qopVals, label }}
 */
export function calcularSensibilidad({ pws, pwf, J, variable, sMin, sMax }) {
  const labels = {
    j:   'J (bpd/kg/cm²)',
    pwf: 'Pwf (kg/cm²)',
    pws: 'Pws (kg/cm²)',
  };

  const steps = 10;
  const step = (sMax - sMin) / steps;
  const rows = [], xVals = [], qmaxVals = [], qopVals = [];

  for (let i = 0; i <= steps; i++) {
    const val  = sMin + i * step;
    const jV   = variable === 'j'   ? val : J;
    const pwfV = variable === 'pwf' ? val : pwf;
    const pwsV = variable === 'pws' ? val : pws;

    const Qmax = (jV * pwsV) / 1.8;
    let qOp = 0, diffMin = Infinity;
    const N = 60;
    for (let k = 0; k <= N; k++) {
      const q = (k / N) * Qmax;
      const pCalc = pwsV * (1 - 0.2 * (q / Qmax) - 0.8 * Math.pow(q / Qmax, 2));
      const diff = Math.abs(pCalc - pwfV);
      if (diff < diffMin) { diffMin = diff; qOp = q; }
    }

    const drawdown  = pwsV - pwfV;
    const eficiencia = Qmax > 0 ? ((qOp / Qmax) * 100).toFixed(1) : '0.0';
    rows.push({
      val:        val.toFixed(2),
      Qmax:       Qmax.toFixed(0),
      qOp:        qOp.toFixed(0),
      drawdown:   drawdown.toFixed(2),
      eficiencia,
    });
    xVals.push(val.toFixed(2));
    qmaxVals.push(parseFloat(Qmax.toFixed(1)));
    qopVals.push(parseFloat(qOp.toFixed(1)));
  }

  return { rows, xVals, qmaxVals, qopVals, label: labels[variable] };
}
