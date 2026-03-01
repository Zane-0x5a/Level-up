import { supabase } from '@/lib/supabase'
import { DEFAULT_USER_ID } from '@/lib/constants'

export async function getStreak(): Promise<number> {
  const { data, error } = await supabase
    .from('daily_records')
    .select('date')
    .eq('user_id', DEFAULT_USER_ID)
    .order('date', { ascending: false })
  if (error || !data?.length) return 0

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < data.length; i++) {
    const expected = new Date(today)
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

export async function getTotalFocusHours(): Promise<number> {
  const { data, error } = await supabase
    .from('focus_sessions')
    .select('duration')
    .eq('user_id', DEFAULT_USER_ID)
  if (error || !data) return 0
  return data.reduce((sum, r) => sum + (r.duration ?? 0), 0)
}

export async function getWeeklyFocusHours(): Promise<number> {
  const now = new Date()
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekStr = weekAgo.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('focus_sessions')
    .select('duration')
    .eq('user_id', DEFAULT_USER_ID)
    .gte('date', weekStr)
  if (error || !data) return 0
  return data.reduce((sum, r) => sum + (r.duration ?? 0), 0)
}

export async function getTotalReturnCount(): Promise<number> {
  const { data, error } = await supabase
    .from('daily_records')
    .select('return_count')
    .eq('user_id', DEFAULT_USER_ID)
  if (error || !data) return 0
  return data.reduce((sum, r) => sum + (r.return_count ?? 0), 0)
}
