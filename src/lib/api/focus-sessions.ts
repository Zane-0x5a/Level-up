import { supabase } from '@/lib/supabase'
import { DEFAULT_USER_ID } from '@/lib/constants'

export async function addFocusSession(category: string, duration: number) {
  const { error } = await supabase
    .from('focus_sessions')
    .insert({
      user_id: DEFAULT_USER_ID,
      category,
      duration,
      date: new Date().toISOString().split('T')[0],
    })
  if (error) throw error
}

export async function getTodayFocusSessions() {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('focus_sessions')
    .select('*')
    .eq('user_id', DEFAULT_USER_ID)
    .eq('date', today)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getTodayReturnCount(): Promise<number> {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('daily_records')
    .select('return_count')
    .eq('user_id', DEFAULT_USER_ID)
    .eq('date', today)
    .single()
  if (error || !data) return 0
  return data.return_count ?? 0
}

export async function incrementReturnCount(date: string) {
  const { data: existing } = await supabase
    .from('daily_records')
    .select('id, return_count')
    .eq('user_id', DEFAULT_USER_ID)
    .eq('date', date)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('daily_records')
      .update({ return_count: (existing.return_count ?? 0) + 1 })
      .eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('daily_records')
      .insert({
        user_id: DEFAULT_USER_ID,
        date,
        day_type: 'study_day',
        return_count: 1,
      })
    if (error) throw error
  }
}
