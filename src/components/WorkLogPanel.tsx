import type { WorkSession } from '../types'
import { formatDuration } from '../lib/format'
import { dateKey } from '../hooks/useWorkLog'

interface Props {
  todayMs: number
  days: Record<string, WorkSession[]>
  goalHours: number
}

const WEEKDAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

export function WorkLogPanel({ todayMs, days, goalHours }: Props) {
  const goalMs = goalHours * 3_600_000
  const pct = Math.min(100, (todayMs / goalMs) * 100)
  const goalReached = todayMs >= goalMs

  // Últimos 6 días (hoy va aparte, arriba en grande).
  const rows = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (i + 1))
    const key = dateKey(d.getTime())
    const total = (days[key] ?? []).reduce((sum, s) => sum + (s.end - s.start), 0)
    return { key, label: `${WEEKDAYS[d.getDay()]} ${d.getDate()}`, total }
  })

  return (
    <div className="w-full space-y-4 rounded-2xl bg-slate-800/60 p-6">
      <h2 className="text-lg font-semibold text-slate-100">Horas trabajadas</h2>

      <div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-emerald-400">
            {formatDuration(todayMs)}
          </span>
          <span className="text-sm text-slate-400">Meta: {goalHours} h</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-700">
          <div
            className={`h-full rounded-full ${goalReached ? 'bg-amber-400' : 'bg-emerald-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {goalReached && (
          <p className="mt-1 text-xs text-amber-300">
            Meta cumplida
            {todayMs - goalMs >= 60_000 ? ` (+${formatDuration(todayMs - goalMs)})` : ''}. ¡A
            descansar!
          </p>
        )}
      </div>

      <ul className="space-y-1 text-sm">
        {rows.map((r) => (
          <li key={r.key} className="flex justify-between">
            <span className="text-slate-400">{r.label}</span>
            <span className="text-slate-200">{r.total > 0 ? formatDuration(r.total) : '—'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
