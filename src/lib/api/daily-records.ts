import { supabase } from '@/lib/supabase'

export type ProgressLevel = 'slight' | 'solid' | 'breakthrough'
export type StateLabel = 'recovering' | 'steady' | 'good' | 'energized'

export type DailyRecord = {
  id: string
  user_id: string
  date: string
  day_type: 'study_day' | 'rest_day'
  focus_in_class: number
  focus_out_class: number
  entertainment: number
  ibetter_count: number
  return_count: number
  progress_level: ProgressLevel | null
  progress_note: string | null
  state_label: StateLabel | null
  note: string | null
  created_at: string
}

export type DailyRecordInput = {
  date: string
  day_type: 'study_day' | 'rest_day'
  ibetter_count?: number
  note?: string
  focus_in_class?: number
  focus_out_class?: number
  entertainment?: number
  progress_level?: ProgressLevel | null
  progress_note?: string | null
  state_label?: StateLabel | null
}

export async function getDailyRecord(userId: string, date: string): Promise<DailyRecord | null> {
  const { data, error } = await supabase
    .from('daily_records')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return (data as DailyRecord | null) ?? null
}

export async function upsertDailyRecord(userId: string, record: DailyRecordInput) {
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
  return (data as DailyRecord[]) ?? []
}
