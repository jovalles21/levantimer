// Sonidos generados con la Web Audio API (sin ficheros externos).

import type { AlarmSound } from '../types'

let ctx: AudioContext | null = null

function getContext(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext()
  }
  // Algunos navegadores suspenden el contexto hasta una interacción del usuario.
  if (ctx.state === 'suspended') {
    void ctx.resume()
  }
  return ctx
}

/** Debe llamarse desde un handler de click para "desbloquear" el audio. */
export function unlockAudio(): void {
  getContext()
}

function beep(
  frequency: number,
  duration: number,
  startAt: number,
  volume = 0.2,
  type: OscillatorType = 'sine',
): void {
  const audio = getContext()
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = type
  osc.frequency.value = frequency
  gain.gain.setValueAtTime(0, startAt)
  gain.gain.linearRampToValueAtTime(volume, startAt + 0.01)
  gain.gain.linearRampToValueAtTime(0, startAt + duration)
  osc.connect(gain)
  gain.connect(audio.destination)
  osc.start(startAt)
  osc.stop(startAt + duration)
}

/** Alarma al empezar el descanso. `volume` (0 a 1) escala el volumen. */
export function playBreakStart(kind: AlarmSound = 'siren', volume = 1): void {
  const audio = getContext()
  const now = audio.currentTime
  if (kind === 'pitidos') {
    // Tres beeps agudos y secos.
    for (let i = 0; i < 3; i++) beep(880, 0.18, now + i * 0.25, 0.35 * volume, 'square')
  } else if (kind === 'campana') {
    // Campanadas agudas con cola larga.
    for (let i = 0; i < 3; i++) beep(1046, 0.6, now + i * 0.45, 0.4 * volume, 'triangle')
  } else {
    // Sirena: onda cuadrada + tonos alternos, muy penetrante.
    const pattern = [880, 660, 880, 660, 880, 660]
    pattern.forEach((freq, i) => beep(freq, 0.24, now + i * 0.26, 0.4 * volume, 'square'))
  }
}

/** Aviso al terminar el descanso: melodía ascendente, clara y distinta de la alarma. */
export function playBreakEnd(volume = 1): void {
  const audio = getContext()
  const now = audio.currentTime
  // Tres notas ascendentes, repetidas, para que se note que toca sentarse.
  const notes = [523, 659, 784]
  for (let rep = 0; rep < 2; rep++) {
    const base = now + rep * 0.75
    notes.forEach((freq, i) => beep(freq, 0.2, base + i * 0.16, 0.35 * volume, 'triangle'))
  }
}
