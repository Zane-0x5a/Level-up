import { supabase } from '@/lib/supabase'
import { DEFAULT_USER_ID } from '@/lib/constants'

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

export async function getDailyRecord(userIdOrDate: string, maybeDate?: string): Promise<DailyRecord | null> {
  const userId = maybeDate ? userIdOrDate : DEFAULT_USER_ID
  const date = maybeDate ?? userIdOrDate
  const { data, error } = await supabase
    .from('daily_records')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return (data as DailyRecord | null) ?? null
}

export async function upsertDailyRecord(
  userIdOrRecord: string | DailyRecordInput,
  maybeRecord?: DailyRecordInput
) {
  const userId = typeof userIdOrRecord === 'string' ? userIdOrRecord : DEFAULT_USER_ID
  const record = typeof userIdOrRecord === 'string' ? maybeRecord! : userIdOrRecord
  const { error } = await supabase
    .from('daily_records')
    .upsert(
      { ...record, user_id: userId },
      { onConflict: 'user_id,date' }
    )
  if (error) throw error
}

export async function clearDailyNote(userIdOrDate: string, maybeDate?: string) {
  const userId = maybeDate ? userIdOrDate : DEFAULT_USER_ID
  const date = maybeDate ?? userIdOrDate
  const { error } = await supabase
    .from('daily_records')
    .update({ note: null })
    .eq('user_id', userId)
    .eq('date', date)
  if (error) throw error
}

export async function getAllDailyRecords(userId = DEFAULT_USER_ID) {
  const { data, error } = await supabase
    .from('daily_records')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
  if (error) throw error
  return (data as DailyRecord[]) ?? []
}
