export type Gender = 'boy' | 'girl';
export type MenarcheStatus = 'pre' | 'post' | 'none';

export interface Coefficients {
  alpha: number;
  beta: number;
  gamma: number;
  c: number;
  residualSD: number;
}

const boyData: Record<string, Coefficients> = {
  '<8.0': { alpha: 1.2, beta: -7.3, gamma: 0, c: 82, residualSD: 4 },
  '8.0': { alpha: 1.22, beta: -7.2, gamma: -0.4, c: 82, residualSD: 3.6 },
  '8.5': { alpha: 1.23, beta: -7, gamma: -0.7, c: 82, residualSD: 3.6 },
  '9.0': { alpha: 1.22, beta: -6.8, gamma: -0.8, c: 82, residualSD: 3.6 },
  '9.5': { alpha: 1.21, beta: -6.5, gamma: -0.8, c: 82, residualSD: 3.6 },
  '10.0': { alpha: 1.2, beta: -6.2, gamma: -1, c: 83, residualSD: 3.6 },
  '10.5': { alpha: 1.19, beta: -5.9, gamma: -1.2, c: 84, residualSD: 3.6 },
  '11.0': { alpha: 1.16, beta: -5.5, gamma: -1.6, c: 89, residualSD: 3.5 },
  '11.5': { alpha: 1.13, beta: -5.1, gamma: -2, c: 94, residualSD: 3.5 },
  '12.0': { alpha: 1.08, beta: -4.2, gamma: -2.6, c: 98, residualSD: 3.5 },
  '12.5': { alpha: 1.03, beta: -3.4, gamma: -3.2, c: 103, residualSD: 3.5 },
  '13.0': { alpha: 0.98, beta: -2.6, gamma: -3.8, c: 108, residualSD: 3.1 },
  '13.5': { alpha: 0.94, beta: -1.9, gamma: -4.4, c: 113, residualSD: 3.1 },
  '14.0': { alpha: 0.9, beta: -1.4, gamma: -4.5, c: 114, residualSD: 2.9 },
  '14.5': { alpha: 0.87, beta: -1, gamma: -4.6, c: 114, residualSD: 2.9 },
  '15.0': { alpha: 0.84, beta: -0.8, gamma: -3.8, c: 104, residualSD: 2.5 },
  '15.5': { alpha: 0.82, beta: -0.6, gamma: -3.1, c: 94, residualSD: 2.5 },
  '16.0': { alpha: 0.88, beta: -0.4, gamma: -2.4, c: 71, residualSD: 2 },
  '16.5': { alpha: 0.94, beta: -0.3, gamma: -1.8, c: 48, residualSD: 2 },
  '17.0': { alpha: 0.96, beta: -0.2, gamma: -1.2, c: 34, residualSD: 0.8 },
  '17.5': { alpha: 0.98, beta: -0.1, gamma: -0.7, c: 19, residualSD: 0.8 },
};

const girlDataPre: Record<string, Coefficients> = {
  '<6.0': { alpha: 0.95, beta: -6.5, gamma: 0, c: 93, residualSD: 3.5 },
  '6.0': { alpha: 0.95, beta: -6, gamma: -0.4, c: 93, residualSD: 3 },
  '6.5': { alpha: 0.95, beta: -5.5, gamma: -0.8, c: 93, residualSD: 3 },
  '7.0': { alpha: 0.94, beta: -5.1, gamma: -1, c: 94, residualSD: 3.2 },
  '7.5': { alpha: 0.93, beta: -4.7, gamma: -1.1, c: 94, residualSD: 3.2 },
  '8.0': { alpha: 0.92, beta: -4.4, gamma: -1.5, c: 95, residualSD: 2.9 },
  '8.5': { alpha: 0.92, beta: -4, gamma: -1.9, c: 96, residualSD: 2.9 },
  '9.0': { alpha: 0.92, beta: -3.8, gamma: -2.3, c: 99, residualSD: 2.8 },
  '9.5': { alpha: 0.91, beta: -3.6, gamma: -2.7, c: 102, residualSD: 2.8 },
  '10.0': { alpha: 0.89, beta: -3.2, gamma: -3.2, c: 106, residualSD: 2.9 },
  '10.5': { alpha: 0.87, beta: -2.7, gamma: -3.6, c: 109, residualSD: 2.9 },
  '11.0': { alpha: 0.83, beta: -2.6, gamma: -3.6, c: 114, residualSD: 2.9 },
  '11.5': { alpha: 0.82, beta: -2.5, gamma: -3.6, c: 115, residualSD: 2.9 },
  '12.0': { alpha: 0.83, beta: -2.4, gamma: -3.4, c: 111, residualSD: 2.7 },
  '12.5': { alpha: 0.83, beta: -2.3, gamma: -3.3, c: 108, residualSD: 2.7 },
  '13.0': { alpha: 0.85, beta: -2, gamma: -3.1, c: 98, residualSD: 2.2 },
  '13.5': { alpha: 0.87, beta: -1.8, gamma: -3, c: 90, residualSD: 2.2 },
  '14.0': { alpha: 0.91, beta: -1.6, gamma: -2.8, c: 79, residualSD: 1.2 },
  '14.5': { alpha: 0.95, beta: -1.4, gamma: -2.5, c: 67, residualSD: 1.2 },
};

