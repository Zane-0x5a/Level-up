'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

type Props = {
  inClass: number
  outClass: number
  entertainment: number
}

const COLORS = ['#d4654a', '#5b9279', '#a3a9b8']
const LABELS = ['课内投入', '课外投入', '娱乐消费']

export default function FocusTimePieChart({ inClass, outClass, entertainment }: Props) {
  const data = [
    { name: LABELS[0], value: inClass },
    { name: LABELS[1], value: outClass },
    { name: LABELS[2], value: entertainment },
  ].filter(d => d.value > 0)

  if (data.length === 0) {
    return (
      <div className="float-card glow-coral">
        <div className="chart-empty">暂无专注数据</div>
      </div>
    )
  }

  return (
    <div className="float-card glow-coral">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            dataKey="value"
            stroke="none"
            paddingAngle={3}
          >
            {data.map((entry, i) => {
              const colorIdx = LABELS.indexOf(entry.name)
              return <Cell key={i} fill={COLORS[colorIdx >= 0 ? colorIdx : i]} />
            })}
          </Pie>
          <Tooltip
            formatter={(value) => `${Number(value).toFixed(1)}h`}
            contentStyle={{
              background: '#fff',
              border: '1px solid rgba(43,45,66,0.06)',
              borderRadius: 10,
              fontSize: 12,
              fontFamily: 'var(--font-body)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="chart-legend">
        {data.map(d => {
          const colorIdx = LABELS.indexOf(d.name)
          return (
            <span key={d.name} className="chart-legend-item">
              <span
                className="chart-legend-dot"
                style={{ background: COLORS[colorIdx >= 0 ? colorIdx : 0] }}
              />
              {d.name} ({d.value.toFixed(1)}h)
            </span>
          )
        })}
      </div>
    </div>
  )
}
