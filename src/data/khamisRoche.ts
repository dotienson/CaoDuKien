export type KRCoefficient = {
  age: number;
  b0: number;
  b1: number;
  b2: number;
  b3: number;
};

export const krCoeffMale: KRCoefficient[] = [
  { age: 4.0, b0: -10.2567, b1: 1.23812, b2: -0.087235, b3: 0.50286 },
  { age: 4.5, b0: -10.7190, b1: 1.15964, b2: -0.074454, b3: 0.52887 },
  { age: 5.0, b0: -11.0213, b1: 1.10674, b2: -0.064778, b3: 0.53919 },
  { age: 5.5, b0: -11.1556, b1: 1.07480, b2: -0.057760, b3: 0.53691 },
  { age: 6.0, b0: -11.1138, b1: 1.05923, b2: -0.052947, b3: 0.52513 },
  { age: 6.5, b0: -11.0221, b1: 1.05542, b2: -0.049892, b3: 0.50692 },
  { age: 7.0, b0: -10.9984, b1: 1.05877, b2: -0.048144, b3: 0.48538 },
  { age: 7.5, b0: -11.0214, b1: 1.06467, b2: -0.047256, b3: 0.46361 },
  { age: 8.0, b0: -11.0696, b1: 1.06853, b2: -0.046778, b3: 0.44469 },
  { age: 8.5, b0: -11.1220, b1: 1.06572, b2: -0.046261, b3: 0.43171 },
  { age: 9.0, b0: -11.1571, b1: 1.05166, b2: -0.045254, b3: 0.42776 },
  { age: 9.5, b0: -11.1405, b1: 1.02174, b2: -0.043311, b3: 0.43593 },
  { age: 10.0, b0: -11.0380, b1: 0.97135, b2: -0.039981, b3: 0.45932 },
  { age: 10.5, b0: -10.8286, b1: 0.89589, b2: -0.034814, b3: 0.50101 },
  { age: 11.0, b0: -10.4917, b1: 0.81239, b2: -0.029050, b3: 0.54781 },
  { age: 11.5, b0: -10.0065, b1: 0.74134, b2: -0.024167, b3: 0.58409 },
  { age: 12.0, b0: -9.3522, b1: 0.68325, b2: -0.020076, b3: 0.60927 },
  { age: 12.5, b0: -8.6055, b1: 0.63869, b2: -0.016681, b3: 0.62279 },
  { age: 13.0, b0: -7.8632, b1: 0.60818, b2: -0.013895, b3: 0.62407 },
  { age: 13.5, b0: -7.1348, b1: 0.59228, b2: -0.011624, b3: 0.61253 },
  { age: 14.0, b0: -6.4299, b1: 0.59151, b2: -0.009776, b3: 0.58762 },
  { age: 14.5, b0: -5.7578, b1: 0.60643, b2: -0.008261, b3: 0.54875 },
  { age: 15.0, b0: -5.1282, b1: 0.63757, b2: -0.006988, b3: 0.49536 },
  { age: 15.5, b0: -4.5092, b1: 0.68548, b2: -0.005863, b3: 0.42687 },
  { age: 16.0, b0: -3.9292, b1: 0.75069, b2: -0.004795, b3: 0.34271 },
  { age: 16.5, b0: -3.4873, b1: 0.83375, b2: -0.003695, b3: 0.24231 },
  { age: 17.0, b0: -3.2830, b1: 0.93520, b2: -0.002470, b3: 0.12510 },
  { age: 17.5, b0: -3.4156, b1: 1.05558, b2: -0.001027, b3: -0.00950 }
];

