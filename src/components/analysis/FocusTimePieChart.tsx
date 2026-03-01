'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

type Props = {
  inClass: number
  outClass: number
  entertainment: number
}

const COLORS = ['var(--color-accent)', 'var(--color-success)', 'var(--color-amber)']
const LABELS = ['课内投入', '课外投入', '娱乐消费']

export default function FocusTimePieChart({ inClass, outClass, entertainment }: Props) {
  const data = [
    { name: LABELS[0], value: inClass },
    { name: LABELS[1], value: outClass },
    { name: LABELS[2], value: entertainment },
  ].filter(d => d.value > 0)

  if (data.length === 0) {
    return (
      <div className="glass-2 p-4">
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--color-text)' }}>专注分布</h3>
        <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-3)' }}>暂无数据</p>
      </div>
    )
  }

  return (
    <div className="glass-2 p-4">
      <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--color-text)' }}>专注分布</h3>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={70}
            dataKey="value"
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => `${Number(value).toFixed(1)}h`}
            contentStyle={{
              background: 'rgba(255,255,255,0.9)',
              border: 'none',
              borderRadius: 10,
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 mt-2">
        {data.map((d, i) => (
          <span key={d.name} className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-2)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i], display: 'inline-block' }} />
            {d.name}
          </span>
        ))}
      </div>
    </div>
  )
}
