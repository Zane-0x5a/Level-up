'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

type Record = { date: string; ibetter_count: number }

type Props = {
  records: Record[]
}

export default function IBetterTrendChart({ records }: Props) {
  const data = [...records]
    .reverse()
    .map(r => ({
      date: r.date.slice(5),
      count: r.ibetter_count ?? 0,
    }))

  if (data.length === 0) {
    return (
      <div className="glass-2 p-4">
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--color-text)' }}>iBetter 趋势</h3>
        <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-3)' }}>暂无数据</p>
      </div>
    )
  }

  return (
    <div className="glass-2 p-4">
      <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--color-text)' }}>iBetter 趋势</h3>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-3)' }} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-3)' }} width={30} />
          <Tooltip
            contentStyle={{
              background: 'rgba(255,255,255,0.9)',
              border: 'none',
              borderRadius: 10,
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="var(--color-purple)"
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--color-purple)' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
