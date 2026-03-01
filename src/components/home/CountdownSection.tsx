'use client'

import { useState, useEffect, useCallback } from 'react'
import { getCountdowns } from '@/lib/api/countdowns'
import CountdownCard from './CountdownCard'

type Countdown = { id: string; label: string; target_date: string }

export default function CountdownSection() {
  const [items, setItems] = useState<Countdown[]>([])

  const load = useCallback(async () => {
    try {
      const data = await getCountdowns()
      setItems(data ?? [])
    } catch {
      setItems([])
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <section className="section anim d1">
      <div className="sec-head">
        <div className="sec-dot coral" />
        <div className="sec-name">{'\u5012\u8BA1\u65F6'}</div>
      </div>
      <div className="cd-grid">
        {items.map((item, i) => (
          <CountdownCard
            key={item.id}
            id={item.id}
            label={item.label}
            targetDate={item.target_date}
            index={i}
          />
        ))}
        {items.length === 0 && (
          <>
            {/* Empty state placeholder cards */}
            {[0, 1, 2].map(i => (
              <div key={i} className={`float-card glow-${['coral', 'sage', 'honey'][i]} cd-card`}>
                <span className="cd-icon" style={{ opacity: 0.3 }}>
                  {['\uD83C\uDFAF', '\uD83D\uDCDD', '\u2600\uFE0F'][i]}
                </span>
                <div className={`cd-pill ${['coral', 'sage', 'honey'][i]}`}>
                  <div className="cd-number" style={{ opacity: 0.2 }}>---</div>
                </div>
                <div className="cd-unit">{'\u5929'}</div>
                <div className="cd-label" style={{ opacity: 0.3 }}>
                  {'\u6682\u65E0\u5012\u8BA1\u65F6'}
                </div>
                <div className="cd-target" style={{ opacity: 0.2 }}>----.--.--</div>
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  )
}
