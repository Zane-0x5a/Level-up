'use client'

import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

type Record = {
  date: string
  focus_in_class: number
  focus_out_class: number
  entertainment: number
}

type Props = {
  records: Record[]
}

export default function FocusTimeTrendChart({ records }: Props) {
  // Take last 7 records, show in chronological order
  const recent = [...records].reverse().slice(-7)
  const data = recent.map(r => ({
    date: r.date.slice(5), // MM-DD
    total: (r.focus_in_class ?? 0) + (r.focus_out_class ?? 0) + (r.entertainment ?? 0),
  }))

  if (data.length === 0) {
    return (
      <div className="float-card glow-coral">
        <div className="chart-empty">暂无趋势数据</div>
      </div>
    )
  }

  return (
    <div className="float-card glow-coral">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="coralGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d4654a" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#d4654a" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(43,45,66,0.04)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#a3a9b8', fontFamily: 'DM Mono, monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#a3a9b8', fontFamily: 'DM Mono, monospace' }}
            width={36}
            axisLine={false}
            tickLine={false}
            unit="h"
          />
          <Tooltip
            formatter={(value) => [`${Number(value).toFixed(1)}h`, '专注时长']}
            contentStyle={{
              background: '#fff',
              border: '1px solid rgba(43,45,66,0.06)',
              borderRadius: 10,
              fontSize: 12,
              fontFamily: 'var(--font-body)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#d4654a"
            strokeWidth={2.5}
            fill="url(#coralGrad)"
            dot={{ r: 4, fill: '#d4654a', stroke: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#d4654a', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
