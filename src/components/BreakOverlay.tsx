import { useEffect } from 'react'
import { formatTime } from '../lib/format'
import { playBreakStart } from '../lib/sound'
import type { Config } from '../types'

interface Props {
  remainingMs: number
  config: Config
  onSkip: () => void
  onDismiss: () => void
}

export function BreakOverlay({ remainingMs, config, onSkip, onDismiss }: Props) {
  // Aviso sonoro insistente mientras dura el descanso (cada 10s) si hay sonido.
  useEffect(() => {
    if (!config.sound) return
    const id = setInterval(() => playBreakStart(), 10_000)
    return () => clearInterval(id)
  }, [config.sound])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-emerald-600 text-center text-white">
      <h1 className="px-6 text-5xl font-extrabold tracking-tight sm:text-7xl">
        ¡LEVÁNTATE Y ESTÍRATE!
      </h1>
      <p className="text-2xl text-emerald-100">Tómate un descanso</p>
      <span className="font-mono text-8xl font-bold tabular-nums">{formatTime(remainingMs)}</span>

      <div className="flex gap-4">
        <button
          onClick={onSkip}
          className="rounded-xl bg-emerald-800 px-6 py-3 text-lg font-semibold hover:bg-emerald-900"
        >
          Saltar descanso
        </button>
        {!config.blockingOverlay && (
          <button
            onClick={onDismiss}
            className="rounded-xl bg-white/20 px-6 py-3 text-lg font-semibold hover:bg-white/30"
          >
            Cerrar aviso
          </button>
        )}
      </div>

      {config.blockingOverlay && (
        <p className="text-sm text-emerald-100/80">
          El aviso permanecerá hasta terminar el descanso.
        </p>
      )}
    </div>
  )
}
