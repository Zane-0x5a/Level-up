export const MAX_FOCUS_SESSION_HOURS = 8

export function isValidFocusDuration(durationHours: number): boolean {
  return (
    Number.isFinite(durationHours) &&
    durationHours > 0 &&
    durationHours <= MAX_FOCUS_SESSION_HOURS
  )
}

export function assertValidFocusDuration(durationHours: number): void {
  if (!isValidFocusDuration(durationHours)) {
    throw new RangeError(
      `Focus duration must be greater than 0 and at most ${MAX_FOCUS_SESSION_HOURS} hours.`
    )
  }
}
