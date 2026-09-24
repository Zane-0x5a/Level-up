export type BackgroundPreference = 'mesh' | 'grain' | 'static'

export const BACKGROUND_STORAGE_KEY = 'level-up:background:v1'
export const DEFAULT_BACKGROUND: BackgroundPreference = 'mesh'

export function parseBackgroundPreference(value: string | null): BackgroundPreference {
  return value === 'mesh' || value === 'grain' || value === 'static' ? value : DEFAULT_BACKGROUND
}
