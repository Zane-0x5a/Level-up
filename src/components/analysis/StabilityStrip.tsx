'use client'

import type { StabilityPoint } from '@/lib/analysis/growth-metrics'

type Props = {
  points: StabilityPoint[]
}

const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六']

function getWeekdayFromDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const day = new Date(y, m - 1, d).getDay()
  return WEEKDAY_NAMES[day]
}

function formatRange(points: StabilityPoint[]) {
  if (points.length === 0) return ''
  const first = points[0].date.slice(5).replace('-', '/')
  const last = points[points.length - 1].date.slice(5).replace('-', '/')
  return `${first} – ${last}`
}

export default function StabilityStrip({ points }: Props) {
  const baselineCount = points.filter((p) => p.reachedBaseline).length
  const evidenceOnly = points.filter((p) => p.hasEvidence && !p.reachedBaseline).length
  const emptyCount = points.filter((p) => !p.hasEvidence).length

  // Derive weekday headers from the first 7 points (first row)
  const weekdayHeaders = points.slice(0, 7).map((p) => getWeekdayFromDate(p.date))

  return (
    <div className="float-card glow-sage stability-card">
      <div className="chart-header">
        <div>
          <div className="chart-title">成长节律</div>
          <div className="chart-subtitle">
            最近 14 天的成长基准达成情况 · {formatRange(points)}
          </div>
        </div>
      </div>

      <div className="stability-stats">
        <span className="stability-stat-pill baseline">
          <span className="stability-stat-num">{baselineCount}</span> 达标
        </span>
        {evidenceOnly > 0 && (
          <span className="stability-stat-pill evidence">
            <span className="stability-stat-num">{evidenceOnly}</span> 留痕
          </span>
        )}
        {emptyCount > 0 && (
          <span className="stability-stat-pill empty">
            <span className="stability-stat-num">{emptyCount}</span> 空白
          </span>
        )}
      </div>

      <div className="stability-grid-wrap">
        <div className="stability-weekday-row">
          {weekdayHeaders.map((d, i) => (
            <span key={i} className="stability-weekday">{d}</span>
          ))}
        </div>
        <div className="stability-grid" aria-label="最近14天成长节律">
          {points.map((point) => {
            const state = point.reachedBaseline
              ? 'baseline'
              : point.hasEvidence
                ? 'evidence'
                : 'empty'
            const label = point.reachedBaseline
              ? '达到基准'
              : point.hasEvidence
                ? '留下痕迹'
                : '暂无记录'

            return (
              <div
                key={point.date}
                className={`stability-cell ${state}`}
                title={`${point.date} · ${label}`}
              />
            )
          })}
        </div>
      </div>

      <div className="stability-legend">
        <span className="stability-legend-label">基准：1h+ 有效投入或留下进展记录</span>
      </div>
    </div>
  )
}
