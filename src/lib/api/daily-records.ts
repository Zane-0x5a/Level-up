import { supabase } from '@/lib/supabase'

export async function getDailyRecord(userId: string, date: string) {
  const { data, error } = await supabase
    .from('daily_records')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function upsertDailyRecord(userId: string, record: {
  date: string
  day_type: string
  ibetter_count?: number
  note?: string
  focus_in_class?: number
  focus_out_class?: number
  entertainment?: number
}) {
  const { error } = await supabase
    .from('daily_records')
    .upsert(
      { ...record, user_id: userId },
      { onConflict: 'user_id,date' }
    )
  if (error) throw error
}

export async function clearDailyNote(userId: string, date: string) {
  const { error } = await supabase
    .from('daily_records')
    .update({ note: null })
    .eq('user_id', userId)
    .eq('date', date)
  if (error) throw error
}

export async function getAllDailyRecords(userId: string) {
  const { data, error } = await supabase
    .from('daily_records')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
  if (error) throw error
  return data ?? []
}