const girlDataPost: Record<string, Coefficients> = {
  '11.0': { alpha: 0.87, beta: -2.3, gamma: -3.3, c: 100, residualSD: 2.6 },
  '11.5': { alpha: 0.89, beta: -1.9, gamma: -3.3, c: 91, residualSD: 2.6 },
  '12.0': { alpha: 0.91, beta: -1.4, gamma: -3.2, c: 82, residualSD: 2.1 },
  '12.5': { alpha: 0.93, beta: -1, gamma: -2.7, c: 67, residualSD: 2.1 },
  '13.0': { alpha: 0.95, beta: -0.9, gamma: -2.2, c: 55, residualSD: 1.6 },
  '13.5': { alpha: 0.96, beta: -0.9, gamma: -1.8, c: 48, residualSD: 1.6 },
  '14.0': { alpha: 0.96, beta: -0.8, gamma: -1.4, c: 40, residualSD: 1.2 },
  '14.5': { alpha: 0.97, beta: -0.8, gamma: -1.3, c: 37, residualSD: 1.2 },
};

const girlDataAll: Record<string, Coefficients> = {
  '15.0': { alpha: 0.98, beta: -0.6, gamma: -1.1, c: 30, residualSD: 0.8 },
  '15.5': { alpha: 0.99, beta: -0.4, gamma: -0.7, c: 20, residualSD: 0.8 },
};

export function getCoefficients(
  gender: Gender,
  chronologicalAge: number,
  menarcheStatus: MenarcheStatus = 'none'
): Coefficients | null {
  const roundedAge = Math.floor(chronologicalAge * 2) / 2;
  const ageKey = roundedAge.toFixed(1);

  if (gender === 'boy') {
    if (chronologicalAge < 8.0) return boyData['<8.0'];
    return boyData[ageKey] || null;
  } else {
    if (chronologicalAge < 6.0) return girlDataPre['<6.0'];
    if (chronologicalAge >= 15.0) return girlDataAll[ageKey] || null;

    if (menarcheStatus === 'post' && chronologicalAge >= 11.0) {
      return girlDataPost[ageKey] || null;
    } else {
      return girlDataPre[ageKey] || null;
    }
  }
}

export function calculatePAH(
  coeffs: Coefficients,
  currentHeight: number,
  chronologicalAge: number,
  boneAge: number
): { pah: number; error: number } {
  const { alpha, beta, gamma, c, residualSD } = coeffs;
  const pah = alpha * currentHeight + beta * chronologicalAge + gamma * boneAge + c;
  return {
    pah: Math.round(pah * 10) / 10,
    error: Math.round(residualSD * 2 * 10) / 10,
  };
}

export function calculateMPH(gender: Gender, fatherHeight: number | null, motherHeight: number | null): number | null {
  if (fatherHeight !== null && motherHeight !== null) {
    if (gender === 'boy') {
      return Math.round(((fatherHeight + motherHeight + 13) / 2) * 10) / 10;
    } else {
      return Math.round(((fatherHeight + motherHeight - 13) / 2) * 10) / 10;
    }
  } else if (fatherHeight === null && motherHeight !== null) {
    if (gender === 'boy') {
      return Math.round((99.9 + 0.492 * motherHeight) * 10) / 10;
    } else {
      return Math.round((96.3 + 0.436 * motherHeight) * 10) / 10;
    }
  }
  return null;
}
