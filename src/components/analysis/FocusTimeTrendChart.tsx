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
            <div className="chart-title">专注时长</div>
            <div className="chart-subtitle">最近 7 次记录</div>
          </div>
        </div>
        <div className="chart-empty">这段时间还没有专注记录。</div>
      </div>
    )
  }

  return (
    <div className="float-card glow-coral">
      <div className="chart-header">
        <div>
          <div className="chart-title">专注时长</div>
          <div className="chart-subtitle">最近 7 次记录</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-coral)" stopOpacity={0.24} />
              <stop offset="95%" stopColor="var(--color-coral)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: 'var(--color-text-3)', fontFamily: 'DM Mono, monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--color-text-3)', fontFamily: 'DM Mono, monospace' }}
            width={52}
            axisLine={false}
            tickLine={false}
            unit="h"
          />
          <Tooltip
            formatter={(value, key) => [
              `${Number(value).toFixed(1)}h`,
              key === 'effectiveFocus' ? '专注时长' : '休闲时间',
            ]}
            contentStyle={{
              background: 'var(--color-card)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              borderRadius: 10,
              fontSize: 12,
              fontFamily: 'var(--font-body)',
              boxShadow: 'var(--shadow-md)',
            }}
          />
          <Area
            type="monotone"
            dataKey="effectiveFocus"
            stroke="var(--color-coral)"
            strokeWidth={2.5}
            fill="url(#focusGrad)"
            dot={{ r: 4, fill: 'var(--color-coral)', stroke: 'var(--color-card)', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: 'var(--color-coral)', stroke: 'var(--color-card)', strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="entertainment"
            stroke="var(--color-text-3)"
            strokeWidth={1.8}
            strokeDasharray="4 4"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
