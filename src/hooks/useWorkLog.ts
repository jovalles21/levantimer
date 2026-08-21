import { useCallback, useEffect, useState } from 'react'
import type { WorkSession } from '../types'

const STORAGE_KEY = 'levantimer.worklog'
const HISTORY_DAYS = 30
// Cada cuánto se refresca `lastSeen` de la sesión en curso.
const HEARTBEAT_MS = 60_000
// Sesiones más cortas que esto se descartan (ruido de pausas inmediatas).
const MIN_SESSION_MS = 1000

interface WorkLogData {
  /** Sesiones cerradas, agrupadas por fecha local "YYYY-MM-DD". */
  days: Record<string, WorkSession[]>
  /**
   * Sesión en curso. `lastSeen` se refresca cada minuto para poder cerrar la
   * sesión de forma honesta si la pestaña se cierra con el timer corriendo.
   */
  active: { start: number; lastSeen: number } | null
}

/** Fecha local en formato "YYYY-MM-DD" (ordenable como texto). */
export function dateKey(ts: number): string {
  const d = new Date(ts)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

function pushSession(days: Record<string, WorkSession[]>, session: WorkSession) {
  if (session.end - session.start < MIN_SESSION_MS) return
  const key = dateKey(session.start)
  days[key] = [...(days[key] ?? []), session]
}

function load(): WorkLogData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return { days: {}, active: null }
    const data = JSON.parse(stored) as WorkLogData
    // Sesión huérfana (pestaña cerrada con el timer corriendo): se cierra en
    // el último instante en que la app estuvo viva.
    if (data.active) {
      pushSession(data.days, {
        start: data.active.start,
        end: Math.max(data.active.start, data.active.lastSeen),
      })
      data.active = null
    }
    // Limpia días fuera del histórico que guardamos.
    const cutoff = dateKey(Date.now() - HISTORY_DAYS * 86_400_000)
    for (const key of Object.keys(data.days)) {
      if (key < cutoff) delete data.days[key]
    }
    return data
  } catch {
    return { days: {}, active: null }
  }
}

/**
 * Registro de la jornada. Una sesión cubre trabajo y descansos del timer por
 * igual; solo la cierran la pausa manual, el reset o la inactividad detectada.
 */
export function useWorkLog() {
  const [data, setData] = useState<WorkLogData>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // Ignoramos errores de cuota / modo privado.
    }
  }, [data])

  const isActive = data.active !== null

  // Latido con sesión activa: mantiene el total de hoy en vivo y refresca
  // lastSeen para el cierre de sesiones huérfanas.
  useEffect(() => {
    if (!isActive) return
    const id = setInterval(() => {
      setData((d) =>
        d.active ? { ...d, active: { ...d.active, lastSeen: Date.now() } } : d,
      )
    }, HEARTBEAT_MS)
    return () => clearInterval(id)
  }, [isActive])

  /** Abre una sesión. `start` permite fecharla en el instante real del regreso. */
  const startSession = useCallback((start?: number) => {
    const at = start ?? Date.now()
    setData((d) => (d.active ? d : { ...d, active: { start: at, lastSeen: Date.now() } }))
  }, [])

  /** Cierra la sesión activa. `end` permite fecharla al empezar la inactividad. */
  const endSession = useCallback((end?: number) => {
    setData((d) => {
      if (!d.active) return d
      const days = { ...d.days }
      pushSession(days, {
        start: d.active.start,
        end: Math.max(d.active.start, end ?? Date.now()),
      })
      return { days, active: null }
    })
  }, [])

  const todayKey = dateKey(Date.now())
  const finishedToday = (data.days[todayKey] ?? []).reduce(
    (sum, s) => sum + (s.end - s.start),
    0,
  )
  const todayMs =
    finishedToday +
    (data.active ? Math.max(0, data.active.lastSeen - data.active.start) : 0)

  return { todayMs, days: data.days, startSession, endSession }
}
