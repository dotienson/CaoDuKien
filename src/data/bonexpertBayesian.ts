import { Gender, MenarcheStatus } from './twmc';

export interface BayesianStepResult {
  // 1. Growth kinetics indicators
  caMinusBa: number;
  baMinusCa: number;
  boneAgeStatus: 'normal' | 'advanced' | 'delayed';
  gpFraction: number;
  gpPercent: number;
  bmi: number | null;
  bmiSdsRaw: number | null;
  bmiSdsClamped: number | null;

  // 2. Step-by-step heights
  hPop: number;
  wPopPct: number;
  wPPct: number;
  hRaw: number;
  hPred: number;
  rmsePop: number;
  deltaHBmi: number | null;
  hPredW: number | null;

  // 3. Extended modules (Parental height & Post-menarche)
  hMid: number | null;
  hParentEst: number | null;
  hPredP: number | null;
  hPredPW: number | null;
  rmseP: number | null;

  menarcheHeightUsed: number | null;
  hMenarcheEst: number | null;
  hPredM: number | null;
  rmseM: number | null;

  // 4. Final combined output & statistical confidence
  finalHeight: number;
  finalHeightLabel: string;
  finalRmse: number;
  ci68: [number, number];
  ci95: [number, number];
}

const BOYS_NN = {
  a: [1.43534, 0.82017, 2.17393, -1.92891, 0.63747, 1.32670],
  b: [0.0, 1.03737, 5.25727, -16.26621, 0.11931, 0.22182],
  c: [0.0, -3.05751, -1.21911, -2.02013, 0.42527, 0.32219],
  d: [0.0, 0.23627, 1.68813, 2.49618, 0.41590, 2.15137],
};

const GIRLS_NN = {
  a: [2.26426, -0.98041, 5.04084],
  b: [0.0, 13.94652, -0.09212],
  c: [0.0, -2.14929, -0.35351],
  d: [0.0, -0.32206, -0.83370],
};

const PARENT_PARAMS = {
  boy: { a: 0.7884, b: 42.2, h_pop_ref: 178.2 },
  girl: { a: 0.7186, b: 40.3, h_pop_ref: 165.0 },
};

// BA: [w_pop %, w_p %, rmse_pred, rmse_pred_p]
const BAYES_TABLE: Record<'boy' | 'girl', Record<number, [number, number, number, number]>> = {
  boy: {
    5: [16, 27, 4.0, 3.5],
    6: [15, 25, 4.0, 3.7],
    7: [15, 25, 3.9, 3.6],
    8: [12, 21, 3.5, 3.3],
    9: [12, 20, 3.5, 3.3],
    10: [13, 22, 3.6, 3.3],
    11: [12, 21, 3.5, 3.2],
    12: [11, 20, 3.5, 3.3],
    13: [13, 23, 3.8, 3.6],
    14: [11, 19, 3.4, 3.2],
    15: [4, 7, 1.9, 1.9],
    16: [1, 3, 1.2, 1.2],
    17: [1, 1, 0.9, 0.9],
    18: [0, 1, 0.6, 0.6],
  },
  girl: {
    5: [18, 36, 3.8, 3.4],
    6: [15, 32, 3.5, 3.2],
    7: [15, 30, 3.3, 3.0],
    8: [12, 27, 3.0, 2.8],
    9: [11, 24, 2.9, 2.7],
    10: [11, 23, 2.8, 2.6],
    11: [11, 25, 2.9, 2.8],
    12: [12, 26, 2.9, 2.8],
    13: [4, 10, 1.7, 1.6],
    14: [1, 3, 0.9, 0.9],
    15: [1, 2, 0.7, 0.7],
    16: [0, 1, 0.6, 0.5],
    17: [0, 1, 0.4, 0.4],
    18: [0, 0, 0.3, 0.3],
  },
};

