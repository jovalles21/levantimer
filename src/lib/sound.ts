// Sonidos generados con la Web Audio API (sin ficheros externos).

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

function beep(frequency: number, duration: number, startAt: number, volume = 0.2): void {
  const audio = getContext()
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = 'sine'
  osc.frequency.value = frequency
  gain.gain.setValueAtTime(0, startAt)
  gain.gain.linearRampToValueAtTime(volume, startAt + 0.01)
  gain.gain.linearRampToValueAtTime(0, startAt + duration)
  osc.connect(gain)
  gain.connect(audio.destination)
  osc.start(startAt)
  osc.stop(startAt + duration)
}

/** Alerta insistente al empezar el descanso: varios beeps agudos. */
export function playBreakStart(): void {
  const audio = getContext()
  const now = audio.currentTime
  for (let i = 0; i < 3; i++) {
    beep(880, 0.18, now + i * 0.25)
  }
}

/** Aviso suave al terminar el descanso. */
export function playBreakEnd(): void {
  const audio = getContext()
  const now = audio.currentTime
  beep(523, 0.15, now)
  beep(659, 0.25, now + 0.18)
}
