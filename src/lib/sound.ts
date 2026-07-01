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

/** Alarma notable al empezar el descanso: sirena de tonos alternos. */
export function playBreakStart(): void {
  const audio = getContext()
  const now = audio.currentTime
  // Onda cuadrada + tonos alternos: mucho más penetrante que un beep suave.
  const pattern = [880, 660, 880, 660, 880, 660]
  pattern.forEach((freq, i) => {
    beep(freq, 0.24, now + i * 0.26, 0.35, 'square')
  })
}

/** Aviso al terminar el descanso: melodía ascendente, clara pero distinta de la sirena. */
export function playBreakEnd(): void {
  const audio = getContext()
  const now = audio.currentTime
  // Tres notas ascendentes, repetidas, para que se note que toca sentarse.
  const notes = [523, 659, 784]
  for (let rep = 0; rep < 2; rep++) {
    const base = now + rep * 0.75
    notes.forEach((freq, i) => {
      beep(freq, 0.2, base + i * 0.16, 0.3, 'triangle')
    })
  }
}
