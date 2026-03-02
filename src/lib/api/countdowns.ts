import { supabase } from '@/lib/supabase'

export async function getCountdowns(userId: string) {
  const { data, error } = await supabase
    .from('countdowns')
    .select('*')
    .eq('user_id', userId)
    .order('target_date', { ascending: true })
  if (error) throw error
  return data
}

export async function addCountdown(userId: string, label: string, targetDate: string) {
  const { error } = await supabase
    .from('countdowns')
    .insert({ label, target_date: targetDate, user_id: userId })
  if (error) throw error
}

export async function deleteCountdown(id: string) {
  const { error } = await supabase
    .from('countdowns')
    .delete()
    .eq('id', id)
  if (error) throw error
}
