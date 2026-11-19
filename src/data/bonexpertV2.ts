export type BxPopulationMode = 'vietnam' | 'caucasian' | 'custom';

export interface PopulationSpec {
  male: number;
  female: number;
  name: string;
  shortName: string;
}

export const POPULATION_PRESETS: Record<'caucasian' | 'vietnam', PopulationSpec> = {
  caucasian: {
    male: 178.0,
    female: 165.0,
    name: 'Caucasian European (Zurich)',
    shortName: 'Chuẩn Châu Âu - Zurich',
  },
  vietnam: {
    male: 168.1,
    female: 156.2,
    name: 'Việt Nam (NIN FH VN 2020)',
    shortName: 'NIN FH VN 2020',
  },
};

export const BOY_GP_BASELINE: Record<number, number> = {
  5: 38.0,
  6: 34.0,
  7: 30.5,
  8: 27.2,
  9: 24.395,
  10: 21.2,
  11: 18.2,
  12: 15.5,
  13: 12.490,
  14: 7.2,
  15: 3.2,
  16: 1.4,
  17: 0.5,
  18: 0.1,
};

export const GIRL_GP_BASELINE: Record<number, number> = {
  5: 36.0,
  6: 31.5,
  7: 27.5,
  8: 23.5,
  9: 19.5,
  10: 15.0,
  11: 10.8,
  12: 6.8,
  13: 3.5,
  14: 1.8,
  15: 0.8,
  16: 0.3,
  17: 0.1,
  18: 0.05,
};

export interface BoyBayesianRow {
  w_pop: number;
  w_p: number;
  rmse: number;
  rmse_p: number;
  // Hệ số điều chỉnh theo BMI dựa trên V3 (chỉ dùng để hiển thị tham khảo, không cộng vào kết quả dự đoán V4)
  delta_h: number;
  bmi_mean: number;
  bmi_sd: number;
}

export interface GirlBayesianRow {
  w_pop: number;
  w_p: number;
  rmse: number;
  rmse_p: number;
}

export const BOY_BAYESIAN: Record<number, BoyBayesianRow> = {
  5: { w_pop: 0.16, w_p: 0.27, rmse: 4.0, rmse_p: 3.5, delta_h: -0.7, bmi_mean: 15.2, bmi_sd: 1.2 },
  6: { w_pop: 0.15, w_p: 0.25, rmse: 4.0, rmse_p: 3.7, delta_h: -1.0, bmi_mean: 15.3, bmi_sd: 1.2 },
  7: { w_pop: 0.15, w_p: 0.25, rmse: 3.9, rmse_p: 3.6, delta_h: -1.5, bmi_mean: 15.3, bmi_sd: 1.1 },
  8: { w_pop: 0.12, w_p: 0.21, rmse: 3.5, rmse_p: 3.3, delta_h: -1.6, bmi_mean: 15.4, bmi_sd: 1.3 },
  9: { w_pop: 0.12, w_p: 0.20, rmse: 3.5, rmse_p: 3.3, delta_h: -1.7, bmi_mean: 15.8, bmi_sd: 1.4 },
  10: { w_pop: 0.13, w_p: 0.22, rmse: 3.6, rmse_p: 3.3, delta_h: -1.5, bmi_mean: 16.1, bmi_sd: 1.5 },
  11: { w_pop: 0.12, w_p: 0.21, rmse: 3.5, rmse_p: 3.2, delta_h: -1.3, bmi_mean: 16.7, bmi_sd: 1.8 },
  12: { w_pop: 0.11, w_p: 0.20, rmse: 3.5, rmse_p: 3.3, delta_h: -1.3, bmi_mean: 16.8, bmi_sd: 1.8 },
  13: { w_pop: 0.13, w_p: 0.23, rmse: 3.8, rmse_p: 3.6, delta_h: -1.1, bmi_mean: 17.7, bmi_sd: 2.1 },
  14: { w_pop: 0.11, w_p: 0.19, rmse: 3.4, rmse_p: 3.2, delta_h: -0.9, bmi_mean: 18.7, bmi_sd: 1.7 },
  15: { w_pop: 0.04, w_p: 0.07, rmse: 1.9, rmse_p: 1.9, delta_h: -0.5, bmi_mean: 19.2, bmi_sd: 1.8 },
  16: { w_pop: 0.01, w_p: 0.03, rmse: 1.2, rmse_p: 1.2, delta_h: -0.3, bmi_mean: 19.9, bmi_sd: 1.9 },
  17: { w_pop: 0.01, w_p: 0.01, rmse: 0.9, rmse_p: 0.9, delta_h: -0.3, bmi_mean: 20.7, bmi_sd: 2.1 },
  18: { w_pop: 0.00, w_p: 0.01, rmse: 0.6, rmse_p: 0.6, delta_h: -0.2, bmi_mean: 21.1, bmi_sd: 2.4 },
};

