import { supabase } from '@/lib/supabase'

export type GrowthPreferences = {
  user_id: string
  enable_habit_checkins: boolean
  enable_progress_tracking: boolean
  enable_state_tracking: boolean
}

export const DEFAULT_GROWTH_PREFERENCES: Omit<GrowthPreferences, 'user_id'> = {
  enable_habit_checkins: false,
  enable_progress_tracking: false,
  enable_state_tracking: false,
}

function getStorageKey(userId: string) {
  return `growth_preferences:${userId}`
}

function readLocalPreferences(userId: string): GrowthPreferences {
  if (typeof window === 'undefined') {
    return {
      user_id: userId,
      ...DEFAULT_GROWTH_PREFERENCES,
    }
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(userId))
    if (!raw) {
      return {
        user_id: userId,
        ...DEFAULT_GROWTH_PREFERENCES,
      }
    }

    const parsed = JSON.parse(raw) as Partial<Omit<GrowthPreferences, 'user_id'>>
    return {
      user_id: userId,
      ...DEFAULT_GROWTH_PREFERENCES,
      ...parsed,
    }
  } catch {
    return {
      user_id: userId,
      ...DEFAULT_GROWTH_PREFERENCES,
    }
  }
}

function writeLocalPreferences(
  userId: string,
  preferences: Partial<Omit<GrowthPreferences, 'user_id'>>
) {
  if (typeof window === 'undefined') return

  const next = {
    ...readLocalPreferences(userId),
    ...preferences,
  }

  window.localStorage.setItem(
    getStorageKey(userId),
    JSON.stringify({
      enable_habit_checkins: next.enable_habit_checkins,
      enable_progress_tracking: next.enable_progress_tracking,
      enable_state_tracking: next.enable_state_tracking,
    })
  )
}

export async function getGrowthPreferences(userId: string): Promise<GrowthPreferences> {
  const { data, error } = await supabase
    .from('user_growth_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    return readLocalPreferences(userId)
  }

  if (!data) {
    return readLocalPreferences(userId)
  }

  return data as GrowthPreferences
}

export async function upsertGrowthPreferences(
  userId: string,
  preferences: Partial<Omit<GrowthPreferences, 'user_id'>>
) {
  writeLocalPreferences(userId, preferences)

  const { error } = await supabase
    .from('user_growth_preferences')
    .upsert(
      {
        user_id: userId,
        ...DEFAULT_GROWTH_PREFERENCES,
        ...preferences,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  if (error && typeof window === 'undefined') throw error
}
