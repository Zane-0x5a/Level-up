// src/lib/api/user-profiles.ts
import { supabase } from '@/lib/supabase'

export type UserProfile = {
  user_id: string
  nickname: string
  avatar_url: string | null
  is_admin: boolean
  created_at: string
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function getAllProfiles(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
  if (error) throw error
  return data ?? []
}

export async function createProfile(userId: string, nickname: string): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .insert({ user_id: userId, nickname })
  if (error) throw error
}

export async function updateProfile(userId: string, updates: { nickname?: string; avatar_url?: string }): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('user_id', userId)
  if (error) throw error
}
