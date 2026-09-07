export const DEFAULT_GREETINGS = [
  '今天，想学点什么？',
  '给喜欢的事，留一点时间。',
  '从感兴趣的地方开始。',
  '这一会儿，专心做自己的事。',
  '不赶进度，把这一页读懂。',
]

const LEGACY_GREETINGS = ['保持热爱，奔赴山海', '每一步都算数', '今天也要加油']

export function parseGreetings(stored: string | null): string[] {
  if (!stored) return [...DEFAULT_GREETINGS]
  try {
    const value: unknown = JSON.parse(stored)
    if (!Array.isArray(value)) return [...DEFAULT_GREETINGS]
    const greetings = value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
    // Upgrade only the former built-in set; user-authored collections stay intact.
    if (greetings.length === LEGACY_GREETINGS.length && LEGACY_GREETINGS.every((text) => greetings.includes(text))) {
      return [...DEFAULT_GREETINGS]
    }
    return greetings
  } catch {
    return [...DEFAULT_GREETINGS]
  }
}