export const GIRL_BAYESIAN: Record<number, GirlBayesianRow> = {
  5: { w_pop: 0.18, w_p: 0.36, rmse: 3.8, rmse_p: 3.4 },
  6: { w_pop: 0.15, w_p: 0.32, rmse: 3.5, rmse_p: 3.2 },
  7: { w_pop: 0.15, w_p: 0.30, rmse: 3.3, rmse_p: 3.0 },
  8: { w_pop: 0.12, w_p: 0.27, rmse: 3.0, rmse_p: 2.8 },
  9: { w_pop: 0.11, w_p: 0.24, rmse: 2.9, rmse_p: 2.7 },
  10: { w_pop: 0.11, w_p: 0.23, rmse: 2.8, rmse_p: 2.6 },
  11: { w_pop: 0.11, w_p: 0.25, rmse: 2.9, rmse_p: 2.8 },
  12: { w_pop: 0.12, w_p: 0.26, rmse: 2.9, rmse_p: 2.8 },
  13: { w_pop: 0.04, w_p: 0.10, rmse: 1.7, rmse_p: 1.6 },
  14: { w_pop: 0.01, w_p: 0.03, rmse: 0.9, rmse_p: 0.9 },
  15: { w_pop: 0.01, w_p: 0.02, rmse: 0.7, rmse_p: 0.7 },
  16: { w_pop: 0.00, w_p: 0.01, rmse: 0.6, rmse_p: 0.5 },
  17: { w_pop: 0.00, w_p: 0.01, rmse: 0.4, rmse_p: 0.4 },
  18: { w_pop: 0.00, w_p: 0.00, rmse: 0.3, rmse_p: 0.3 },
};

export function validateCustomPopulation(male: number, female: number): string | null {
  if (isNaN(male) || isNaN(female)) {
    return 'Vui lòng nhập chiều cao trung bình Nam và Nữ hợp lệ.';
  }
  if (male < 150 || male > 195) {
    return 'Biên sinh học Nam trưởng thành hợp lệ: 150 ≤ H_pop_male ≤ 195 cm.';
  }
  if (female < 140 || female > 185) {
    return 'Biên sinh học Nữ trưởng thành hợp lệ: 140 ≤ H_pop_female ≤ 185 cm.';
  }
  if (male <= female) {
    return 'Chiều cao trung bình Nam (H_pop_male) phải lớn hơn Nữ (H_pop_female).';
  }
  return null;
}

export function interpolateBayesianTable<T extends object>(
  table: Record<number, T>,
  ba: number
): T {
  const baC = Math.max(5.0, Math.min(18.0, ba));
  const low = Math.floor(baC);
  const high = Math.ceil(baC);
  if (low === high) {
    return { ...table[low] };
  }
  const w = baC - low;
  const lowRow = table[low] as Record<string, number>;
  const highRow = table[high] as Record<string, number>;
  const result: Record<string, number> = {};
  for (const k of Object.keys(lowRow)) {
    result[k] = (1.0 - w) * lowRow[k] + w * highRow[k];
  }
  return result as unknown as T;
}

/**
 * Tính Tiềm năng tăng trưởng còn lại gp (%) theo chuẩn Thodberg-Martin (2012)
 */
export function calculateGrowthPotentialV3(
  ba: number,
  ca: number,
  gender: string
): { gpPct: number; baseGpPct: number; sensitivity: number } {
  const isBoy = ['male', 'boy', 'nam'].includes(gender.toLowerCase());
  const table = isBoy ? BOY_GP_BASELINE : GIRL_GP_BASELINE;
  const baC = Math.max(5.0, Math.min(18.0, ba));
  const low = Math.floor(baC);
  const high = Math.ceil(baC);
  const base =
    low === high
      ? table[low]
      : (1.0 - (baC - low)) * table[low] + (baC - low) * table[high];
  const caDiff = ca - ba;

  const sens = isBoy
    ? 1.25 * Math.exp(-0.5 * Math.pow((ba - 11.0) / 4.5, 2))
    : 1.05 * Math.exp(-0.5 * Math.pow((ba - 10.2) / 3.8, 2));

  const gpPct = Math.max(0.01, Math.min(55.0, base - sens * caDiff));
  return { gpPct, baseGpPct: base, sensitivity: sens };
}

