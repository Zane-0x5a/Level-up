'use client'

import type { EchoChip, EchoOutput } from '@/lib/analysis/echo'

type Props = {
  echo: EchoOutput
}

export default function GrowthEchoCard({ echo }: Props) {
  return (
    <div className="float-card glow-honey growth-echo-card">
      <div className="chart-header">
        <div>
          <div className="chart-title">今日回声</div>
          <div className="chart-subtitle">把数据放回身体的语言里</div>
        </div>
      </div>
      <div className="growth-echo-narrative">
        {echo.narrative.map((line, index) => (
          <p key={`${index}-${line}`} className="growth-echo-line">
            {line}
          </p>
        ))}
      </div>
      <div className="growth-echo-chips">
        {echo.chips.map((chip: EchoChip) => (
          <div key={`${chip.label}-${chip.value}`} className="growth-echo-chip">
            <span className="growth-echo-chip-label">{chip.label}</span>
            <span className="growth-echo-chip-value">{chip.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
