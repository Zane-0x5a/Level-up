'use client'

import { differenceInDays, parseISO, format } from 'date-fns'

const GLOW_CYCLE = ['coral', 'sage', 'honey'] as const
const EMOJI_CYCLE = ['\uD83C\uDFAF', '\uD83D\uDCDD', '\u2600\uFE0F'] // target, memo, sun

type Props = {
  id: string
  label: string
  targetDate: string
  index: number
}

export default function CountdownCard({ label, targetDate, index }: Props) {
  const days = Math.max(0, differenceInDays(parseISO(targetDate), new Date()))
  const color = GLOW_CYCLE[index % 3]
  const emoji = EMOJI_CYCLE[index % 3]
  const formattedDate = format(parseISO(targetDate), 'yyyy.MM.dd')
  const paddedDays = String(days).padStart(3, '0')

  return (
    <div className={`float-card glow-${color} cd-card`}>
      <span className="cd-icon">{emoji}</span>
      <div className={`cd-pill ${color}`}>
        <div className="cd-number">{paddedDays}</div>
      </div>
      <div className="cd-unit">{'\u5929'}</div>
      <div className="cd-label">{label}</div>
      <div className="cd-target">{formattedDate}</div>
    </div>
  )
}