// Reference BMI Mean, SD, and DeltaH(BA) slope (cm per 1 BMI SDS) for BA 5..18
const BMI_REF_TABLE: Record<'boy' | 'girl', Record<number, { mean: number; sd: number; deltaH: number }>> = {
  boy: {
    5: { mean: 15.5, sd: 1.3, deltaH: -0.45 },
    6: { mean: 15.5, sd: 1.4, deltaH: -0.55 },
    7: { mean: 15.7, sd: 1.5, deltaH: -0.65 },
    8: { mean: 16.0, sd: 1.7, deltaH: -0.78 },
    9: { mean: 16.4, sd: 1.9, deltaH: -0.90 },
    10: { mean: 16.9, sd: 2.1, deltaH: -1.00 },
    11: { mean: 17.5, sd: 2.3, deltaH: -1.05 },
    12: { mean: 18.1, sd: 2.4, deltaH: -0.98 },
    13: { mean: 18.8, sd: 2.5, deltaH: -0.82 },
    14: { mean: 19.5, sd: 2.5, deltaH: -0.60 },
    15: { mean: 20.2, sd: 2.5, deltaH: -0.35 },
    16: { mean: 20.8, sd: 2.5, deltaH: -0.18 },
    17: { mean: 21.4, sd: 2.6, deltaH: -0.08 },
    18: { mean: 21.9, sd: 2.6, deltaH: 0.0 },
  },
  girl: {
    5: { mean: 15.3, sd: 1.4, deltaH: -0.35 },
    6: { mean: 15.3, sd: 1.5, deltaH: -0.42 },
    7: { mean: 15.5, sd: 1.6, deltaH: -0.50 },
    8: { mean: 15.9, sd: 1.8, deltaH: -0.58 },
    9: { mean: 16.4, sd: 2.0, deltaH: -0.65 },
    10: { mean: 17.0, sd: 2.2, deltaH: -0.68 },
    11: { mean: 17.7, sd: 2.3, deltaH: -0.62 },
    12: { mean: 18.4, sd: 2.4, deltaH: -0.48 },
    13: { mean: 19.1, sd: 2.5, deltaH: -0.30 },
    14: { mean: 19.7, sd: 2.5, deltaH: -0.15 },
    15: { mean: 20.2, sd: 2.5, deltaH: -0.08 },
    16: { mean: 20.6, sd: 2.5, deltaH: -0.04 },
    17: { mean: 20.9, sd: 2.5, deltaH: 0.0 },
    18: { mean: 21.1, sd: 2.5, deltaH: 0.0 },
  },
};

function symmetricSigmoid(z: number): number {
  const zBounded = Math.max(Math.min(z, 50.0), -50.0);
  return 1.0 / (1.0 + Math.exp(-zBounded)) - 0.5;
}

export function calculateGrowthPotential(gender: Gender, ca: number, ba: number): number {
  const x = (ba - 12.0) / 16.0;
  const y = (ca - ba) / 4.0;
  const nn = gender === 'boy' ? BOYS_NN : GIRLS_NN;
  let hiddenSum = nn.a[0];
  const nUnits = nn.a.length - 1;

  for (let i = 1; i <= nUnits; i++) {
    const z = nn.b[i] * x + nn.c[i] * y + nn.d[i];
    hiddenSum += nn.a[i] * symmetricSigmoid(z);
  }

  let gp100 = 4.0 * Math.pow(hiddenSum, 2) + 0.1 - Math.pow(ca - 15.0, 2) / 1000.0;
  gp100 = Math.max(0.01, gp100);
  return gp100 / 100.0;
}

export function interpolateBayesianWeights(
  gender: Gender,
  ba: number
): [number, number, number, number] {
  const table = BAYES_TABLE[gender];
  const baClamped = Math.max(5.0, Math.min(18.0, ba));
  const baLow = Math.floor(baClamped);
  const baHigh = Math.ceil(baClamped);

  if (baLow === baHigh || baHigh > 18) {
    return table[Math.min(18, baLow)];
  }

  const frac = baClamped - baLow;
  const rowLow = table[baLow];
  const rowHigh = table[baHigh];

  return [
    rowLow[0] + frac * (rowHigh[0] - rowLow[0]),
    rowLow[1] + frac * (rowHigh[1] - rowLow[1]),
    rowLow[2] + frac * (rowHigh[2] - rowLow[2]),
    rowLow[3] + frac * (rowHigh[3] - rowLow[3]),
  ];
}

