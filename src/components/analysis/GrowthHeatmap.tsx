'use client'

import type { HeatmapCell } from '@/lib/analysis/growth-metrics'

type Props = {
  cells: HeatmapCell[]
}

export default function GrowthHeatmap({ cells }: Props) {
  return (
    <div className="float-card glow-coral growth-heatmap-card">
      <div className="chart-header">
        <div>
          <div className="chart-title">成长热力图</div>
          <div className="chart-subtitle">最近一段时间里，你留下成长证据的密度</div>
        </div>
      </div>
      <div className="growth-heatmap-grid">
        {cells.map((cell) => (
          <div
            key={cell.date}
            className={`growth-heatmap-cell intensity-${cell.score}`}
            title={`${cell.date} · 强度 ${cell.score}`}
          />
        ))}
      </div>
      <div className="growth-heatmap-legend">
        <span>少</span>
        <span className="growth-heatmap-cell intensity-1" />
        <span className="growth-heatmap-cell intensity-2" />
        <span className="growth-heatmap-cell intensity-3" />
        <span className="growth-heatmap-cell intensity-4" />
        <span>多</span>
      </div>
    </div>
  )
}
