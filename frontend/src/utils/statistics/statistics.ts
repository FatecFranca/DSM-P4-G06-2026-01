export type RegressionResult = {
  slope: number;
  intercept: number;
  next: number;
  r2: number;
};

export type InferenceResult = {
  sampleSize: number;
  mean: number;
  marginOfError95: number;
  confidenceLow: number;
  confidenceHigh: number;
};

export function cleanNumbers(values: Array<number | null | undefined>) {
  return values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
}

export function mean(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

export function mode(values: number[]) {
  if (values.length === 0) return null;
  const counts = new Map<number, number>();
  values.forEach((value) => {
    const normalized = Number(value.toFixed(2));
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  });

  let bestValue = values[0];
  let bestCount = 0;
  counts.forEach((count, value) => {
    if (count > bestCount) {
      bestValue = value;
      bestCount = count;
    }
  });

  return bestCount > 1 ? bestValue : null;
}

export function standardDeviation(values: number[]) {
  if (values.length < 2) return null;
  const avg = mean(values);
  if (avg === null) return null;
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function skewness(values: number[]) {
  if (values.length < 3) return null;
  const avg = mean(values);
  const sd = standardDeviation(values);
  if (avg === null || !sd) return null;
  return values.reduce((sum, value) => sum + ((value - avg) / sd) ** 3, 0) / values.length;
}

export function kurtosis(values: number[]) {
  if (values.length < 4) return null;
  const avg = mean(values);
  const sd = standardDeviation(values);
  if (avg === null || !sd) return null;
  return values.reduce((sum, value) => sum + ((value - avg) / sd) ** 4, 0) / values.length - 3;
}

export function probabilityWithinRange(values: number[], min: number, max: number) {
  if (values.length === 0) return null;
  const hits = values.filter((value) => value >= min && value <= max).length;
  return hits / values.length;
}

export function linearRegression(values: number[]): RegressionResult | null {
  if (values.length < 2) return null;
  const xs = values.map((_, index) => index + 1);
  const avgX = mean(xs);
  const avgY = mean(values);
  if (avgX === null || avgY === null) return null;

  const numerator = xs.reduce((sum, x, index) => sum + (x - avgX) * (values[index] - avgY), 0);
  const denominator = xs.reduce((sum, x) => sum + (x - avgX) ** 2, 0);
  if (denominator === 0) return null;

  const slope = numerator / denominator;
  const intercept = avgY - slope * avgX;
  const predictions = xs.map((x) => intercept + slope * x);
  const total = values.reduce((sum, value) => sum + (value - avgY) ** 2, 0);
  const residual = values.reduce((sum, value, index) => sum + (value - predictions[index]) ** 2, 0);

  return {
    slope,
    intercept,
    next: intercept + slope * (values.length + 1),
    r2: total === 0 ? 1 : 1 - residual / total,
  };
}

export function inferMean95(values: number[]): InferenceResult | null {
  if (values.length < 2) return null;
  const avg = mean(values);
  const sd = standardDeviation(values);
  if (avg === null || sd === null) return null;
  const marginOfError95 = 1.96 * (sd / Math.sqrt(values.length));

  return {
    sampleSize: values.length,
    mean: avg,
    marginOfError95,
    confidenceLow: avg - marginOfError95,
    confidenceHigh: avg + marginOfError95,
  };
}
