import { supabase } from '@/lib/supabase'
import { DEFAULT_USER_ID } from '@/lib/constants'

export async function getCountdowns() {
  const { data, error } = await supabase
    .from('countdowns')
    .select('*')
    .eq('user_id', DEFAULT_USER_ID)
    .order('target_date', { ascending: true })
  if (error) throw error
  return data
}

export async function addCountdown(label: string, targetDate: string) {
  const { error } = await supabase
    .from('countdowns')
    .insert({ label, target_date: targetDate, user_id: DEFAULT_USER_ID })
  if (error) throw error
}

export async function deleteCountdown(id: string) {
  const { error } = await supabase
    .from('countdowns')
    .delete()
    .eq('id', id)
  if (error) throw error
}
