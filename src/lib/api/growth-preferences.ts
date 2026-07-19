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

const SAFE_READ_ERROR_PREFERENCES: Omit<GrowthPreferences, 'user_id'> = {
  ...DEFAULT_GROWTH_PREFERENCES,
  enable_focus_timer: false,
}

const LOCAL_PREFERENCES_VERSION = 2
const LOCAL_PENDING_MAX_AGE_MS = 60_000
const TIMER_STAGE_PREFIX = 'growth_preferences_timer_stage'

function getStorageKey(userId: string) {
  return `growth_preferences:${userId}`
}

function getTimerStageKey(userId: string) {
  return `${TIMER_STAGE_PREFIX}:${userId}`
}

type GrowthPreferencesClient = {
  from: (table: string) => unknown
}

type GrowthPreferenceValues = Omit<GrowthPreferences, 'user_id'>

type StoredGrowthPreferencesV2 = {
  version: typeof LOCAL_PREFERENCES_VERSION
  values: GrowthPreferenceValues
  pending: boolean
  writtenAt: number
  confirmed?: boolean
}

type LocalPreferenceSnapshot = {
  values: GrowthPreferenceValues
  pending: boolean
  writtenAt: number
  confirmed: boolean
}

type StagedTimerPreference = {
  value: boolean
  writtenAt: number
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

const pendingPreferenceWrites = new Map<string, Promise<GrowthPreferences>>()
const preferenceWriteVersions = new Map<string, number>()
const lastKnownPreferences = new Map<
  string,
  { preferences: GrowthPreferences; writtenAt: number; confirmed: boolean }
>()

async function getSupabaseClient() {
  const { supabase } = await import('../supabase.ts')
  return supabase as GrowthPreferencesClient
}

function readLocalPreferencesRaw(userId: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(getStorageKey(userId))
  } catch {
    return null
  }
}

function readStagedTimerPreference(userId: string): boolean | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(getTimerStageKey(userId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StagedTimerPreference>
    if (
      typeof parsed.value !== 'boolean' ||
      typeof parsed.writtenAt !== 'number' ||
      !Number.isFinite(parsed.writtenAt) ||
      Date.now() - parsed.writtenAt > LOCAL_PENDING_MAX_AGE_MS
    ) {
      window.localStorage.removeItem(getTimerStageKey(userId))
      return null
    }
    return parsed.value
  } catch {
    return null
  }
}

export function stageFocusTimerPreference(userId: string, value: boolean): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      getTimerStageKey(userId),
      JSON.stringify({ value, writtenAt: Date.now() } satisfies StagedTimerPreference)
    )
  } catch {
    // The server write still proceeds; timer storage itself remains fail-closed.
  }
}

export function clearStagedFocusTimerPreference(userId: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(getTimerStageKey(userId))
  } catch {
    // Expiry prevents an unavailable cleanup from becoming a permanent override.
  }
}

function applyStagedTimerPreference(
  userId: string,
  preferences: GrowthPreferences
): GrowthPreferences {
  const staged = readStagedTimerPreference(userId)
  // Disabling must take effect immediately across tabs. Enabling waits for a
  // confirmed database write so an optimistic toggle cannot start a timer.
  return staged === false
    ? { ...preferences, enable_focus_timer: false }
    : preferences
}

function normalizePreferenceValues(
  preferences: Partial<GrowthPreferenceValues>,
  fallback: GrowthPreferenceValues = DEFAULT_GROWTH_PREFERENCES
): GrowthPreferenceValues {
  return {
    enable_habit_checkins:
      typeof preferences.enable_habit_checkins === 'boolean'
        ? preferences.enable_habit_checkins
        : fallback.enable_habit_checkins,
    enable_progress_tracking:
      typeof preferences.enable_progress_tracking === 'boolean'
        ? preferences.enable_progress_tracking
        : fallback.enable_progress_tracking,
    enable_state_tracking:
      typeof preferences.enable_state_tracking === 'boolean'
        ? preferences.enable_state_tracking
        : fallback.enable_state_tracking,
    enable_focus_timer:
      typeof preferences.enable_focus_timer === 'boolean'
        ? preferences.enable_focus_timer
        : fallback.enable_focus_timer,
    enable_motion_detection:
      typeof preferences.enable_motion_detection === 'boolean'
        ? preferences.enable_motion_detection
        : fallback.enable_motion_detection,
  }
}

