import { formatTime } from '../lib/format'
import type { Phase } from '../types'

interface Props {
  phase: Phase
  remainingMs: number
}

const LABELS: Record<Phase, string> = {
  idle: 'Listo para empezar',
  working: 'Trabajando',
  break: 'Descanso',
}

export function TimerDisplay({ phase, remainingMs }: Props) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm uppercase tracking-widest text-slate-400">{LABELS[phase]}</span>
      <span className="font-mono text-7xl font-bold tabular-nums text-slate-50 sm:text-8xl">
        {phase === 'idle' ? '--:--' : formatTime(remainingMs)}
      </span>
    </div>
  )
}