function interpolateBmiRef(gender: Gender, ba: number): { mean: number; sd: number; deltaH: number } {
  const table = BMI_REF_TABLE[gender];
  const baClamped = Math.max(5.0, Math.min(18.0, ba));
  const baLow = Math.floor(baClamped);
  const baHigh = Math.ceil(baClamped);

  if (baLow === baHigh || baHigh > 18) {
    return table[Math.min(18, baLow)];
  }

  const frac = baClamped - baLow;
  const low = table[baLow];
  const high = table[baHigh];

  return {
    mean: low.mean + frac * (high.mean - low.mean),
    sd: low.sd + frac * (high.sd - low.sd),
    deltaH: low.deltaH + frac * (high.deltaH - low.deltaH),
  };
}

export function predictBoneXpertBayesian(params: {
  gender: Gender;
  chronAge: number;
  boneAge: number;
  currentHeight: number;
  weight?: number | null;
  fatherHeight?: number | null;
  motherHeight?: number | null;
  menarche?: MenarcheStatus;
  menarcheHeight?: number | null;
  populationMeanHeight?: number | null;
}): BayesianStepResult | null {
  const {
    gender,
    chronAge,
    boneAge,
    currentHeight,
    weight,
    fatherHeight,
    motherHeight,
    menarche,
    menarcheHeight,
    populationMeanHeight,
  } = params;

  // Clinical scope: 4 - 18 years old and valid bone age 4 - 18.5
  if (
    chronAge < 4 ||
    chronAge > 19 ||
    boneAge < 4 ||
    boneAge > 19 ||
    currentHeight < 50 ||
    currentHeight > 210
  ) {
    return null;
  }

  // 1. Growth kinetics
  const caMinusBa = Math.round((chronAge - boneAge) * 100) / 100;
  const baMinusCa = Math.round((boneAge - chronAge) * 100) / 100;
  let boneAgeStatus: 'normal' | 'advanced' | 'delayed' = 'normal';
  if (baMinusCa > 1.0) boneAgeStatus = 'advanced';
  else if (baMinusCa < -1.0) boneAgeStatus = 'delayed';

  const gp = calculateGrowthPotential(gender, chronAge, boneAge);
  const gpPercent = Math.round(gp * 10000) / 100;

  // 2. Raw height prediction
  const hRaw = currentHeight / (1.0 - gp);

  // 3. Population reference height & Bayesian weights
  const defaultPop = gender === 'boy' ? 178.2 : 165.0;
  const hPop =
    populationMeanHeight && populationMeanHeight > 120 ? populationMeanHeight : defaultPop;

  const [wPopPct, wPPct, rmsePop, rmseP] = interpolateBayesianWeights(gender, boneAge);
  const wPop = wPopPct / 100.0;
  const wP = wPPct / 100.0;

  // Population-adjusted prediction (H_pred)
  const hPred = (1.0 - wPop) * hRaw + wPop * hPop;

  // 4. BMI SDS & Delta H_BMI module
  let bmi: number | null = null;
  let bmiSdsRaw: number | null = null;
  let bmiSdsClamped: number | null = null;
  let deltaHBmi: number | null = null;
  let hPredW: number | null = null;

  if (weight && weight > 5) {
    const heightM = currentHeight / 100.0;
    bmi = weight / (heightM * heightM);
    const bmiRef = interpolateBmiRef(gender, boneAge);
    bmiSdsRaw = (bmi - bmiRef.mean) / bmiRef.sd;
    bmiSdsClamped = Math.max(-2.0, Math.min(2.0, bmiSdsRaw));
    deltaHBmi = bmiRef.deltaH * bmiSdsClamped;
    hPredW = hPred + deltaHBmi;
  }

  // 5. Parental height module (H_predP & H_predPW)
  let hMid: number | null = null;
  let hParentEst: number | null = null;
  let hPredP: number | null = null;
  let hPredPW: number | null = null;

  if (fatherHeight && motherHeight && fatherHeight >= 120 && motherHeight >= 120) {
    hMid = (fatherHeight + motherHeight) / 2.0;
    const pParams = PARENT_PARAMS[gender];
    hParentEst =
      pParams.a * hMid + pParams.b + (1.0 - pParams.a) * (hPop - pParams.h_pop_ref);
    hPredP = (1.0 - wP) * hRaw + wP * hParentEst;
    if (deltaHBmi !== null) {
      hPredPW = hPredP + deltaHBmi;
    }
  }

  // Determine current best estimate before post-menarche update
  let currentRes = hPred;
  let currentRmse = rmsePop;
  let finalHeightLabel = 'H_pred (Hiệu chỉnh quần thể)';

  if (hPredPW !== null) {
    currentRes = hPredPW;
    currentRmse = rmseP;
    finalHeightLabel = 'H_predPW (Di truyền cha mẹ + BMI SDS)';
  } else if (hPredP !== null) {
    currentRes = hPredP;
    currentRmse = rmseP;
    finalHeightLabel = 'H_predP (Tích hợp di truyền cha mẹ)';
  } else if (hPredW !== null) {
    currentRes = hPredW;
    currentRmse = rmsePop;
    finalHeightLabel = 'H_predW (Hiệu chỉnh quần thể + BMI SDS)';
  }

  // 6. Post-menarche module for girls (H_predM)
  let menarcheHeightUsed: number | null = null;
  let hMenarcheEst: number | null = null;
  let hPredM: number | null = null;
  let rmseM: number | null = null;

  if (gender === 'girl' && menarche === 'post') {
    menarcheHeightUsed =
      menarcheHeight && menarcheHeight >= 100 && menarcheHeight <= currentHeight
        ? menarcheHeight
        : currentHeight;
    hMenarcheEst = menarcheHeightUsed + 6.6;
    const pM = 1.0 / Math.pow(2.2, 2);
    const pPred = 1.0 / Math.pow(currentRmse, 2);
    const pTotal = pPred + pM;

    hPredM = (pPred / pTotal) * currentRes + (pM / pTotal) * hMenarcheEst;
    rmseM = 1.0 / Math.sqrt(pTotal);

    currentRes = hPredM;
    currentRmse = rmseM;
    finalHeightLabel = 'H_predM (Tích hợp mốc sau kinh nguyệt)';
  }

  const finalHeight = Math.round(currentRes * 10) / 10;
  const finalRmse = Math.round(currentRmse * 100) / 100;

  const ci68: [number, number] = [
    Math.round((currentRes - currentRmse) * 10) / 10,
    Math.round((currentRes + currentRmse) * 10) / 10,
  ];
  const ci95: [number, number] = [
    Math.round((currentRes - 1.96 * currentRmse) * 10) / 10,
    Math.round((currentRes + 1.96 * currentRmse) * 10) / 10,
  ];

  return {
    caMinusBa,
    baMinusCa,
    boneAgeStatus,
    gpFraction: gp,
    gpPercent,
    bmi: bmi !== null ? Math.round(bmi * 100) / 100 : null,
    bmiSdsRaw: bmiSdsRaw !== null ? Math.round(bmiSdsRaw * 100) / 100 : null,
    bmiSdsClamped: bmiSdsClamped !== null ? Math.round(bmiSdsClamped * 100) / 100 : null,
    hPop: Math.round(hPop * 10) / 10,
    wPopPct: Math.round(wPopPct * 10) / 10,
    wPPct: Math.round(wPPct * 10) / 10,
    hRaw: Math.round(hRaw * 10) / 10,
    hPred: Math.round(hPred * 10) / 10,
    rmsePop: Math.round(rmsePop * 100) / 100,
    deltaHBmi: deltaHBmi !== null ? Math.round(deltaHBmi * 100) / 100 : null,
    hPredW: hPredW !== null ? Math.round(hPredW * 10) / 10 : null,
    hMid: hMid !== null ? Math.round(hMid * 10) / 10 : null,
    hParentEst: hParentEst !== null ? Math.round(hParentEst * 10) / 10 : null,
    hPredP: hPredP !== null ? Math.round(hPredP * 10) / 10 : null,
    hPredPW: hPredPW !== null ? Math.round(hPredPW * 10) / 10 : null,
    rmseP: hPredP !== null ? Math.round(rmseP * 100) / 100 : null,
    menarcheHeightUsed: menarcheHeightUsed !== null ? Math.round(menarcheHeightUsed * 10) / 10 : null,
    hMenarcheEst: hMenarcheEst !== null ? Math.round(hMenarcheEst * 10) / 10 : null,
    hPredM: hPredM !== null ? Math.round(hPredM * 10) / 10 : null,
    rmseM: rmseM !== null ? Math.round(rmseM * 100) / 100 : null,
    finalHeight,
    finalHeightLabel,
    finalRmse,
    ci68,
    ci95,
  };
}
