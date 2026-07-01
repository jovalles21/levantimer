import { useCallback, useEffect, useRef, useState } from 'react'
import type { Config, Phase } from '../types'
import { playBreakEnd, playBreakStart } from '../lib/sound'
import { notify } from '../lib/notifications'

const MINUTE = 60_000

interface StandTimer {
  phase: Phase
  running: boolean
  remainingMs: number
  start: () => void
  pause: () => void
  resume: () => void
  reset: () => void
  skipBreak: () => void
}

/**
 * Máquina de estados del temporizador. Alterna working <-> break y dispara las
 * alertas al cambiar de fase. El tiempo restante se calcula contra un timestamp
 * objetivo (endTime), así no se desincroniza si la pestaña se ralentiza.
 */
export function useStandTimer(config: Config): StandTimer {
  const [phase, setPhase] = useState<Phase>('idle')
  const [running, setRunning] = useState(false)
  const [remainingMs, setRemainingMs] = useState(0)

  const endTimeRef = useRef<number | null>(null)
  const pausedRemainingRef = useRef<number | null>(null)
  const configRef = useRef(config)
  configRef.current = config

  const durationFor = useCallback((p: Phase): number => {
    const cfg = configRef.current
    if (p === 'working') return cfg.workInterval * MINUTE
    if (p === 'break') return cfg.breakDuration * MINUTE
    return 0
  }, [])

  const alertFor = useCallback((p: Phase) => {
    const cfg = configRef.current
    // Intenta traer la ventana al frente para que el aviso interrumpa aunque
    // el overlay no sea bloqueante (best-effort: el navegador puede ignorarlo).
    window.focus()
    if (p === 'break') {
      if (cfg.sound) playBreakStart(cfg.alarmSound, cfg.volume)
      if (cfg.notifications) notify('¡Levántate y estírate!', `Descanso de ${cfg.breakDuration} min.`)
    } else if (p === 'working') {
      if (cfg.sound) playBreakEnd(cfg.volume)
      if (cfg.notifications) notify('Descanso terminado', `A trabajar durante ${cfg.workInterval} min.`)
    }
  }, [])

  const enterPhase = useCallback(
    (p: Phase) => {
      const duration = durationFor(p)
      endTimeRef.current = Date.now() + duration
      pausedRemainingRef.current = null
      setPhase(p)
      setRemainingMs(duration)
      alertFor(p)
    },
    [durationFor, alertFor],
  )

  // Tick de 1s: actualiza el restante y avanza de fase al llegar a cero.
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      if (endTimeRef.current === null) return
      const remaining = endTimeRef.current - Date.now()
      if (remaining <= 0) {
        setPhase((current) => {
          const next: Phase = current === 'break' ? 'working' : 'break'
          enterPhase(next)
          return next
        })
      } else {
        setRemainingMs(remaining)
      }
    }, 1000)
    return () => clearInterval(id)
  }, [running, enterPhase])

  const start = useCallback(() => {
    enterPhase('working')
    setRunning(true)
  }, [enterPhase])

  const pause = useCallback(() => {
    if (endTimeRef.current !== null) {
      pausedRemainingRef.current = Math.max(0, endTimeRef.current - Date.now())
    }
    setRunning(false)
  }, [])

  const resume = useCallback(() => {
    const remaining = pausedRemainingRef.current ?? durationFor(phase)
    endTimeRef.current = Date.now() + remaining
    pausedRemainingRef.current = null
    setRunning(true)
  }, [phase, durationFor])

  const reset = useCallback(() => {
    endTimeRef.current = null
    pausedRemainingRef.current = null
    setRunning(false)
    setPhase('idle')
    setRemainingMs(0)
  }, [])

  const skipBreak = useCallback(() => {
    enterPhase('working')
  }, [enterPhase])

  return { phase, running, remainingMs, start, pause, resume, reset, skipBreak }
}
