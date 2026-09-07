import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import {
  parseThemePreference, resolveTheme, THEME_COLORS, THEME_INIT_SCRIPT,
} from './theme.ts'

test('unknown or corrupt theme preferences follow the system', () => {
  for (const value of [null, '', 'unknown', 'DARK', '{"theme":"dark"}', 'system']) {
    assert.equal(parseThemePreference(value), 'system')
  }
})

test('manual choices take priority over either system appearance', () => {
  for (const systemDark of [false, true]) {
    assert.equal(resolveTheme('light', systemDark), 'light')
    assert.equal(resolveTheme('dark', systemDark), 'dark')
  }
  assert.equal(resolveTheme('system', false), 'light')
  assert.equal(resolveTheme('system', true), 'dark')
})

test('pre-paint script agrees with runtime for absent, invalid, and manual preferences', () => {
  for (const stored of [null, '', 'broken', 'light', 'dark', 'system']) {
    for (const systemDark of [false, true]) {
      const root = { dataset: {} as Record<string, string>, style: { colorScheme: '' } }
      let chromeColor = ''
      runInNewContext(THEME_INIT_SCRIPT, {
        localStorage: { getItem: () => stored },
        matchMedia: () => ({ matches: systemDark }),
        document: {
          documentElement: root,
          querySelector: () => ({ setAttribute: (_: string, color: string) => { chromeColor = color } }),
        },
      })
      const expected = resolveTheme(parseThemePreference(stored), systemDark)
      assert.equal(root.dataset.theme, expected)
      assert.equal(root.style.colorScheme, expected)
      assert.equal(chromeColor, THEME_COLORS[expected])
    }
  }
})

test('blocked storage and missing browser chrome metadata do not break first paint', () => {
  const root = { dataset: {} as Record<string, string>, style: { colorScheme: '' } }
  const meta = { name: '', setAttribute: (_: string, color: string) => { assert.equal(color, THEME_COLORS.dark) } }
  let appended = false
  runInNewContext(THEME_INIT_SCRIPT, {
    get localStorage() { throw new Error('SecurityError') },
    matchMedia: () => ({ matches: true }),
    document: {
      documentElement: root,
      querySelector: () => null,
      createElement: () => meta,
      head: { appendChild: () => { appended = true } },
    },
  })
  assert.equal(root.dataset.theme, 'dark')
  assert.equal(meta.name, 'theme-color')
  assert.equal(appended, true)
})
