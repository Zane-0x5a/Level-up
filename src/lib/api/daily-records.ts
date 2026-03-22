export type ProgressLevel = 'slight' | 'solid' | 'breakthrough'
export type StateLabel = 'recovering' | 'steady' | 'good' | 'energized'

export type DailyRecord = {
  id: string
  user_id: string
  date: string
  day_type: 'study_day' | 'rest_day'
  focus_in_class: number
  focus_out_class: number
  entertainment: number
  ibetter_count: number
  return_count: number
  progress_level: ProgressLevel | null
  progress_note: string | null
  state_label: StateLabel | null
  note: string | null
  created_at: string
}

export type DailyRecordInput = {
  date: string
  day_type: 'study_day' | 'rest_day'
  ibetter_count?: number
  note?: string
  focus_in_class?: number
  focus_out_class?: number
  entertainment?: number
  progress_level?: ProgressLevel | null
  progress_note?: string | null
  state_label?: StateLabel | null
}

type DailyRecordsClient = {
  from: (table: string) => unknown
}

type DailyRecordsTable = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      eq: (column: string, value: string) => {
        single: () => Promise<{ data: DailyRecord | null; error: { code?: string } | null }>
      }
      order: (
        column: string,
        options: { ascending: boolean }
      ) => Promise<{ data: DailyRecord[] | null; error: Error | null }>
    }
  }
  upsert: (
    payload: DailyRecordInput & { user_id: string },
    options: { onConflict: string }
  ) => Promise<{ error: Error | null }>
  update: (payload: { note: null }) => {
    eq: (column: string, value: string) => {
      eq: (column: string, value: string) => Promise<{ error: Error | null }>
    }
  }
}

async function getSupabaseClient() {
  const { supabase } = await import('../supabase.ts')
  return supabase as DailyRecordsClient
}

export async function getDailyRecord(userId: string, date: string): Promise<DailyRecord | null> {
  return getDailyRecordWithClient(await getSupabaseClient(), userId, date)
}

export async function getDailyRecordWithClient(
  client: DailyRecordsClient,
  userId: string,
  date: string
): Promise<DailyRecord | null> {
  const dailyRecordsTable = client.from('daily_records') as DailyRecordsTable
  const { data, error } = await dailyRecordsTable
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return (data as DailyRecord | null) ?? null
}

export async function upsertDailyRecord(userId: string, record: DailyRecordInput) {
  return upsertDailyRecordWithClient(await getSupabaseClient(), userId, record)
}

export async function upsertDailyRecordWithClient(
  client: DailyRecordsClient,
  userId: string,
  record: DailyRecordInput
) {
  const dailyRecordsTable = client.from('daily_records') as DailyRecordsTable
  const { error } = await dailyRecordsTable.upsert(
    { ...record, user_id: userId },
    { onConflict: 'user_id,date' }
  )
  if (error) throw error
}

export async function clearDailyNote(userId: string, date: string) {
  return clearDailyNoteWithClient(await getSupabaseClient(), userId, date)
}

export async function clearDailyNoteWithClient(
  client: DailyRecordsClient,
  userId: string,
  date: string
) {
  const dailyRecordsTable = client.from('daily_records') as DailyRecordsTable
  const { error } = await dailyRecordsTable
    .update({ note: null })
    .eq('user_id', userId)
    .eq('date', date)
  if (error) throw error
}

export async function getAllDailyRecords(userId: string) {
  return getAllDailyRecordsWithClient(await getSupabaseClient(), userId)
}

export async function getAllDailyRecordsWithClient(
  client: DailyRecordsClient,
  userId: string
) {
  const dailyRecordsTable = client.from('daily_records') as DailyRecordsTable
  const { data, error } = await dailyRecordsTable
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
  if (error) throw error
  return (data as DailyRecord[]) ?? []
}
