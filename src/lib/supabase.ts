import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function createMissingEnvClient(): SupabaseClient {
  const error = new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  )

  const createThrowingProxy = (): unknown =>
    new Proxy(
      () => {
        throw error
      },
      {
        apply() {
          throw error
        },
        get() {
          return createThrowingProxy()
        },
      }
    )

  return createThrowingProxy() as SupabaseClient
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createMissingEnvClient()
