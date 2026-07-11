'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  getLocalDateString,
  getMillisecondsUntilNextLocalDay,
} from '@/lib/local-date'

export function useTodayDate(): string {
  const [today, setToday] = useState(() => getLocalDateString())
  const refreshToday = useCallback(() => {
    setToday(current => {
      const next = getLocalDateString()
      return current === next ? current : next
    })
  }, [])

  useEffect(() => {
    let midnightTimer: ReturnType<typeof setTimeout>

    const scheduleMidnightRefresh = () => {
      clearTimeout(midnightTimer)
      midnightTimer = setTimeout(() => {
        refreshToday()
        scheduleMidnightRefresh()
      }, getMillisecondsUntilNextLocalDay() + 1000)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshToday()
        scheduleMidnightRefresh()
      }
    }

    scheduleMidnightRefresh()
    window.addEventListener('pageshow', refreshToday)
    window.addEventListener('focus', refreshToday)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearTimeout(midnightTimer)
      window.removeEventListener('pageshow', refreshToday)
      window.removeEventListener('focus', refreshToday)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [refreshToday])

  return today
}
