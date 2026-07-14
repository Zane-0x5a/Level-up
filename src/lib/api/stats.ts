import { supabase } from '../supabase.ts'
import { getLocalDateString } from '../local-date.ts'

type WeeklyFocusClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        gte: (column: string, value: string) => {
          lte: (
            column: string,
            value: string
          ) => Promise<{
            data: Array<{ duration: number | null }> | null
            error: unknown
          }>
        }
      }
    }
  }
}

export function getLocalWeekRange(date = new Date()) {
  const today = new Date(date)
  today.setHours(0, 0, 0, 0)

  const mondayOffset = (today.getDay() + 6) % 7
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - mondayOffset)

  return {
    startDate: getLocalDateString(weekStart),
    endDate: getLocalDateString(today),
  }
}

export async function getStreak(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('daily_records')
    .select('date')
    .eq('user_id', userId)
    .order('date', { ascending: false })
  if (error || !data?.length) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Start from the most recent record date instead of requiring today
  const latestDate = new Date(data[0].date + 'T00:00:00')
  const diffDays = Math.round((today.getTime() - latestDate.getTime()) / 86400000)

  // If the latest record is more than 1 day ago, streak is broken
  if (diffDays > 1) return 0

  let streak = 0
  for (let i = 0; i < data.length; i++) {
    const expected = new Date(latestDate)
    expected.setDate(expected.getDate() - i)
    const recordDate = new Date(data[i].date + 'T00:00:00')
    if (recordDate.getTime() === expected.getTime()) {
      streak++
    } else {
      break
    }
  }
  return streak
}

export async function getTotalFocusHours(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('focus_sessions')
    .select('duration')
    .eq('user_id', userId)
  if (error || !data) return 0
  return data.reduce((sum, r) => sum + (r.duration ?? 0), 0)
}

export async function getWeeklyFocusHours(userId: string): Promise<number> {
  return getWeeklyFocusHoursWithClient(
    supabase as unknown as WeeklyFocusClient,
    userId
  )
}

export async function getWeeklyFocusHoursWithClient(
  client: WeeklyFocusClient,
  userId: string,
  date = new Date()
): Promise<number> {
  const { startDate, endDate } = getLocalWeekRange(date)

  const { data, error } = await client
    .from('focus_sessions')
    .select('duration')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
  if (error || !data) {
    console.error('Failed to load weekly focus hours', error)
    return 0
  }
  return data.reduce((sum, r) => sum + (r.duration ?? 0), 0)
}

export async function getTotalReturnCount(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('daily_records')
    .select('return_count')
    .eq('user_id', userId)
  if (error || !data) return 0
  return data.reduce((sum, r) => sum + (r.return_count ?? 0), 0)
}
