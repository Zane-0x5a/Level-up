'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { setThemePreference, useTheme } from '@/hooks/useTheme'

const themes = [
  { value: 'light', label: '浅色', Icon: Sun },
  { value: 'dark', label: '暗色', Icon: Moon },
  { value: 'system', label: '跟随系统', Icon: Monitor },
] as const

export default function ThemeSettings() {
  const preference = useTheme()

  return (
    <section className="theme-settings settings-section anim" aria-labelledby="appearance-heading">
      <h2 id="appearance-heading" className="sec-name">外观</h2>
      <fieldset className="theme-options">
        <legend className="sr-only">主题模式</legend>
        {themes.map(({ value, label, Icon }) => (
          <label key={value} className="theme-option">
            <input
              type="radio"
              name="theme"
              value={value}
              checked={preference === value}
              onChange={() => setThemePreference(value)}
            />
            <span className="theme-option-label">
              <Icon size={18} strokeWidth={1.7} aria-hidden="true" />
              <span>{label}</span>
            </span>
          </label>
        ))}
      </fieldset>
    </section>
  )
}
