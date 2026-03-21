// src/lib/api/channels.ts
import { supabase } from '@/lib/supabase'

export type Channel = {
  id: string
  name: string
  description: string | null
  created_by: string
  sort_order: number
  created_at: string
}

export async function getChannels(): Promise<Channel[]> {
  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createChannel(name: string, userId: string, description?: string): Promise<Channel> {
  const { data, error } = await supabase
    .from('channels')
    .insert({ name, created_by: userId, description })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteChannel(channelId: string): Promise<void> {
  const { error } = await supabase
    .from('channels')
    .delete()
    .eq('id', channelId)
  if (error) throw error
}
