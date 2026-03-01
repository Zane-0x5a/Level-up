'use client'

import { differenceInDays, parseISO } from 'date-fns'
import { X } from 'lucide-react'

type Props = {
  id: string
  label: string
  targetDate: string
  onDelete: (id: string) => void
}

export default function CountdownCard({ id, label, targetDate, onDelete }: Props) {
  const days = differenceInDays(parseISO(targetDate), new Date())

  return (
    <div className="glass-1 p-4 flex justify-between items-center">
      <div>
        <p style={{ color: 'var(--color-text-2)', fontSize: '0.85rem' }}>{label}</p>
        <p className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          {days}
          <span className="text-sm ml-1 font-normal" style={{ color: 'var(--color-text-3)' }}>天</span>
        </p>
      </div>
      <button
        onClick={() => onDelete(id)}
        className="p-2 rounded-full transition-colors duration-300"
        style={{ color: 'var(--color-text-3)' }}
        aria-label={`删除 ${label}`}
      >
        <X size={16} />
      </button>
    </div>
  )
}