function readLocalPreferenceSnapshot(
  userId: string,
  fallback: GrowthPreferenceValues = DEFAULT_GROWTH_PREFERENCES
): LocalPreferenceSnapshot | null {
  try {
    const raw = readLocalPreferencesRaw(userId)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<GrowthPreferenceValues> | StoredGrowthPreferencesV2

    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'version' in parsed &&
      parsed.version === LOCAL_PREFERENCES_VERSION &&
      'values' in parsed &&
      typeof parsed.values === 'object' &&
      parsed.values !== null
    ) {
      return {
        values: normalizePreferenceValues(parsed.values, fallback),
        pending: parsed.pending === true,
        writtenAt:
          typeof parsed.writtenAt === 'number' && Number.isFinite(parsed.writtenAt)
            ? parsed.writtenAt
            : 0,
        confirmed: parsed.confirmed === true && parsed.pending !== true,
      }
    }

    return {
      values: normalizePreferenceValues(parsed as Partial<GrowthPreferenceValues>, fallback),
      pending: false,
      writtenAt: 0,
      confirmed: false,
    }
  } catch {
    return null
  }
}

function readLocalPreferences(
  userId: string,
  fallback: GrowthPreferenceValues = DEFAULT_GROWTH_PREFERENCES
): GrowthPreferences {
  const snapshot = readLocalPreferenceSnapshot(userId, fallback)
  return {
    user_id: userId,
    ...(snapshot?.values ?? fallback),
  }
}

function writeLocalPreferences(
  userId: string,
  preferences: Partial<GrowthPreferenceValues>,
  pending = false,
  confirmed = false
): number | null {
  if (typeof window === 'undefined') return null

  const current = readLocalPreferences(userId)
  const next = normalizePreferenceValues(preferences, current)
  const writtenAt = Date.now()

  try {
    window.localStorage.setItem(
      getStorageKey(userId),
      JSON.stringify({
        version: LOCAL_PREFERENCES_VERSION,
        values: next,
        pending,
        writtenAt,
        confirmed: confirmed && !pending,
      } satisfies StoredGrowthPreferencesV2)
    )
    return writtenAt
  } catch {
    // Remote persistence remains authoritative when browser storage is unavailable.
    return null
  }
}

export async function getGrowthPreferences(userId: string): Promise<GrowthPreferences> {
  return getGrowthPreferencesWithClient(await getSupabaseClient(), userId)
}

function rememberPreferences(
  preferences: GrowthPreferences,
  confirmed: boolean,
  writtenAt = Date.now()
): GrowthPreferences {
  lastKnownPreferences.set(preferences.user_id, {
    preferences,
    writtenAt,
    confirmed,
  })
  return preferences
}

export function hasReliableGrowthPreferences(userId: string): boolean {
  return lastKnownPreferences.get(userId)?.confirmed === true
}

