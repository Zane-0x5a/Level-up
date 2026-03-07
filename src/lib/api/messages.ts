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

export async function getMessageById(id: string): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('id', id)
    .single()
  if (error) {
    console.error('Failed to fetch message by id:', error)
    return null
  }
  return data as Message
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
      async (payload) => {
        const msg = payload.new as Message
        // Realtime WAL may omit jsonb fields — re-fetch checkin messages for complete data
        if (msg.message_type === 'checkin' && !msg.checkin_data) {
          const full = await getMessageById(msg.id)
          if (full) {
            onNewMessage(full)
          }
          // Drop the message if re-fetch fails; it will appear on next page load
          return
        }
        onNewMessage(msg)
      }
    )
    .subscribe()
}

export function unsubscribeFromChannel(channel: RealtimeChannel): void {
  supabase.removeChannel(channel)
}

export async function deleteMessage(
  messageId: string,
  userId: string,
  isAdmin: boolean
): Promise<void> {
  const { data: message, error: fetchError } = await supabase
    .from('messages')
    .select('user_id, created_at, image_url, message_type')
    .eq('id', messageId)
    .single()

  if (fetchError) throw new Error('消息不存在')

  const isOwner = message.user_id === userId
  if (!isAdmin && !isOwner) {
    throw new Error('您没有权限删除此消息')
  }

  if (!isAdmin && isOwner) {
    const elapsed = (Date.now() - new Date(message.created_at).getTime()) / 1000 / 60
    if (elapsed > 3) {
      throw new Error('消息发送超过3分钟，无法撤回')
    }
  }

  if (message.message_type === 'image' && message.image_url) {
    const path = message.image_url.split('/chat-images/')[1]
    if (path) {
      await supabase.storage.from('chat-images').remove([path])
    }
  }

  const { error: deleteError } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)

  if (deleteError) throw deleteError
}
