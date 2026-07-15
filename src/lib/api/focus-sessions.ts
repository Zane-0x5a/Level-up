import { getLocalDateString } from '../local-date.ts'
import { assertValidFocusDuration } from '../focus-duration.ts'

export type FocusSession = {
  id: string
  user_id: string
  category: string
  duration: number
  date: string
  created_at: string
}

type FocusSessionsClient = {
  from: (table: string) => unknown
}

type SingleRowResult<T> = Promise<{ data: T | null; error: Error | null }>
type ManyRowsResult<T> = Promise<{ data: T[] | null; error: Error | null }>

type DailyReturnCountRow = {
  return_count: number | null
}

type ExistingDailyRecordRow = {
  id: string
  return_count: number | null
}

async function getSupabaseClient() {
  const { supabase } = await import('../supabase.ts')
  return supabase as FocusSessionsClient
}

export async function addFocusSessionWithClient(
  client: FocusSessionsClient,
  userId: string,
  category: string,
  duration: number,
  clientSessionId: string
) {
  assertValidFocusDuration(duration)
  const focusSessionsTable = client.from('focus_sessions') as {
    upsert: (payload: {
      id: string
      user_id: string
      category: string
      duration: number
      date: string
    }, options: { onConflict: string }) => {
      select: (columns: string) => {
        single: () => SingleRowResult<FocusSession>
      }
    }
  }
  const { data, error } = await focusSessionsTable
    .upsert(
      {
        id: clientSessionId,
        user_id: userId,
        category,
        duration,
        date: getLocalDateString(),
      },
      { onConflict: 'id' }
    )
    .select('*')
    .single()
  if (error) throw error
  return data as FocusSession
}

export async function addFocusSession(
  userId: string,
  category: string,
  duration: number,
  clientSessionId: string
) {
  return addFocusSessionWithClient(
    await getSupabaseClient(),
    userId,
    category,
    duration,
    clientSessionId
  )
}

export async function correctSubmittedFocusSessionWithClient(
  client: FocusSessionsClient,
  submittedSessionId: string,
  category: string,
  duration: number
) {
  assertValidFocusDuration(duration)
  const focusSessionsTable = client.from('focus_sessions') as {
    update: (payload: { category: string; duration: number }) => {
      eq: (column: string, value: string) => {
        select: (columns: string) => {
          single: () => SingleRowResult<FocusSession>
        }
      }
    }
  }
  const { data, error } = await focusSessionsTable
    .update({
      category,
      duration,
    })
    .eq('id', submittedSessionId)
    .select('*')
    .single()
  if (error) throw error
  return data as FocusSession
}

export async function correctSubmittedFocusSession(
  submittedSessionId: string,
  category: string,
  duration: number
) {
  return correctSubmittedFocusSessionWithClient(
    await getSupabaseClient(),
    submittedSessionId,
    category,
    duration
  )
}

export async function deleteFocusSessionWithClient(
  client: FocusSessionsClient,
  sessionId: string
) {
  const focusSessionsTable = client.from('focus_sessions') as {
    delete: () => {
      eq: (column: string, value: string) => Promise<{ error: Error | null }>
    }
  }
  const { error } = await focusSessionsTable.delete().eq('id', sessionId)
  if (error) throw error
}

export async function deleteFocusSession(sessionId: string) {
  return deleteFocusSessionWithClient(await getSupabaseClient(), sessionId)
}

export async function getLastFocusCategory(userId: string): Promise<string | null> {
  return getLastFocusCategoryWithClient(await getSupabaseClient(), userId)
}

export async function getLastFocusCategoryWithClient(
  client: FocusSessionsClient,
  userId: string,
): Promise<string | null> {
  const focusSessionsTable = client.from('focus_sessions') as {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        order: (
          column: string,
          options: { ascending: boolean }
        ) => {
          limit: (n: number) => ManyRowsResult<Pick<FocusSession, 'category'>>
        }
      }
    }
  }
  const { data, error } = await focusSessionsTable
    .select('category')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
  if (error || !data || data.length === 0) return null
  return data[0].category ?? null
}

export async function getTodayFocusSessions(userId: string, date?: string) {
  return getTodayFocusSessionsWithClient(await getSupabaseClient(), userId, date)
}

export async function getTodayFocusSessionsWithClient(
  client: FocusSessionsClient,
  userId: string,
  date?: string
) {
  const targetDate = date ?? getLocalDateString()
  const focusSessionsTable = client.from('focus_sessions') as {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => {
          order: (
            column: string,
            options: { ascending: boolean }
          ) => ManyRowsResult<FocusSession>
        }
      }
    }
  }
  const { data, error } = await focusSessionsTable
    .select('*')
    .eq('user_id', userId)
    .eq('date', targetDate)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as FocusSession[]) ?? []
}

export async function getTodayReturnCount(userId: string, date?: string): Promise<number> {
  const today = date ?? getLocalDateString()
  const supabase = await getSupabaseClient()
  const dailyRecordsTable = supabase.from('daily_records') as {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => {
          single: () => SingleRowResult<DailyReturnCountRow>
        }
      }
    }
  }
  const { data, error } = await dailyRecordsTable
    .select('return_count')
    .eq('user_id', userId)
    .eq('date', today)
    .single()
  if (error || !data) return 0
  return data.return_count ?? 0
}

export async function incrementReturnCount(userId: string, date: string) {
  const supabase = await getSupabaseClient()
  const dailyRecordsTable = supabase.from('daily_records') as {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => {
          single: () => SingleRowResult<ExistingDailyRecordRow>
        }
      }
    }
    update: (payload: { return_count: number }) => {
      eq: (column: string, value: string) => Promise<{ error: Error | null }>
    }
    insert: (payload: {
      user_id: string
      date: string
      day_type: 'study_day'
      return_count: number
    }) => Promise<{ error: Error | null }>
  }
  const { data: existing } = await dailyRecordsTable
    .select('id, return_count')
    .eq('user_id', userId)
    .eq('date', date)
    .single()

  if (existing) {
    const { error } = await dailyRecordsTable
      .update({ return_count: (existing.return_count ?? 0) + 1 })
      .eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await dailyRecordsTable
      .insert({
        user_id: userId,
        date,
        day_type: 'study_day',
        return_count: 1,
      })
    if (error) throw error
  }
}
