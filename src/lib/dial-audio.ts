// Tiny WebAudio synth for the rotary dial's safe-deposit clicks. Everything
// is generated — no audio assets: a band-passed noise snap for the pawl
// strike plus a low sine thump for body. The context is created lazily inside
// a user gesture via primeDialAudio() so autoplay policies are satisfied.

let audioContext: AudioContext | null = null
let sharedNoiseBuffer: AudioBuffer | null = null
let lastTickAt = 0

export type DialClickKind = 'tick' | 'bound' | 'settle'

export function primeDialAudio(): void {
  if (typeof window === 'undefined') return
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return
  if (!audioContext) audioContext = new Ctor()
  if (audioContext.state === 'suspended') void audioContext.resume()
}

function getNoiseBuffer(context: AudioContext): AudioBuffer {
  if (sharedNoiseBuffer) return sharedNoiseBuffer
  const length = Math.floor(context.sampleRate * 0.08)
  const buffer = context.createBuffer(1, length, context.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
  sharedNoiseBuffer = buffer
  return buffer
}

// A single ratchet tooth: bright snap with slight random detune so repeated
// ticks sound mechanical rather than sampled, over a short low thump.
function strike(context: AudioContext, at: number, gain: number, frequency: number): void {
  const snap = context.createBufferSource()
  snap.buffer = getNoiseBuffer(context)
  const band = context.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = frequency * (0.94 + Math.random() * 0.12)
  band.Q.value = 9
  const snapGain = context.createGain()
  snapGain.gain.setValueAtTime(0.16 * gain, at)
  snapGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.022)
  snap.connect(band).connect(snapGain).connect(context.destination)
  snap.start(at)
  snap.stop(at + 0.03)

  const body = context.createOscillator()
  body.type = 'sine'
  body.frequency.setValueAtTime(190, at)
  body.frequency.exponentialRampToValueAtTime(130, at + 0.03)
  const bodyGain = context.createGain()
  bodyGain.gain.setValueAtTime(0.06 * gain, at)
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.035)
  body.connect(bodyGain).connect(context.destination)
  body.start(at)
  body.stop(at + 0.04)
}

// Duller, lower impact for slamming into min/max.
function clunk(context: AudioContext, at: number): void {
  const snap = context.createBufferSource()
  snap.buffer = getNoiseBuffer(context)
  const band = context.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 720
  band.Q.value = 3
  const snapGain = context.createGain()
  snapGain.gain.setValueAtTime(0.2, at)
  snapGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.045)
  snap.connect(band).connect(snapGain).connect(context.destination)
  snap.start(at)
  snap.stop(at + 0.05)

  const body = context.createOscillator()
  body.type = 'sine'
  body.frequency.setValueAtTime(120, at)
  body.frequency.exponentialRampToValueAtTime(85, at + 0.06)
  const bodyGain = context.createGain()
  bodyGain.gain.setValueAtTime(0.09, at)
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.065)
  body.connect(bodyGain).connect(context.destination)
  body.start(at)
  body.stop(at + 0.07)
}

export function playDialClick(kind: DialClickKind = 'tick'): void {
  const context = audioContext
  if (!context || context.state !== 'running') return

  const now = performance.now()
  // Rate-limit the ratchet: fast flicks blur into a zip instead of clipping.
  if (kind === 'tick' && now - lastTickAt < 45) return
  lastTickAt = now

  const at = context.currentTime
  if (kind === 'bound') {
    clunk(context, at)
    return
  }
  strike(context, at, 1, 2600)
  // Settling is the pawl dropping into the notch: strike plus a softer echo.
  if (kind === 'settle') strike(context, at + 0.034, 0.5, 2200)
}
