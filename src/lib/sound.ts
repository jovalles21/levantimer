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
  volume = 0.6,
  type: OscillatorType = 'sine',
): void {
  const audio = getContext()
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = type
  osc.frequency.value = frequency
  // Ataque rápido, se sostiene a volumen pleno y sólo cae al final: así el tono
  // suena con cuerpo en lugar de como un pico apenas audible.
  gain.gain.setValueAtTime(0, startAt)
  gain.gain.linearRampToValueAtTime(volume, startAt + 0.01)
  gain.gain.setValueAtTime(volume, startAt + Math.max(0.02, duration - 0.03))
  gain.gain.linearRampToValueAtTime(0, startAt + duration)
  osc.connect(gain)
  gain.connect(audio.destination)
  osc.start(startAt)
  osc.stop(startAt + duration)
}

/** Alarma al empezar el descanso. `volume` (0 a 1) escala el volumen. */
export function playBreakStart(kind: AlarmSound = 'siren', volume = 1): void {
  const audio = getContext()
  // Un pequeño margen deja que el contexto termine de reanudarse antes del primer tono.
  const now = audio.currentTime + 0.06
  if (kind === 'pitidos') {
    // Beeps agudos y secos, repetidos para que insistan.
    for (let i = 0; i < 5; i++) beep(920, 0.18, now + i * 0.24, 0.75 * volume, 'square')
  } else if (kind === 'campana') {
    // Campanadas agudas con cola larga.
    for (let i = 0; i < 4; i++) beep(1046, 0.6, now + i * 0.45, 0.7 * volume, 'triangle')
  } else {
    // Sirena: onda cuadrada con tonos alternos, larga y muy penetrante.
    const pattern = [880, 660, 880, 660, 880, 660, 880, 660, 880, 660]
    pattern.forEach((freq, i) => beep(freq, 0.26, now + i * 0.27, 0.8 * volume, 'square'))
  }
}

/** Aviso previo: faltan pocos segundos para volver a trabajar. Dos toques suaves. */
export function playBreakWarning(volume = 1): void {
  const audio = getContext()
  const now = audio.currentTime + 0.06
  beep(659, 0.15, now, 0.5 * volume, 'triangle')
  beep(659, 0.15, now + 0.25, 0.5 * volume, 'triangle')
}

/** Aviso al terminar el descanso: melodía ascendente, clara y distinta de la alarma. */
export function playBreakEnd(volume = 1): void {
  const audio = getContext()
  const now = audio.currentTime + 0.06
  // Tres notas ascendentes, repetidas, para que se note que toca sentarse.
  const notes = [523, 659, 784]
  for (let rep = 0; rep < 2; rep++) {
    const base = now + rep * 0.75
    notes.forEach((freq, i) => beep(freq, 0.2, base + i * 0.16, 0.6 * volume, 'triangle'))
  }
}
