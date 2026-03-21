'use client'

type Props = {
  message: string
  effectiveFocus: number
  returnCount: number
  progressLabel?: string | null
  stateLabel?: string | null
}

export default function GrowthEchoCard({
  message,
  effectiveFocus,
  returnCount,
  progressLabel,
  stateLabel,
}: Props) {
  const chips = [
    { label: '今日投入', value: `${effectiveFocus.toFixed(1)}h` },
    { label: '回归次数', value: `${returnCount}` },
    progressLabel ? { label: '主线推进', value: progressLabel } : null,
    stateLabel ? { label: '状态标签', value: stateLabel } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>

  return (
    <div className="float-card glow-honey growth-echo-card">
      <div className="chart-header">
        <div>
          <div className="chart-title">今日回声</div>
          <div className="chart-subtitle">基于今天的成长记录生成的反馈</div>
        </div>
      </div>
      <p className="growth-echo-message">{message}</p>
      <div className="growth-echo-chips">
        {chips.map((chip) => (
          <div key={`${chip.label}-${chip.value}`} className="growth-echo-chip">
            <span className="growth-echo-chip-label">{chip.label}</span>
            <span className="growth-echo-chip-value">{chip.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
