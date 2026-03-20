'use client'

import type { GrowthAsset } from '@/lib/analysis/growth-metrics'

type Props = {
  assets: GrowthAsset[]
  streak: number
}

export default function GrowthAssetsGrid({ assets, streak }: Props) {
  const streakAsset: GrowthAsset = {
    label: '连续成长天数',
    value: `${streak}`,
    tone: 'sage',
  }

  const cards = [streakAsset, ...assets]

  return (
    <div className="growth-assets-grid">
      {cards.map((asset) => (
        <div key={`${asset.label}-${asset.value}`} className={`float-card glow-${asset.tone} asset-card`}>
          <div className="asset-label">{asset.label}</div>
          <div className="asset-value">{asset.value}</div>
        </div>
      ))}
    </div>
  )
}
