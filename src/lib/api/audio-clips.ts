import { supabase } from '@/lib/supabase'

export async function getAudioClips(userId: string) {
  const { data, error } = await supabase
    .from('audio_clips')
    .select('*')
    .eq('user_id', userId)
    .order('order', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function uploadAudioClip(userId: string, file: File, label: string) {
  const ext = file.name.split('.').pop() || 'mp3'
  const filePath = `audio/${userId}/${Date.now()}.${ext}`
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
      user_id: userId,
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
