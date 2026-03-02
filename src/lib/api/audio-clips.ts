import { supabase } from '@/lib/supabase'
import { DEFAULT_USER_ID } from '@/lib/constants'

export async function getAudioClips() {
  const { data, error } = await supabase
    .from('audio_clips')
    .select('*')
    .eq('user_id', DEFAULT_USER_ID)
    .order('order', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function uploadAudioClip(file: File, label: string) {
  const filePath = `audio/${DEFAULT_USER_ID}/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage
    .from('audio-clips')
    .upload(filePath, file)
  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage
    .from('audio-clips')
    .getPublicUrl(filePath)

  const { error } = await supabase
    .from('audio_clips')
    .insert({
      user_id: DEFAULT_USER_ID,
      label,
      file_path: urlData.publicUrl,
    })
  if (error) throw error
}

export async function deleteAudioClip(id: string) {
  const { error } = await supabase
    .from('audio_clips')
    .delete()
    .eq('id', id)
  if (error) throw error
}