export const krCoeffFemale: KRCoefficient[] = [
  { age: 4.0, b0: -8.13250, b1: 1.24768, b2: -0.19435, b3: 0.44774 },
  { age: 4.5, b0: -6.47656, b1: 1.22177, b2: -0.18519, b3: 0.41381 },
  { age: 5.0, b0: -5.13583, b1: 1.19932, b2: -0.17530, b3: 0.38467 },
  { age: 5.5, b0: -4.13791, b1: 1.17880, b2: -0.16484, b3: 0.36039 },
  { age: 6.0, b0: -3.51039, b1: 1.15866, b2: -0.15400, b3: 0.34105 },
  { age: 6.5, b0: -3.14322, b1: 1.13737, b2: -0.14294, b3: 0.32672 },
  { age: 7.0, b0: -2.87645, b1: 1.11342, b2: -0.13184, b3: 0.31748 },
  { age: 7.5, b0: -2.66291, b1: 1.08525, b2: -0.12086, b3: 0.31340 },
  { age: 8.0, b0: -2.45559, b1: 1.05135, b2: -0.11019, b3: 0.31457 },
  { age: 8.5, b0: -2.20728, b1: 1.01018, b2: -0.09999, b3: 0.32105 },
  { age: 9.0, b0: -1.87098, b1: 0.96020, b2: -0.09044, b3: 0.33291 },
  { age: 9.5, b0: -1.06330, b1: 0.89989, b2: -0.08171, b3: 0.35025 },
  { age: 10.0, b0: 0.33468, b1: 0.82771, b2: -0.07397, b3: 0.37312 },
  { age: 10.5, b0: 1.97366, b1: 0.74213, b2: -0.06739, b3: 0.40161 },
  { age: 11.0, b0: 3.50436, b1: 0.67173, b2: -0.06136, b3: 0.42042 },
  { age: 11.5, b0: 4.57747, b1: 0.64150, b2: -0.05518, b3: 0.41686 },
  { age: 12.0, b0: 4.84365, b1: 0.64452, b2: -0.04894, b3: 0.39490 },
  { age: 12.5, b0: 4.27869, b1: 0.67386, b2: -0.04272, b3: 0.35850 },
  { age: 13.0, b0: 3.21417, b1: 0.72260, b2: -0.03661, b3: 0.31163 },
  { age: 13.5, b0: 1.83456, b1: 0.78383, b2: -0.03067, b3: 0.25826 },
  { age: 14.0, b0: 0.32425, b1: 0.85062, b2: -0.02500, b3: 0.20235 },
  { age: 14.5, b0: -1.13224, b1: 0.91605, b2: -0.01967, b3: 0.14787 },
  { age: 15.0, b0: -2.35055, b1: 0.97319, b2: -0.01477, b3: 0.09880 },
  { age: 15.5, b0: -3.10326, b1: 1.01514, b2: -0.01037, b3: 0.05909 },
  { age: 16.0, b0: -3.17885, b1: 1.03496, b2: -0.00655, b3: 0.03272 },
  { age: 16.5, b0: -2.41657, b1: 1.02573, b2: -0.00340, b3: 0.02364 },
  { age: 17.0, b0: -0.65579, b1: 0.98054, b2: -0.00100, b3: 0.03584 },
  { age: 17.5, b0: 2.26429, b1: 0.89246, b2: 0.00057, b3: 0.07327 }
];

export function calculateKhamisRoche(gender: 'boy' | 'girl', ageYears: number, currentHeightCm: number, currentWeightKg: number, fatherHeightCm: number, motherHeightCm: number) {
  if (ageYears < 4.0 || ageYears > 17.5) return null;
  const coeffTable = gender === 'boy' ? krCoeffMale : krCoeffFemale;
  
  // Find interpolation
  let coeff: KRCoefficient = { age: ageYears, b0: 0, b1: 0, b2: 0, b3: 0 };
  const exact = coeffTable.find(c => c.age === ageYears);
  if (exact) {
    coeff = exact;
  } else {
    const lower = coeffTable.slice().reverse().find(c => c.age <= ageYears);
    const upper = coeffTable.find(c => c.age > ageYears);
    if (!lower) coeff = upper!;
    else if (!upper) coeff = lower;
    else {
      const ratio = (ageYears - lower.age) / (upper.age - lower.age);
      coeff.b0 = lower.b0 + ratio * (upper.b0 - lower.b0);
      coeff.b1 = lower.b1 + ratio * (upper.b1 - lower.b1);
      coeff.b2 = lower.b2 + ratio * (upper.b2 - lower.b2);
      coeff.b3 = lower.b3 + ratio * (upper.b3 - lower.b3);
    }
  }
  
  const heightIn = currentHeightCm / 2.54;
  const weightLbs = currentWeightKg * 2.20462;
  const mphIn = ((fatherHeightCm + motherHeightCm) / 2) / 2.54;
  
  const pahIn = coeff.b0 + (coeff.b1 * heightIn) + (coeff.b2 * weightLbs) + (coeff.b3 * mphIn);
  const pahCm = pahIn * 2.54;
  
  const error = gender === 'boy' ? 5.6 : 4.3;
  return { pah: Math.round(pahCm * 10) / 10, error };
}
