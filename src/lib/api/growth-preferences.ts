export type GrowthPreferences = {
  user_id: string
  enable_habit_checkins: boolean
  enable_progress_tracking: boolean
  enable_state_tracking: boolean
  enable_focus_timer: boolean
  enable_motion_detection: boolean
}

export const DEFAULT_GROWTH_PREFERENCES: Omit<GrowthPreferences, 'user_id'> = {
  enable_habit_checkins: false,
  enable_progress_tracking: false,
  enable_state_tracking: false,
  enable_focus_timer: true,
  enable_motion_detection: true,
}

function getStorageKey(userId: string) {
  return `growth_preferences:${userId}`
}

type GrowthPreferencesClient = {
  from: (table: string) => unknown
}

type GrowthPreferencesTable = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      maybeSingle: () => Promise<{ data: GrowthPreferences | null; error: Error | null }>
    }
  }
  upsert: (
    payload: GrowthPreferences & { updated_at: string },
    options: { onConflict: string }
  ) => Promise<{ error: Error | null }>
}

async function getSupabaseClient() {
  const { supabase } = await import('../supabase.ts')
  return supabase as GrowthPreferencesClient
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
      enable_focus_timer: next.enable_focus_timer,
      enable_motion_detection: next.enable_motion_detection,
    })
  )
}

export async function getGrowthPreferences(userId: string): Promise<GrowthPreferences> {
  return getGrowthPreferencesWithClient(await getSupabaseClient(), userId)
}

export async function getGrowthPreferencesWithClient(
  client: GrowthPreferencesClient,
  userId: string
): Promise<GrowthPreferences> {
  const growthPreferencesTable = client.from('user_growth_preferences') as GrowthPreferencesTable
  const { data, error } = await growthPreferencesTable
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
  return upsertGrowthPreferencesWithClient(await getSupabaseClient(), userId, preferences)
}

export async function upsertGrowthPreferencesWithClient(
  client: GrowthPreferencesClient,
  userId: string,
  preferences: Partial<Omit<GrowthPreferences, 'user_id'>>
) {
  const existing = await getGrowthPreferencesWithClient(client, userId)
  const next = {
    enable_habit_checkins: existing.enable_habit_checkins,
    enable_progress_tracking: existing.enable_progress_tracking,
    enable_state_tracking: existing.enable_state_tracking,
    enable_focus_timer: existing.enable_focus_timer,
    enable_motion_detection: existing.enable_motion_detection,
    ...preferences,
  }

  writeLocalPreferences(userId, next)

  const growthPreferencesTable = client.from('user_growth_preferences') as GrowthPreferencesTable
  const { error } = await growthPreferencesTable
    .upsert(
      {
        user_id: userId,
        ...next,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  if (error && typeof window === 'undefined') throw error

  return {
    user_id: userId,
    ...next,
  }
}
