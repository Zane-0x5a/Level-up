type VoiceKey = string

const DEFAULT_KEY = 'default'

export const VOICE_LIBRARY: Record<VoiceKey, readonly string[]> = {
  'recovering::streak': [
    '今天可以少安排一些，给休息留个位置。',
    '不用为了连续记录，勉强自己多做。',
  ],
  'recovering::default': [
    '累的时候，事情可以分几次做。',
    '今天的安排，可以轻一点。',
  ],
  'steady::streak': [
    '这样的日常，值得留着慢慢回看。',
    '不必每天加量，按现在的安排继续就好。',
  ],
  'steady::progress-rhythm': [
    '记下做到哪儿了，下次就从这里接着做。',
    '还有没做完的部分，可以留给下一次。',
  ],
  'steady::default': [
    '按自己的安排，做完一件是一件。',
    '平常的一天，也有值得记住的事。',
  ],
  'good::progress-rhythm': [
    '今天弄明白的地方，值得记上一笔。',
    '记下这次是怎么做成的，下次也许用得上。',
  ],
  'good::default': [
    '今天有什么做得顺手的？留一句给以后的自己。',
    '有了新想法，可以趁还记得时写下来。',
  ],
  'energized::progress-rhythm': [
    '有了新进展，也给自己一点享受它的时间。',
    '这次想通的事，记下来就不容易忘。',
  ],
  'energized::default': [
    '趁有兴致，做点一直想试的事。',
    '今天什么最让你投入？值得留意一下。',
  ],
  'unknown::streak': [
    '回头看时，这些日子都找得到。',
    '有空翻翻前几天的记录，看看自己做过什么。',
  ],
  'unknown::progress-rhythm': [
    '记下做到哪儿了，下次就从这里接着做。',
    '具体做成了什么，也可以留一句笔记。',
  ],
  'unknown::note-rhythm': [
    '过些日子再读，也许会有新的想法。',
    '当时的想法，现在还有迹可循。',
  ],
  'unknown::default': [
    '有什么想留给明天的自己？',
    '学到的、没想通的，都可以写下来。',
  ],
  [DEFAULT_KEY]: [
    '有什么想留给明天的自己？',
    '学到的、没想通的，都可以写下来。',
  ],
}

export function pickVoice(
  stateBucket: string,
  dominantTag: string,
  rng: () => number = Math.random,
): string {
  const candidates: VoiceKey[] = [
    `${stateBucket}::${dominantTag}`,
    `${stateBucket}::default`,
    `unknown::${dominantTag}`,
    DEFAULT_KEY,
  ]
  for (const key of candidates) {
    const pool = VOICE_LIBRARY[key]
    if (pool && pool.length > 0) {
      const index = Math.min(Math.floor(rng() * pool.length), pool.length - 1)
      return pool[index]
    }
  }
  return VOICE_LIBRARY[DEFAULT_KEY][0]
}
