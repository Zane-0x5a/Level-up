'use client'

type Props = {
  value: 'all' | 'study_day' | 'rest_day'
  onChange: (v: 'all' | 'study_day' | 'rest_day') => void
}

const options = [
  { value: 'all' as const, label: '全部' },
  { value: 'study_day' as const, label: '学习日' },
  { value: 'rest_day' as const, label: '休假日' },
]

export default function DayTypeFilter({ value, onChange }: Props) {
  return (
    <div className="flex gap-2">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className="px-4 py-1.5 text-sm font-medium transition-all duration-300"
          style={{
            borderRadius: 'var(--radius-pill)',
            background: value === opt.value ? 'var(--color-accent)' : 'var(--color-glass-3)',
            color: value === opt.value ? '#fff' : 'var(--color-text-2)',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
