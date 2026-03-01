'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { getCountdowns, addCountdown, deleteCountdown } from '@/lib/api/countdowns'
import CountdownCard from './CountdownCard'

type Countdown = { id: string; label: string; target_date: string }

export default function CountdownSection() {
  const [items, setItems] = useState<Countdown[]>([])
  const [showForm, setShowForm] = useState(false)
  const [label, setLabel] = useState('')
  const [date, setDate] = useState('')

  const load = useCallback(async () => {
    const data = await getCountdowns()
    setItems(data ?? [])
  }, [])

  useEffect(() => { load() }, [load])

  const handleAdd = async () => {
    if (!label.trim() || !date) return
    await addCountdown(label.trim(), date)
    setLabel('')
    setDate('')
    setShowForm(false)
    load()
  }

  const handleDelete = async (id: string) => {
    await deleteCountdown(id)
    load()
  }

  return (
    <section className="space-y-3 animate-in delay-1">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
          倒计时
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="glass-3 p-2 transition-transform duration-300"
          style={{ borderRadius: 'var(--radius-glass-xs)' }}
          aria-label="新增倒计时"
        >
          <Plus size={16} style={{ color: 'var(--color-accent)' }} />
        </button>
      </div>

      {showForm && (
        <div className="glass-2 p-4 space-y-3 animate-in">
          <input
            type="text"
            placeholder="标签（如：期末考试）"
            value={label}
            onChange={e => setLabel(e.target.value)}
            className="w-full px-3 py-2 text-sm outline-none"
            style={{
              background: 'var(--color-glass-input)',
              borderRadius: 'var(--radius-glass-xs)',
              color: 'var(--color-text)',
            }}
          />
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full px-3 py-2 text-sm outline-none"
            style={{
              background: 'var(--color-glass-input)',
              borderRadius: 'var(--radius-glass-xs)',
              color: 'var(--color-text)',
            }}
          />
          <button
            onClick={handleAdd}
            className="w-full py-2 text-sm font-medium text-white"
            style={{
              background: 'var(--color-accent)',
              borderRadius: 'var(--radius-glass-sm)',
              transition: 'all 0.4s var(--ease-spring)',
            }}
          >
            添加
          </button>
        </div>
      )}

      <div className="space-y-2">
        {items.map(item => (
          <CountdownCard
            key={item.id}
            id={item.id}
            label={item.label}
            targetDate={item.target_date}
            onDelete={handleDelete}
          />
        ))}
        {items.length === 0 && !showForm && (
          <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-3)' }}>
            还没有倒计时，点击 + 添加
          </p>
        )}
      </div>
    </section>
  )
}
