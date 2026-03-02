'use client'
import { differenceInDays, parseISO } from 'date-fns'

type Props = {
  id: string
  label: string
  targetDate: string
  index: number
  animate?: boolean
}

export default function CountdownCard({ targetDate, index, animate }: Props) {
  const days = Math.max(0, differenceInDays(parseISO(targetDate), new Date()))
  const paddedDays = String(days).padStart(3, '0')

  return (
    <>
      <div className={`cd-number ${animate ? 'cd-number-anim' : ''}`}>{paddedDays}</div>
      <div className="cd-unit">天</div>
    </>
  )
}
