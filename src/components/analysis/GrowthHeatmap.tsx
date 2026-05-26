'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  buildHeatmap,
  DIMENSION_ORDER,
  DIMENSIONS,
  type HeatmapCell,
  type HeatmapDimension,
} from '@/lib/analysis/heatmap'
import type { GrowthPreferencesLite, GrowthRecord } from '@/lib/analysis/growth-metrics'

type Props = {
  records: GrowthRecord[]
  preferences: GrowthPreferencesLite
  days?: number
}

type TooltipPosition = {
  x: number
  y: number
  placement: 'top' | 'bottom'
}

const TOOLTIP_WIDTH = 240
const TOOLTIP_GAP = 8

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

function formatDateLabel(key: string): string {
  const [, m, d] = key.split('-')
  return `${Number(m)} 月 ${Number(d)} 日`
}

function describeCellValue(cell: HeatmapCell, dimension: HeatmapDimension): string {
  if (!cell.record) return '没有记录'
  const config = DIMENSIONS[dimension]
  const description = config.describe(cell.record)
  const formatted = config.format(cell.value)
  if (description && formatted) return `${formatted} · ${description}`
  return description ?? formatted ?? '没有记录'
}

export default function GrowthHeatmap({ records, preferences, days = 90 }: Props) {
  const [dimension, setDimension] = useState<HeatmapDimension>('overview')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const data = useMemo(
    () => buildHeatmap(records, dimension, preferences, days),
    [records, dimension, preferences, days],
  )

  const selectedCell = useMemo(() => {
    if (!selectedDate) return null
    return data.cells.find((c) => c.date === selectedDate) ?? null
  }, [data, selectedDate])

  useEffect(() => {
    if (!selectedDate) return
    const handle = (event: MouseEvent | TouchEvent) => {
      const node = containerRef.current
      if (!node) return
      if (event.target instanceof Node && node.contains(event.target)) return
      setSelectedDate(null)
      setTooltipPos(null)
    }
    document.addEventListener('mousedown', handle)
    document.addEventListener('touchstart', handle)
    return () => {
      document.removeEventListener('mousedown', handle)
      document.removeEventListener('touchstart', handle)
    }
  }, [selectedDate])

  const handleCellActivate = (
    cell: HeatmapCell,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (!cell.isInWindow) return
    if (selectedDate === cell.date) {
      setSelectedDate(null)
      setTooltipPos(null)
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const cellRect = event.currentTarget.getBoundingClientRect()
    const canvasRect = canvas.getBoundingClientRect()

    const cellCenterX = cellRect.left + cellRect.width / 2 - canvasRect.left
    const cellTop = cellRect.top - canvasRect.top
    const cellBottom = cellRect.bottom - canvasRect.top

    const placement: 'top' | 'bottom' =
      cellRect.top + cellRect.height / 2 - canvasRect.top > canvasRect.height / 2
        ? 'top'
        : 'bottom'

    const halfWidth = TOOLTIP_WIDTH / 2
    const x = Math.max(halfWidth, Math.min(canvasRect.width - halfWidth, cellCenterX))
    const y = placement === 'bottom' ? cellBottom + TOOLTIP_GAP : cellTop - TOOLTIP_GAP

    setSelectedDate(cell.date)
    setTooltipPos({ x, y, placement })
  }

  return (
    <div className="float-card glow-coral heatmap-card" ref={containerRef}>
      <div className="chart-header">
        <div>
          <div className="chart-title">成长热力图</div>
          <div className="chart-subtitle">
            过去 {days} 天 · 与你自己的分布对比{data.hasFallback ? '（数据较少，按对数刻度兜底）' : ''}
          </div>
        </div>
      </div>

      <div className="heatmap-chips" role="tablist" aria-label="切换热力图维度">
        {DIMENSION_ORDER.map((key) => {
          const config = DIMENSIONS[key]
          const active = key === dimension
          return (
            <button
              key={key}
              role="tab"
              aria-selected={active}
              type="button"
              className={`heatmap-chip${active ? ' active' : ''}${active ? ` tone-${config.tone}` : ''}`}
              onClick={() => {
                setDimension(key)
                setSelectedDate(null)
                setTooltipPos(null)
              }}
            >
              {config.label}
            </button>
          )
        })}
      </div>

      <div
        className="heatmap-canvas"
        ref={canvasRef}
        style={{ ['--heatmap-weeks' as string]: data.weekCount }}
      >
        <div className="heatmap-months" aria-hidden="true">
          {data.months.map((month) => (
            <span
              key={`${month.label}-${month.weekIndex}`}
              className="heatmap-month-label"
              style={{ gridColumnStart: month.weekIndex + 1 }}
            >
              {month.label}
            </span>
          ))}
        </div>

        <div className="heatmap-body">
          <div className="heatmap-weekdays" aria-hidden="true">
            {WEEKDAY_LABELS.map((label, i) => (
              <span key={label} className={`heatmap-weekday weekday-${i}`}>
                {i % 2 === 1 ? label : ''}
              </span>
            ))}
          </div>

          <div className="heatmap-grid" role="grid" aria-label="成长强度网格">
            {data.cells.map((cell) => {
              if (cell.isPlaceholder) {
                return (
                  <span
                    key={cell.date}
                    className="heatmap-cell placeholder"
                    aria-hidden="true"
                  />
                )
              }
              const intensityClass =
                cell.intensity > 0 ? `intensity-${cell.intensity}` : 'intensity-0'
              const classes = [
                'heatmap-cell',
                `tone-${data.tone}`,
                intensityClass,
                cell.isToday ? 'today' : '',
                selectedDate === cell.date ? 'selected' : '',
              ]
                .filter(Boolean)
                .join(' ')
              return (
                <button
                  key={cell.date}
                  type="button"
                  className={classes}
                  onClick={(event) => handleCellActivate(cell, event)}
                  aria-label={`${formatDateLabel(cell.date)} ${describeCellValue(cell, dimension)}`}
                />
              )
            })}
          </div>
        </div>

        {selectedCell && tooltipPos && (
          <div
            className={`heatmap-tooltip placement-${tooltipPos.placement}`}
            role="status"
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y}px`,
              width: `${TOOLTIP_WIDTH}px`,
            }}
          >
            <div className="heatmap-tooltip-date">
              {formatDateLabel(selectedCell.date)}
              {selectedCell.record?.day_type === 'rest_day' ? ' · 休息日' : ''}
            </div>
            {selectedCell.record ? (
              <ul className="heatmap-tooltip-list">
                {DIMENSION_ORDER.map((key) => {
                  const config = DIMENSIONS[key]
                  const v = config.extract(selectedCell.record!, preferences)
                  if (v <= 0) return null
                  const description = config.describe(selectedCell.record!)
                  return (
                    <li key={key}>
                      <span className="heatmap-tooltip-label">{config.label}</span>
                      <span className="heatmap-tooltip-value">
                        {description ?? config.format(v)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="heatmap-tooltip-empty">这天没有留下记录</div>
            )}
          </div>
        )}
      </div>

      <div className="heatmap-legend">
        <span>少</span>
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`heatmap-cell tone-${data.tone} intensity-${i} legend-cell`}
          />
        ))}
        <span>多</span>
      </div>
    </div>
  )
}
