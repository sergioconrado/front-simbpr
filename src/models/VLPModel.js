// VLPModel.js - Vertical Lift Performance calculations

const M_PER_KGCM2_WATER = 10.197;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function oilSpecificGravity(api) {
  return 141.5 / ((api || 35) + 131.5);
}

function liquidSpecificGravity({ bsw = 0, api = 35 }) {
  const waterCut = clamp(bsw / 100, 0, 1);
  const sgOil = oilSpecificGravity(api);
  const sgWater = 1.03;
  return sgOil * (1 - waterCut) + sgWater * waterCut;
}

function gasCorrection({ gor = 0, qFrac = 0 }) {
  const gasIntensity = clamp(gor / 600, 0, 1.4);
  return clamp(1 - gasIntensity * (0.18 + 0.05 * qFrac), 0.55, 1);
}

function calcularHeadBomba({ etapas = 0, freq = 60, sgLiquido = 1 }) {
  const factorH = (freq / 60) * (freq / 60);
  const headMetros = etapas * 9 * factorH;
  return (headMetros * sgLiquido) / M_PER_KGCM2_WATER;
}

function calcularPerdidaFriccion(q, params) {
  const {
    profundidadFlujo = 0,
    tubingId = 2.441,
    viscosidad = 2.5,
    sgLiquido = 0.9,
  } = params;

  const qMbd = Math.max(q, 0) / 1000;
  const idFactor = Math.pow(2.441 / Math.max(tubingId, 1), 4.8);
  const viscFactor = Math.pow(Math.max(viscosidad, 0.2) / 2.5, 0.18);
  const sgFactor = clamp(sgLiquido, 0.65, 1.1);

  return 75 * qMbd * qMbd * (profundidadFlujo / 2000) * idFactor * viscFactor * sgFactor;
}

export function calcularPwfVLPDesdeQ(q, params) {
  const {
    qmax = 1,
    pwh = 20,
    pl = 15,
    profBSN = 2200,
    profundidadDisponible = profBSN,
    nivelLiquido = 500,
    bsw = 30,
    api = 35,
    gor = 150,
    viscosidad = 2.5,
    etapas = 120,
    freq = 60,
  } = params;

  const qFrac = clamp(q / Math.max(qmax, 1), 0, 1);
  const sgLiquido = liquidSpecificGravity({ bsw, api });
  const sgMezcla = sgLiquido * gasCorrection({ gor, qFrac });
  const profundidadTrabajo = Math.min(profBSN, profundidadDisponible || profBSN);
  const profundidadFlujo = Math.max(profundidadTrabajo - nivelLiquido, 0);
  const pSuperficie = Math.max(pwh, pl);
  const pHidrostatica = (profundidadFlujo * sgMezcla) / M_PER_KGCM2_WATER;
  const pBomba = calcularHeadBomba({ etapas, freq, sgLiquido });
  const pFriccion = calcularPerdidaFriccion(q, {
    ...params,
    profundidadFlujo,
    sgLiquido,
    viscosidad,
  });

  return Math.max(pSuperficie + pHidrostatica + pFriccion - pBomba, 0);
}

export function calcularCurvaVLP(qVals, params = {}) {
  const qmax = params.qmax || qVals[qVals.length - 1] || 1;
  return qVals.map((q) => ({
    x: q,
    y: calcularPwfVLPDesdeQ(q, { ...params, qmax }),
  }));
}

export function encontrarInterseccionCurvas(curvaA, curvaB) {
  if (!curvaA.length || curvaA.length !== curvaB.length) return null;

  let mejor = {
    x: curvaA[0].x,
    y: curvaA[0].y,
    diff: Math.abs(curvaA[0].y - curvaB[0].y),
  };

  for (let i = 1; i < curvaA.length; i++) {
    const prevDiff = curvaA[i - 1].y - curvaB[i - 1].y;
    const diff = curvaA[i].y - curvaB[i].y;
    const absDiff = Math.abs(diff);

    if (absDiff < mejor.diff) {
      mejor = { x: curvaA[i].x, y: (curvaA[i].y + curvaB[i].y) / 2, diff: absDiff };
    }

    if (prevDiff === 0) return { x: curvaA[i - 1].x, y: curvaA[i - 1].y };
    if (prevDiff * diff < 0) {
      const t = Math.abs(prevDiff) / (Math.abs(prevDiff) + Math.abs(diff));
      const x = curvaA[i - 1].x + t * (curvaA[i].x - curvaA[i - 1].x);
      const yA = curvaA[i - 1].y + t * (curvaA[i].y - curvaA[i - 1].y);
      const yB = curvaB[i - 1].y + t * (curvaB[i].y - curvaB[i - 1].y);
      return { x, y: (yA + yB) / 2 };
    }
  }

  return mejor.diff < 3 ? { x: mejor.x, y: mejor.y } : null;
}
