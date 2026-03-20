'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

type Props = {
  inClass: number
  outClass: number
  entertainment: number
}

const COLORS = ['#d4654a', '#5b9279', '#a3a9b8']

export default function FocusTimePieChart({ inClass, outClass, entertainment }: Props) {
  const data = [
    { name: '课内投入', value: inClass },
    { name: '课外投入', value: outClass },
    { name: '娱乐消耗', value: entertainment },
  ].filter((item) => item.value > 0)

  if (data.length === 0) {
    return (
      <div className="float-card glow-sage">
        <div className="chart-header">
          <div>
            <div className="chart-title">时间结构</div>
            <div className="chart-subtitle">看看时间被分配到了哪里</div>
          </div>
        </div>
        <div className="chart-empty">还没有足够的数据来展示结构。</div>
      </div>
    )
  }

  return (
    <div className="float-card glow-sage">
      <div className="chart-header">
        <div>
          <div className="chart-title">时间结构</div>
          <div className="chart-subtitle">当前筛选条件下的投入分布</div>
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
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index] ?? COLORS[0]} />
            ))}
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
        {data.map((item, index) => (
          <span key={item.name} className="chart-legend-item">
            <span className="chart-legend-dot" style={{ background: COLORS[index] ?? COLORS[0] }} />
            {item.name} ({item.value.toFixed(1)}h)
          </span>
        ))}
      </div>
    </div>
  )
}
