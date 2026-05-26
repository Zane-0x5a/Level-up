type Vec3 = { x: number | null; y: number | null; z: number | null }

export type MotionSample = {
  acceleration?: Vec3 | null
}

export type MotionDetectorEvents = {
  onPickup?: () => void
  onPutdown?: () => void
}

export type MotionDetectorOptions = {
  pickupThreshold?: number
  pickupHoldMs?: number
  putdownThreshold?: number
  putdownHoldMs?: number
  initialState?: 'down' | 'up'
  clock?: () => number
}

export type MotionDetector = {
  feed: (sample: MotionSample) => void
  stop: () => void
  getState: () => 'down' | 'up'
}

const DEFAULTS = {
  pickupThreshold: 2.0,
  pickupHoldMs: 100,
  putdownThreshold: 0.3,
  putdownHoldMs: 2_000,
}

function magnitude(sample: MotionSample): number | null {
  const acc = sample.acceleration
  if (!acc) return null
  const { x, y, z } = acc
  if (
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    typeof z !== 'number'
  ) {
    return null
  }
  return Math.sqrt(x * x + y * y + z * z)
}

export function createMotionDetector(
  events: MotionDetectorEvents,
  options: MotionDetectorOptions = {},
): MotionDetector {
  const pickupThreshold = options.pickupThreshold ?? DEFAULTS.pickupThreshold
  const pickupHoldMs = options.pickupHoldMs ?? DEFAULTS.pickupHoldMs
  const putdownThreshold = options.putdownThreshold ?? DEFAULTS.putdownThreshold
  const putdownHoldMs = options.putdownHoldMs ?? DEFAULTS.putdownHoldMs
  const clock = options.clock ?? Date.now

  let state: 'down' | 'up' = options.initialState ?? 'down'
  let pickupSince: number | null = null
  let putdownSince: number | null = null
  let stopped = false

  return {
    feed(sample) {
      if (stopped) return
      const m = magnitude(sample)
      if (m === null) return
      const now = clock()

      if (m > pickupThreshold) {
        if (pickupSince === null) pickupSince = now
        putdownSince = null
        if (state === 'down' && now - pickupSince >= pickupHoldMs) {
          state = 'up'
          events.onPickup?.()
        }
      } else if (m < putdownThreshold) {
        if (putdownSince === null) putdownSince = now
        pickupSince = null
        if (state === 'up' && now - putdownSince >= putdownHoldMs) {
          state = 'down'
          events.onPutdown?.()
        }
      } else {
        pickupSince = null
        putdownSince = null
      }
    },
    stop() {
      stopped = true
    },
    getState() {
      return state
    },
  }
}

type DeviceMotionEventCtor = {
  new (...args: unknown[]): unknown
  requestPermission?: () => Promise<'granted' | 'denied'>
}

export type MotionPermissionResult = 'granted' | 'denied' | 'unavailable'

export async function requestMotionPermission(): Promise<MotionPermissionResult> {
  if (typeof window === 'undefined') return 'unavailable'
  const ctor = (window as unknown as { DeviceMotionEvent?: DeviceMotionEventCtor })
    .DeviceMotionEvent
  if (!ctor) return 'unavailable'
  if (typeof ctor.requestPermission !== 'function') {
    return 'granted'
  }
  try {
    const result = await ctor.requestPermission()
    return result === 'granted' ? 'granted' : 'denied'
  } catch {
    return 'denied'
  }
}

export function attachMotionListener(detector: MotionDetector): () => void {
  if (typeof window === 'undefined') return () => undefined
  const handler = (event: DeviceMotionEvent) => {
    detector.feed({ acceleration: event.acceleration ?? null })
  }
  window.addEventListener('devicemotion', handler)
  return () => {
    window.removeEventListener('devicemotion', handler)
    detector.stop()
  }
}
