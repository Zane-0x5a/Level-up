'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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
  const recent = [...records].reverse().slice(-7)
  const data = recent.map((record) => ({
    date: record.date.slice(5),
    effectiveFocus: (record.focus_in_class ?? 0) + (record.focus_out_class ?? 0),
    entertainment: record.entertainment ?? 0,
  }))

  if (data.length === 0) {
    return (
      <div className="float-card glow-coral">
        <div className="chart-header">
          <div>
            <div className="chart-title">成长曲线</div>
            <div className="chart-subtitle">最近 7 天的有效投入</div>
          </div>
        </div>
        <div className="chart-empty">先开始记录，曲线就会慢慢出现。</div>
      </div>
    )
  }

  return (
    <div className="float-card glow-coral">
      <div className="chart-header">
        <div>
          <div className="chart-title">成长曲线</div>
          <div className="chart-subtitle">主线看有效投入，副线看娱乐消耗</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d4654a" stopOpacity={0.24} />
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
            formatter={(value, key) => [
              `${Number(value).toFixed(1)}h`,
              key === 'effectiveFocus' ? '有效投入' : '娱乐消耗',
            ]}
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
            dataKey="effectiveFocus"
            stroke="#d4654a"
            strokeWidth={2.5}
            fill="url(#focusGrad)"
            dot={{ r: 4, fill: '#d4654a', stroke: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#d4654a', stroke: '#fff', strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="entertainment"
            stroke="#a3a9b8"
            strokeWidth={1.8}
            strokeDasharray="4 4"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
