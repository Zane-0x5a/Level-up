export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = Exclude<ThemePreference, 'system'>

export const THEME_STORAGE_KEY = 'level-up:theme:v1'
export const THEME_MEDIA_QUERY = '(prefers-color-scheme: dark)'
export const THEME_COLORS = { light: '#faf8f5', dark: '#181a1b' } as const

export function parseThemePreference(value: string | null): ThemePreference {
  return value === 'light' || value === 'dark' ? value : 'system'
}

export function resolveTheme(preference: ThemePreference, systemDark: boolean): ResolvedTheme {
  return preference === 'system' ? (systemDark ? 'dark' : 'light') : preference
}

// Runs in the document head before content can paint, including static exports.
export const THEME_INIT_SCRIPT = `(() => {
  let preference = 'system';
  try { preference = localStorage.getItem('${THEME_STORAGE_KEY}'); } catch {}
  const dark = preference === 'dark' || (preference !== 'light' && matchMedia('${THEME_MEDIA_QUERY}').matches);
  const theme = dark ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', dark ? '${THEME_COLORS.dark}' : '${THEME_COLORS.light}');
})();`
