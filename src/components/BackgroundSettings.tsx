'use client'

import { Blend, Square, Waves } from 'lucide-react'
import { setBackgroundPreference, useBackground } from '@/hooks/useBackground'

const backgrounds = [
  { value: 'mesh', label: '流动', Icon: Blend },
  { value: 'grain', label: '颗粒', Icon: Waves },
  { value: 'static', label: '静态', Icon: Square },
] as const

export default function BackgroundSettings() {
  const preference = useBackground()

  return (
    <section className="theme-settings settings-section anim" aria-labelledby="background-heading">
      <h2 id="background-heading" className="sec-name">背景</h2>
      <fieldset className="theme-options">
        <legend className="sr-only">页面背景</legend>
        {backgrounds.map(({ value, label, Icon }) => (
          <label key={value} className="theme-option">
            <input
              type="radio"
              name="background"
              value={value}
              checked={preference === value}
              onChange={() => setBackgroundPreference(value)}
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
