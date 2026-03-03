// src/lib/api/messages.ts
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export type Message = {
  id: string
  channel_id: string
  user_id: string
  content: string | null
  message_type: 'text' | 'image' | 'checkin'
  image_url: string | null
  checkin_data: Record<string, unknown> | null
  reply_to: string | null
  created_at: string
}

const PAGE_SIZE = 50

export async function getMessages(channelId: string, before?: string): Promise<Message[]> {
  let query = supabase
    .from('messages')
    .select('*')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE)

  if (before) {
    query = query.lt('created_at', before)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).reverse()
}

export async function sendTextMessage(channelId: string, userId: string, content: string, replyTo?: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .insert({
      channel_id: channelId,
      user_id: userId,
      content,
      message_type: 'text',
      reply_to: replyTo ?? null,
    })
  if (error) throw error
}

export async function sendImageMessage(channelId: string, userId: string, file: File): Promise<void> {
  const ext = file.name.split('.').pop() || 'png'
  const safeName = `${Date.now()}.${ext}`
  const filePath = `${userId}/${safeName}`

  const { error: uploadError } = await supabase.storage
    .from('chat-images')
    .upload(filePath, file, { contentType: file.type })
  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage
    .from('chat-images')
    .getPublicUrl(filePath)

  const { error } = await supabase
    .from('messages')
    .insert({
      channel_id: channelId,
      user_id: userId,
      message_type: 'image',
      image_url: urlData.publicUrl,
    })
  if (error) throw error
}

export async function sendCheckinMessage(
  channelId: string,
  userId: string,
  checkinData: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .insert({
      channel_id: channelId,
      user_id: userId,
      message_type: 'checkin',
      checkin_data: checkinData,
    })
  if (error) throw error
}

export function subscribeToChannel(
  channelId: string,
  onNewMessage: (message: Message) => void
): RealtimeChannel {
  return supabase
    .channel(`channel-${channelId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId}`,
      },
      (payload) => {
        onNewMessage(payload.new as Message)
      }
    )
    .subscribe()
}

export function unsubscribeFromChannel(channel: RealtimeChannel): void {
  supabase.removeChannel(channel)
}
