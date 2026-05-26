type VoiceKey = string

const DEFAULT_KEY = 'default'

export const VOICE_LIBRARY: Record<VoiceKey, readonly string[]> = {
  // recovering · *
  'recovering::streak': [
    '节奏在，别给自己添重量。',
    '连续走过这几天的低空巡航，也算飞行。',
    '稳着走就够了。',
    '今晚早点睡，明天继续。',
  ],
  'recovering::state-persistence': [
    '在恢复里待着没什么不好。',
    '不勉强自己，今天就这样。',
    '把今天交给身体。',
  ],
  'recovering::state-transition': [
    '从恢复里慢慢探一只脚出来。',
    '别一下子推太猛，慢一点。',
  ],
  'recovering::focus-delta': [
    '今天少做一点不算损失。',
    '不必跟昨天的自己比。',
    '现在的少，是为了明天的多。',
  ],
  'recovering::default': [
    '今天先到这里。',
    '允许自己慢。',
    '看看自己，比追赶任何事都重要。',
  ],

  // steady · *
  'steady::streak': [
    '一天接一天，这就是节奏。',
    '稳得像水。',
    '不大不小，刚好。',
  ],
  'steady::state-persistence': [
    '稳的日子也是日子。',
    '在「稳住了」里别松。',
    '今天的位置很好。',
  ],
  'steady::state-transition': [
    '走起来了。',
    '今天比昨天再亮一点。',
  ],
  'steady::progress-rhythm': [
    '推进有了节奏，就别在意速度。',
    '日复一日地推一寸。',
  ],
  'steady::focus-delta': [
    '比昨天更靠近一些。',
    '今天的努力被记下了。',
  ],
  'steady::default': [
    '今天的样子已经很好。',
    '继续保持。',
    '走过今天就好。',
  ],

  // good · *
  'good::streak': [
    '今天也在状态里。',
    '连续地好，是把自己练出来了。',
    '保持，不必再追。',
  ],
  'good::state-persistence': [
    '今天接着昨天的能量。',
    '在状态里的时候，听一听自己想做什么。',
  ],
  'good::progress-rhythm': [
    '推进里有手感，就再走一寸。',
    '主线在动，已经够说明问题。',
  ],
  'good::focus-delta': [
    '今天比往常多走了一点。',
    '这一段的积累会留下。',
  ],
  'good::default': [
    '今天是好日子。',
    '把这种感觉记一下。',
    '继续。',
  ],

  // energized · *
  'energized::streak': [
    '势头在自己手里。',
    '连续的好时机，珍惜。',
  ],
  'energized::state-persistence': [
    '能量在身体里没走。',
    '今天可以多做一点，但别透支。',
  ],
  'energized::progress-rhythm': [
    '主线被推得动了。',
    '该收尾的也收一收。',
  ],
  'energized::focus-delta': [
    '今天确实比往常多。',
    '把多出来的能量也存一点。',
  ],
  'energized::default': [
    '继续保持就好。',
    '今天的能量被记下了。',
    '保留一点给明天。',
  ],

  // no state label · *
  'unknown::streak': [
    '一天接一天，已经走到了今天。',
    '没说状态也没关系，做完就好。',
  ],
  'unknown::progress-rhythm': [
    '主线一直在动。',
    '推进有节奏，就别在意速度。',
  ],
  'unknown::focus-delta': [
    '今天的努力被记下了。',
    '继续就行。',
  ],
  'unknown::note-rhythm': [
    '写下来本身就是一种推进。',
    '留下的痕迹会自己说话。',
  ],
  'unknown::default': [
    '走过今天就好。',
    '明天又是一个开始。',
    '不必赶。',
  ],

  // global fallback
  [DEFAULT_KEY]: [
    '走过今天就好。',
    '不必赶，慢一点也行。',
    '今天的样子已经被记下了。',
    '一天就是一天，已经够。',
    '继续。',
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
  return '继续。'
}
