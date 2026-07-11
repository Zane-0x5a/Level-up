export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getMillisecondsUntilNextLocalDay(date = new Date()): number {
  const nextDay = new Date(date)
  nextDay.setHours(24, 0, 0, 0)
  return Math.max(0, nextDay.getTime() - date.getTime())
}