export interface BranchPrediction {
  height_cm: number;
  rmse_cm: number;
  ci_68: [number, number];
  ci_95: [number, number];
}

export interface BxV3PredictionParams {
  height: number;
  ca: number;
  ba: number;
  gender: 'boy' | 'girl' | 'male' | 'female';
  population?: BxPopulationMode;
  customPopMale?: number | null;
  customPopFemale?: number | null;
  fatherHeight?: number | null;
  motherHeight?: number | null;
  secularTrend?: number;
  bmi?: number | null;
  menarcheHeight?: number | null;
}

export interface BxV3PredictionResult {
  status: 'success';
  inputs: {
    height_cm: number;
    age_ca: number;
    bone_age_ba: number;
    gender: 'male' | 'female';
    population: string;
    population_short: string;
    population_mode: BxPopulationMode;
    h_pop: number;
    secular_trend_cm: number;
  };
  intermediate_metrics: {
    ba_delay_years: number;
    growth_potential_pct: number;
    sensitivity_s: number;
    h_raw_cm: number;
    midparent_height_cm: number | null;
    target_height_from_parents_hp_cm: number | null;
    w_pop: number;
    w_p: number;
    w_p_eff: number;
    is_severe_ba_deviation: boolean;
    is_golden_window: boolean;
    menarche_adjustment_applied: boolean;
    h_menarche_pred_cm: number | null;
  };
  // Hệ số điều chỉnh theo BMI dựa trên V3 (chỉ trả về để hiển thị mục riêng, KHÔNG cộng vào dữ liệu kết quả dự đoán chiều cao)
  bmi_v3_reference: {
    applicable: boolean;
    delta_h_coeff: number | null;
    bmi_mean_ref: number | null;
    bmi_sd_ref: number | null;
    bmi_value: number | null;
    bmi_sds: number | null;
    bmi_adjustment_cm: number | null;
  };
  predictions: {
    ahp_using_population_hpred: BranchPrediction;
    ahp_using_parents_hpredp: BranchPrediction | null;
    ahp_using_menarche_hpredm: BranchPrediction | null;
    // Các trường tương thích UI & báo cáo (KHÔNG cộng BMI)
    ahp_xray_cm: number;
    ahp_parental_cm: number | null;
    ahp_combined_cm: number | null;
    final_predicted_height_cm: number;
    rmse_cm: number;
    confidence_interval_68_pct: [number, number];
    confidence_interval_95_pct: [number, number];
  };
}

const roundTo = (val: number, decimals: number): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
};

