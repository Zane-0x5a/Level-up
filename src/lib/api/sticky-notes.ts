import { supabase } from '@/lib/supabase'

export async function getStickyNotes(userId: string) {
  const { data, error } = await supabase
    .from('sticky_notes')
    .select('*')
    .eq('user_id', userId)
    .order('order', { ascending: true })
  if (error) throw error
  return data
}

export async function addStickyNote(userId: string, content: string) {
  const { error } = await supabase
    .from('sticky_notes')
    .insert({ content, user_id: userId, order: Math.floor(Date.now() / 1000) })
  if (error) throw error
}

export async function deleteStickyNote(id: string) {
  const { error } = await supabase
    .from('sticky_notes')
    .delete()
    .eq('id', id)
  if (error) throw error
}