async function readGrowthPreferencesWithClient(
  client: GrowthPreferencesClient,
  userId: string
): Promise<GrowthPreferences> {
  const localSnapshotBeforeRead = readLocalPreferenceSnapshot(userId)
  if (
    localSnapshotBeforeRead?.pending &&
    Date.now() - localSnapshotBeforeRead.writtenAt <= LOCAL_PENDING_MAX_AGE_MS
  ) {
    return rememberPreferences(
      {
        user_id: userId,
        ...localSnapshotBeforeRead.values,
        enable_focus_timer: false,
      },
      false,
      localSnapshotBeforeRead.writtenAt
    )
  }

  const localRawBeforeRead = readLocalPreferencesRaw(userId)
  const growthPreferencesTable = client.from('user_growth_preferences') as GrowthPreferencesTable
  const { data, error } = await growthPreferencesTable
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    const remembered = lastKnownPreferences.get(userId)
    const localSnapshot = readLocalPreferenceSnapshot(
      userId,
      SAFE_READ_ERROR_PREFERENCES
    )
    const useLocal =
      localSnapshot !== null &&
      (!remembered || localSnapshot.writtenAt > remembered.writtenAt)
    const fallbackValues = useLocal
      ? localSnapshot.values
      : remembered?.preferences ?? SAFE_READ_ERROR_PREFERENCES
    const fallbackWrittenAt = useLocal
      ? localSnapshot.writtenAt
      : remembered?.writtenAt ?? 0

    return rememberPreferences(
      {
        user_id: userId,
        ...fallbackValues,
        enable_focus_timer: false,
      },
      false,
      fallbackWrittenAt
    )
  }

  if (!data) {
    const resolved = readLocalPreferences(userId)
    const writtenAt = writeLocalPreferences(userId, resolved, false, true)
    return rememberPreferences(resolved, true, writtenAt ?? Date.now())
  }

  const localRawAfterRead = readLocalPreferencesRaw(userId)
  if (
    localRawAfterRead !== null &&
    localRawAfterRead !== localRawBeforeRead
  ) {
    // Another tab changed the preference while this request was in flight.
    // Do not let the older server snapshot restart a timer that was just disabled.
    const localSnapshot = readLocalPreferenceSnapshot(userId)
    if (localSnapshot) {
      return rememberPreferences(
        {
          user_id: userId,
          ...localSnapshot.values,
          enable_focus_timer: localSnapshot.confirmed
            ? localSnapshot.values.enable_focus_timer
            : false,
        },
        localSnapshot.confirmed,
        localSnapshot.writtenAt
      )
    }
  }

  const resolved = {
    user_id: userId,
    ...normalizePreferenceValues(data),
  }
  const writtenAt = writeLocalPreferences(userId, resolved, false, true)
  return rememberPreferences(resolved, true, writtenAt ?? Date.now())
}

export async function getGrowthPreferencesWithClient(
  client: GrowthPreferencesClient,
  userId: string
): Promise<GrowthPreferences> {
  while (true) {
    const pendingWrite = pendingPreferenceWrites.get(userId)
    if (pendingWrite) {
      return applyStagedTimerPreference(userId, await pendingWrite)
    }

    const versionBeforeRead = preferenceWriteVersions.get(userId) ?? 0
    const preferences = await readGrowthPreferencesWithClient(client, userId)
    const writeStartedWhileReading = pendingPreferenceWrites.get(userId)
    if (writeStartedWhileReading) {
      return writeStartedWhileReading
    }

    if ((preferenceWriteVersions.get(userId) ?? 0) === versionBeforeRead) {
      return applyStagedTimerPreference(userId, preferences)
    }
  }
}

export async function upsertGrowthPreferences(
  userId: string,
  preferences: Partial<Omit<GrowthPreferences, 'user_id'>>
) {
  return upsertGrowthPreferencesWithClient(await getSupabaseClient(), userId, preferences)
}

export function upsertGrowthPreferencesWithClient(
  client: GrowthPreferencesClient,
  userId: string,
  preferences: Partial<Omit<GrowthPreferences, 'user_id'>>
): Promise<GrowthPreferences> {
  const previousWrite = pendingPreferenceWrites.get(userId)
  preferenceWriteVersions.set(
    userId,
    (preferenceWriteVersions.get(userId) ?? 0) + 1
  )

  const write = (async () => {
    const existing = previousWrite
      ? await previousWrite
      : await readGrowthPreferencesWithClient(client, userId)
    if (!hasReliableGrowthPreferences(userId)) {
      throw new Error('Unable to confirm current growth preferences')
    }
    const next = {
      enable_habit_checkins: existing.enable_habit_checkins,
      enable_progress_tracking: existing.enable_progress_tracking,
      enable_state_tracking: existing.enable_state_tracking,
      enable_focus_timer: existing.enable_focus_timer,
      enable_motion_detection: existing.enable_motion_detection,
      ...preferences,
    }

    writeLocalPreferences(userId, next, true, false)

    try {
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

      if (error) throw error
      const writtenAt = writeLocalPreferences(userId, next, false, true)
      rememberPreferences(
        { user_id: userId, ...next },
        true,
        writtenAt ?? Date.now()
      )
    } catch (error) {
      const writtenAt = writeLocalPreferences(userId, existing, false, true)
      rememberPreferences(existing, true, writtenAt ?? Date.now())
      throw error
    }

    return {
      user_id: userId,
      ...next,
    }
  })()

  const trackedWrite = write.finally(() => {
    if (pendingPreferenceWrites.get(userId) === trackedWrite) {
      pendingPreferenceWrites.delete(userId)
    }
  })
  pendingPreferenceWrites.set(userId, trackedWrite)
  return trackedWrite
}
