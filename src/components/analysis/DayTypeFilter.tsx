'use client'

type Props = {
  value: 'all' | 'study_day' | 'rest_day'
  onChange: (v: 'all' | 'study_day' | 'rest_day') => void
}

const options = [
  { value: 'all' as const, label: '全部' },
  { value: 'study_day' as const, label: '学习日' },
  { value: 'rest_day' as const, label: '休息日' },
]

export default function DayTypeFilter({ value, onChange }: Props) {
  return (
    <div className="analysis-filters">
      {options.map(opt => (
        <button
          type="button"
          aria-pressed={value === opt.value}
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`pill${value === opt.value ? ' active' : ''}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
