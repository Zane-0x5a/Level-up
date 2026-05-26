const QUANTILE_FALLBACK_THRESHOLD = 30
const LOG_FALLBACK_BASE = Math.log(13)

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
    return intensityFromUnitInterval(Math.log(1 + value) / LOG_FALLBACK_BASE)
  }

  return intensityFromUnitInterval(quantileRank(sortedDistribution, value))
}

export function shouldUseLogFallback(distributionSize: number): boolean {
  return distributionSize < QUANTILE_FALLBACK_THRESHOLD
}
