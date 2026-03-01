import { supabase } from '@/lib/supabase'
import { DEFAULT_USER_ID } from '@/lib/constants'

export async function getDailyRecord(date: string) {
  const { data, error } = await supabase
    .from('daily_records')
    .select('*')
    .eq('user_id', DEFAULT_USER_ID)
    .eq('date', date)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function upsertDailyRecord(record: {
  date: string
  day_type: string
  ibetter_count?: number
  note?: string
}) {
  const { error } = await supabase
    .from('daily_records')
    .upsert(
      { ...record, user_id: DEFAULT_USER_ID },
      { onConflict: 'date' }
    )
  if (error) throw error
}

export async function getAllDailyRecords() {
  const { data, error } = await supabase
    .from('daily_records')
    .select('*')
    .eq('user_id', DEFAULT_USER_ID)
    .order('date', { ascending: false })
  if (error) throw error
  return data ?? []
}
