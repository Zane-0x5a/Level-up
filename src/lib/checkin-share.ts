export type CheckinShareSession = {
  duration?: number | null
}

export type CheckinCardData = {
  date?: string
  day_type?: 'study_day' | 'rest_day'
  focus_minutes?: number
  note_snippet?: string
}

export function parseCheckinCardData(value: unknown): CheckinCardData | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const candidate = value as Record<string, unknown>

  if (
    candidate.date !== undefined &&
    (typeof candidate.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(candidate.date))
  ) {
    return null
  }
  if (
    candidate.day_type !== undefined &&
    candidate.day_type !== 'study_day' &&
    candidate.day_type !== 'rest_day'
  ) {
    return null
  }
  if (
    candidate.focus_minutes !== undefined &&
    (typeof candidate.focus_minutes !== 'number' ||
      !Number.isFinite(candidate.focus_minutes) ||
      candidate.focus_minutes < 0)
  ) {
    return null
  }
  if (
    candidate.note_snippet !== undefined &&
    (typeof candidate.note_snippet !== 'string' || candidate.note_snippet.length > 200)
  ) {
    return null
  }

  return {
    date: candidate.date as string | undefined,
    day_type: candidate.day_type as 'study_day' | 'rest_day' | undefined,
    focus_minutes: candidate.focus_minutes as number | undefined,
    note_snippet: candidate.note_snippet as string | undefined,
  }
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
