import { supabase } from '@/lib/supabase'
import { DEFAULT_USER_ID } from '@/lib/constants'

export async function getStickyNotes() {
  const { data, error } = await supabase
    .from('sticky_notes')
    .select('*')
    .eq('user_id', DEFAULT_USER_ID)
    .order('order', { ascending: true })
  if (error) throw error
  return data
}

export async function addStickyNote(content: string) {
  const { error } = await supabase
    .from('sticky_notes')
    .insert({ content, user_id: DEFAULT_USER_ID, order: Date.now() })
  if (error) throw error
}

export async function deleteStickyNote(id: string) {
  const { error } = await supabase
    .from('sticky_notes')
    .delete()
    .eq('id', id)
  if (error) throw error
}
