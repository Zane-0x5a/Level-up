import { supabase } from '@/lib/supabase'

export type FocusImage = {
  id: string
  file_path: string
  device_type: 'mobile' | 'desktop' | 'universal'
}

export async function getFocusImages(userId: string): Promise<FocusImage[]> {
  const { data, error } = await supabase
    .from('focus_images')
    .select('*')
    .eq('user_id', userId)
  if (error) throw error
  return data ?? []
}

export async function uploadFocusImage(
  userId: string,
  file: File,
  deviceType: 'mobile' | 'desktop' | 'universal' = 'universal'
) {
  const ext = file.name.split('.').pop() || 'png'
  const filePath = `focus/${userId}/${Date.now()}.${ext}`
  const { error: uploadError } = await supabase.storage
    .from('focus-images')
    .upload(filePath, file)
  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage
    .from('focus-images')
    .getPublicUrl(filePath)

  const { error } = await supabase
    .from('focus_images')
    .insert({ user_id: userId, file_path: urlData.publicUrl, device_type: deviceType })
  if (error) throw error
}

export async function deleteFocusImage(id: string) {
  const { error } = await supabase
    .from('focus_images')
    .delete()
    .eq('id', id)
  if (error) throw error
}
