import { supabase } from '@/lib/supabase'

export async function addFocusSession(userId: string, category: string, duration: number) {
  const { error } = await supabase
    .from('focus_sessions')
    .insert({
      user_id: userId,
      category,
      duration,
      date: new Date().toISOString().split('T')[0],
    })
  if (error) throw error
}

export async function getTodayFocusSessions(userId: string, date?: string) {
  const targetDate = date ?? new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('focus_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('date', targetDate)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getTodayReturnCount(userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('daily_records')
    .select('return_count')
    .eq('user_id', userId)
    .eq('date', today)
    .single()
  if (error || !data) return 0
  return data.return_count ?? 0
}

export async function incrementReturnCount(userId: string, date: string) {
  const { data: existing } = await supabase
    .from('daily_records')
    .select('id, return_count')
    .eq('user_id', userId)
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
        user_id: userId,
        date,
        day_type: 'study_day',
        return_count: 1,
      })
    if (error) throw error
  }
}
