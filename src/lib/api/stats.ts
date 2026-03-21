import { supabase } from '@/lib/supabase'

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
  const now = new Date()
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekStr = weekAgo.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('focus_sessions')
    .select('duration')
    .eq('user_id', userId)
    .gte('date', weekStr)
  if (error || !data) return 0
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