export function predictAdultHeightBxV3(params: BxV3PredictionParams): BxV3PredictionResult | null {
  const {
    height,
    ca,
    ba,
    gender,
    population = 'vietnam',
    customPopMale = null,
    customPopFemale = null,
    fatherHeight = null,
    motherHeight = null,
    secularTrend = 1.0,
    bmi = null,
    menarcheHeight = null,
  } = params;

  if (!height || height <= 0 || isNaN(ca) || isNaN(ba) || ba <= 0) {
    return null;
  }

  const genderKey: 'male' | 'female' = ['female', 'girl', 'nu', 'nữ'].includes(gender.toLowerCase())
    ? 'female'
    : 'male';
  const popMode = population.toLowerCase().trim() as BxPopulationMode;

  // 1. Xác định Chiều cao Quần thể H_pop
  let hPop: number;
  let popDisplayName: string;
  let popShortName: string;

  if (['custom', 'tuychinh', 'tùy chỉnh'].includes(popMode)) {
    const maleVal = customPopMale && customPopMale > 0 ? Number(customPopMale) : 168.1;
    const femaleVal = customPopFemale && customPopFemale > 0 ? Number(customPopFemale) : 156.2;
    hPop = genderKey === 'female' ? femaleVal : maleVal;
    popDisplayName = `Tự định nghĩa (${maleVal.toFixed(1)} cm / ${femaleVal.toFixed(1)} cm)`;
    popShortName = `Quần thể Tùy chỉnh (${hPop} cm)`;
  } else if (popMode.includes('caucasian') || popMode.includes('zurich')) {
    hPop = POPULATION_PRESETS.caucasian[genderKey];
    popDisplayName = POPULATION_PRESETS.caucasian.name;
    popShortName = POPULATION_PRESETS.caucasian.shortName;
  } else {
    hPop = POPULATION_PRESETS.vietnam[genderKey];
    popDisplayName = POPULATION_PRESETS.vietnam.name;
    popShortName = POPULATION_PRESETS.vietnam.shortName;
  }

  // 2. Nhánh 1: Chiều cao X-quang thô H_raw
  const { gpPct, sensitivity } = calculateGrowthPotentialV3(ba, ca, genderKey);
  const hRaw = height / (1.0 - gpPct / 100.0);

  // 3. Tra cứu tham số Bayesian theo BA
  const bayesianParams =
    genderKey === 'male'
      ? interpolateBayesianTable(BOY_BAYESIAN, ba)
      : interpolateBayesianTable(GIRL_BAYESIAN, ba);

  const wPop = bayesianParams.w_pop;
  const wP = bayesianParams.w_p;
  const rmseX = bayesianParams.rmse;
  const rmseP = bayesianParams.rmse_p;

  // 4. Nhánh 2: Dự đoán Quần thể H_pred (Hình 8 & 16)
  const hPred = (1.0 - wPop) * hRaw + wPop * hPop;
  const branchPop: BranchPrediction = {
    height_cm: roundTo(hPred, 1),
    rmse_cm: roundTo(rmseX, 1),
    ci_68: [roundTo(hPred - rmseX, 1), roundTo(hPred + rmseX, 1)],
    ci_95: [roundTo(hPred - 1.96 * rmseX, 1), roundTo(hPred + 1.96 * rmseX, 1)],
  };

  // 5. Nhánh 3: Dự đoán Di truyền Bố Mẹ H_predP (Hình 8 & 16)
  let hMid: number | null = null;
  let hP: number | null = null;
  let hPredP: number | null = null;
  let branchParents: BranchPrediction | null = null;
  const isSevereBaDeviation = Math.abs(ba - ca) > 2.0;
  const wPEff = isSevereBaDeviation ? 0.039 : wP;

  if (
    fatherHeight !== null &&
    motherHeight !== null &&
    fatherHeight > 0 &&
    motherHeight > 0
  ) {
    hMid = (fatherHeight + motherHeight) / 2.0;
    const { a, b, hPop1zls } =
      genderKey === 'male'
        ? { a: 0.7884, b: 42.2, hPop1zls: 178.2 }
        : { a: 0.7186, b: 40.3, hPop1zls: 165.0 };

    hP = a * hMid + b + secularTrend + (1.0 - a) * (hPop - hPop1zls);
    hPredP = isSevereBaDeviation
      ? (1.0 - wPEff) * hPred + wPEff * hP
      : (1.0 - wPEff) * hRaw + wPEff * hP;

    branchParents = {
      height_cm: roundTo(hPredP, 1),
      rmse_cm: roundTo(rmseP, 1),
      ci_68: [roundTo(hPredP - rmseP, 1), roundTo(hPredP + rmseP, 1)],
      ci_95: [roundTo(hPredP - 1.96 * rmseP, 1), roundTo(hPredP + 1.96 * rmseP, 1)],
    };
  }

  // 6. Nhánh 4: Dự đoán Mốc Kinh nguyệt Menarche H_predM (Hình 8 & 16)
  let menarcheApplied = false;
  let hMenTarget: number | null = null;
  let hPredM: number | null = null;
  let rmseM: number | null = null;
  let branchMenarche: BranchPrediction | null = null;

  if (genderKey === 'female' && menarcheHeight !== null && menarcheHeight > 0) {
    menarcheApplied = true;
    hMenTarget = menarcheHeight + 6.6;
    const pBase = 1.0 / (rmseX * rmseX);
    const pMen = 1.0 / (2.2 * 2.2);
    const wMen = pMen / (pBase + pMen);
    hPredM = (1.0 - wMen) * hPred + wMen * hMenTarget;
    rmseM = 1.0 / Math.sqrt(pBase + pMen);

    branchMenarche = {
      height_cm: roundTo(hPredM, 1),
      rmse_cm: roundTo(rmseM, 1),
      ci_68: [roundTo(hPredM - rmseM, 1), roundTo(hPredM + rmseM, 1)],
      ci_95: [roundTo(hPredM - 1.96 * rmseM, 1), roundTo(hPredM + 1.96 * rmseM, 1)],
    };
  }

  // 7. Tính mục Hệ số điều chỉnh theo BMI dựa trên V3 (chỉ tham khảo, KHÔNG cộng vào kết quả trả về)
  const bmiApplicable = genderKey === 'male' && ba < 16.0;
  let deltaHCoeff: number | null = null;
  let bmiMeanRef: number | null = null;
  let bmiSdRef: number | null = null;
  let bmiSdsClamped: number | null = null;
  let bmiCorrCm: number | null = null;

  if (genderKey === 'male') {
    const boyParams = bayesianParams as BoyBayesianRow;
    deltaHCoeff = roundTo(boyParams.delta_h, 2);
    bmiMeanRef = roundTo(boyParams.bmi_mean, 2);
    bmiSdRef = roundTo(boyParams.bmi_sd, 2);
    if (bmiApplicable && bmi !== null && bmi > 0) {
      const rawSds = (bmi - boyParams.bmi_mean) / boyParams.bmi_sd;
      bmiSdsClamped = roundTo(Math.max(-2.0, Math.min(2.0, rawSds)), 2);
      bmiCorrCm = roundTo(boyParams.delta_h * bmiSdsClamped, 2);
    }
  }

  // 8. Chọn nhánh kết quả chính thức theo chuẩn V4 (KHÔNG cộng BMI)
  const activeBranch: BranchPrediction =
    branchMenarche !== null
      ? branchMenarche
      : branchParents !== null
      ? branchParents
      : branchPop;

  const isGoldenWindow = genderKey === 'male' ? ba < 12.0 : ba < 10.5;

  return {
    status: 'success',
    inputs: {
      height_cm: height,
      age_ca: roundTo(ca, 2),
      bone_age_ba: roundTo(ba, 2),
      gender: genderKey,
      population: popDisplayName,
      population_short: popShortName,
      population_mode: popMode,
      h_pop: hPop,
      secular_trend_cm: secularTrend,
    },
    intermediate_metrics: {
      ba_delay_years: roundTo(ca - ba, 2),
      growth_potential_pct: roundTo(gpPct, 2),
      sensitivity_s: roundTo(sensitivity, 3),
      h_raw_cm: roundTo(hRaw, 1),
      midparent_height_cm: hMid !== null ? roundTo(hMid, 1) : null,
      target_height_from_parents_hp_cm: hP !== null ? roundTo(hP, 1) : null,
      w_pop: roundTo(wPop, 3),
      w_p: roundTo(wP, 3),
      w_p_eff: roundTo(wPEff, 3),
      is_severe_ba_deviation: isSevereBaDeviation,
      is_golden_window: isGoldenWindow,
      menarche_adjustment_applied: menarcheApplied,
      h_menarche_pred_cm: hMenTarget !== null ? roundTo(hMenTarget, 1) : null,
    },
    bmi_v3_reference: {
      applicable: bmiApplicable,
      delta_h_coeff: deltaHCoeff,
      bmi_mean_ref: bmiMeanRef,
      bmi_sd_ref: bmiSdRef,
      bmi_value: bmi !== null && bmi > 0 ? roundTo(bmi, 2) : null,
      bmi_sds: bmiSdsClamped,
      bmi_adjustment_cm: bmiCorrCm,
    },
    predictions: {
      ahp_using_population_hpred: branchPop,
      ahp_using_parents_hpredp: branchParents,
      ahp_using_menarche_hpredm: branchMenarche,
      ahp_xray_cm: branchPop.height_cm,
      ahp_parental_cm: hP !== null ? roundTo(hP, 1) : null,
      ahp_combined_cm: branchParents !== null ? branchParents.height_cm : null,
      final_predicted_height_cm: activeBranch.height_cm,
      rmse_cm: activeBranch.rmse_cm,
      confidence_interval_68_pct: activeBranch.ci_68,
      confidence_interval_95_pct: activeBranch.ci_95,
    },
  };
}
