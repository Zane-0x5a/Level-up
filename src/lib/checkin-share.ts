export type CheckinShareSession = {
  duration?: number | null
}

export function getCheckinFocusMinutes(
  sessions: CheckinShareSession[]
): number {
  return Math.round(
    sessions.reduce((sum, session) => sum + (session.duration ?? 0), 0) * 60
  )
}

export function formatCheckinFocusMinutes(minutes: number): string {
  const safeMinutes = Math.max(0, Math.round(minutes))
  const hours = Math.floor(safeMinutes / 60)
  const remainingMinutes = safeMinutes % 60

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours}h ${remainingMinutes}m`
  }

  if (hours > 0) {
    return `${hours}h`
  }

  return `${remainingMinutes}m`
}

export function getCheckinDayLabel(dayType?: string): string {
  return dayType === 'rest_day' ? '休息日' : '学习日'
}
