const QUANTILE_FALLBACK_THRESHOLD = 30

export type Intensity = 0 | 1 | 2 | 3 | 4

export function quantileRank(sortedDistribution: readonly number[], value: number): number {
  const n = sortedDistribution.length
  if (n === 0) return 0

  let lowerIndex = 0
  let upperBound = n
  while (lowerIndex < upperBound) {
    const mid = (lowerIndex + upperBound) >>> 1
    if (sortedDistribution[mid] < value) lowerIndex = mid + 1
    else upperBound = mid
  }

  let upperIndex = 0
  upperBound = n
  while (upperIndex < upperBound) {
    const mid = (upperIndex + upperBound) >>> 1
    if (sortedDistribution[mid] <= value) upperIndex = mid + 1
    else upperBound = mid
  }

  return (lowerIndex + upperIndex) / 2 / n
}

function intensityFromUnitInterval(unit: number): Intensity {
  if (unit <= 0) return 0
  if (unit < 0.25) return 1
  if (unit < 0.5) return 2
  if (unit < 0.75) return 3
  return 4
}

export function mapToIntensity(
  value: number,
  sortedDistribution: readonly number[],
): Intensity {
  if (value <= 0) return 0

  if (sortedDistribution.length < QUANTILE_FALLBACK_THRESHOLD) {
    // Log fallback scaled against the actual max in the distribution rather
    // than a hardcoded constant — otherwise a single value (max=1) saturates
    // every non-zero cell to the same intensity, and a much larger max swamps
    // mid-range values into the lowest bucket.
    const max = sortedDistribution[sortedDistribution.length - 1] ?? value
    const denominator = Math.log(1 + max)
    if (denominator <= 0) return 4
    return intensityFromUnitInterval(Math.log(1 + value) / denominator)
  }

  return intensityFromUnitInterval(quantileRank(sortedDistribution, value))
}

export function shouldUseLogFallback(distributionSize: number): boolean {
  return distributionSize < QUANTILE_FALLBACK_THRESHOLD
}
