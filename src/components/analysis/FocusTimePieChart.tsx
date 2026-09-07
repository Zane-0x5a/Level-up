'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

type Props = {
  inClass: number
  outClass: number
  entertainment: number
}

export default function FocusTimePieChart({ inClass, outClass, entertainment }: Props) {
  const data = [
    { name: '课内投入', value: inClass, color: 'var(--color-coral)' },
    { name: '课外投入', value: outClass, color: 'var(--color-sage)' },
    { name: '休闲时间', value: entertainment, color: 'var(--color-text-3)' },
  ].filter((item) => item.value > 0)

  if (data.length === 0) {
    return (
      <div className="float-card glow-sage">
        <div className="chart-header">
          <div>
            <div className="chart-title">学习与休闲</div>
          </div>
        </div>
        <div className="chart-empty">这段时间还没有时长记录。</div>
      </div>
    )
  }

  return (
    <div className="float-card glow-sage">
      <div className="chart-header">
        <div>
          <div className="chart-title">学习与休闲</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={82}
            dataKey="value"
            stroke="none"
            paddingAngle={3}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => `${Number(value).toFixed(1)}h`}
            contentStyle={{
              background: 'var(--color-card)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              borderRadius: 10,
              fontSize: 12,
              fontFamily: 'var(--font-body)',
              boxShadow: 'var(--shadow-md)',
            }}
            itemStyle={{ color: 'var(--color-text)' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="chart-legend">
        {data.map((item) => (
          <span key={item.name} className="chart-legend-item">
            <span className="chart-legend-dot" style={{ background: item.color }} />
            {item.name} ({item.value.toFixed(1)}h)
          </span>
        ))}
      </div>
    </div>
  )
}
