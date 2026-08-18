import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_CONFIG } from './types'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useStandTimer } from './hooks/useStandTimer'
import { dateKey, useWorkLog } from './hooks/useWorkLog'
import { useIdleDetector } from './hooks/useIdleDetector'
import { requestIdlePermission } from './lib/idle'
import { playBreakEnd, unlockAudio } from './lib/sound'
import { notify, requestPermission } from './lib/notifications'
import { formatDuration, formatTime } from './lib/format'
import { TimerDisplay } from './components/TimerDisplay'
import { SettingsPanel } from './components/SettingsPanel'
import { WorkLogPanel } from './components/WorkLogPanel'
import { BreakOverlay } from './components/BreakOverlay'

const GOAL_NOTIFIED_KEY = 'levantimer.goalNotified'

export default function App() {
  const [config, setConfig] = useLocalStorage('levantimer.config', DEFAULT_CONFIG)
  const { phase, running, remainingMs, start, pause, resume, reset, skipBreak } =
    useStandTimer(config)
  const { todayMs, days, startSession, endSession } = useWorkLog()

  // Permite ocultar el overlay cuando no es bloqueante.
  const [overlayDismissed, setOverlayDismissed] = useState(false)
  // Ms descontados en la última auto-pausa por inactividad (aviso al volver).
  const [idleNotice, setIdleNotice] = useState<number | null>(null)

  // Al volver al descanso, el overlay reaparece.
  useEffect(() => {
    if (phase === 'break') setOverlayDismissed(false)
  }, [phase])

  // Muestra la cuenta atrás también en el título de la pestaña.
  useEffect(() => {
    if (phase === 'idle') {
      document.title = 'Levantimer'
    } else {
      const prefix = phase === 'break' ? '☕' : '⏱'
      document.title = `${prefix} ${formatTime(remainingMs)} · Levantimer`
    }
  }, [phase, remainingMs])

  // Inactividad detectada: pausa el timer y cierra la sesión retroactivamente
  // en el último momento de actividad. No se reanuda solo: eso lo haces tú.
  const handleIdle = useCallback(
    (lastActiveAt: number) => {
      pause()
      endSession(lastActiveAt)
      setIdleNotice(Date.now() - lastActiveAt)
    },
    [pause, endSession],
  )

  // Solo vigila durante la fase de trabajo: en el descanso levantarse es el plan.
  useIdleDetector(
    running && phase === 'working' && config.idleDetection,
    config.idleThreshold,
    handleIdle,
  )

  // Aviso único al alcanzar la meta diaria.
  const goalMs = config.dailyGoalHours * 3_600_000
  useEffect(() => {
    if (todayMs < goalMs) return
    const today = dateKey(Date.now())
    if (localStorage.getItem(GOAL_NOTIFIED_KEY) === today) return
    localStorage.setItem(GOAL_NOTIFIED_KEY, today)
    if (config.sound) playBreakEnd(config.volume)
    if (config.notifications) {
      notify('Meta diaria alcanzada', `Ya llevas ${config.dailyGoalHours} h de trabajo hoy.`)
    }
  }, [todayMs, goalMs, config])

  const handleStart = () => {
    unlockAudio() // desbloquea el audio en el gesto del usuario
    // Pide permiso de notificaciones aquí (gesto del usuario) por si está
    // activado en la config pero aún no se concedió.
    if (config.notifications) void requestPermission()
    // Igual con la detección de inactividad: si el permiso se deniega, se
    // apaga la opción para no aparentar una protección que no existe.
    if (config.idleDetection) {
      void requestIdlePermission().then((granted) => {
        if (!granted) setConfig((c) => ({ ...c, idleDetection: false }))
      })
    }
    setIdleNotice(null)
    start()
    startSession()
  }

  const handlePause = () => {
    pause()
    endSession()
  }

  const handleResume = () => {
    setIdleNotice(null)
    resume()
    startSession()
  }

  const handleReset = () => {
    reset()
    endSession()
  }

  const showOverlay = phase === 'break' && !overlayDismissed

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <main className="mx-auto flex max-w-md flex-col items-center gap-10 px-4 py-12">
        <header className="text-center">
          <h1 className="text-3xl font-bold">Levantimer</h1>
          <p className="mt-1 text-slate-400">Levántate a estirar cada cierto tiempo.</p>
        </header>

        <TimerDisplay phase={phase} remainingMs={remainingMs} />

        <div className="flex flex-wrap justify-center gap-3">
          {phase === 'idle' ? (
            <PrimaryButton onClick={handleStart}>Iniciar</PrimaryButton>
          ) : running ? (
            <SecondaryButton onClick={handlePause}>Pausar</SecondaryButton>
          ) : (
            <PrimaryButton onClick={handleResume}>Reanudar</PrimaryButton>
          )}
          {phase !== 'idle' && <SecondaryButton onClick={handleReset}>Reiniciar</SecondaryButton>}
        </div>

        {idleNotice !== null && (
          <p className="rounded-lg bg-amber-500/15 px-4 py-2 text-sm text-amber-300">
            Pausado por inactividad
            {idleNotice >= 60_000 ? `: se descontaron ~${formatDuration(idleNotice)}` : ''}.
          </p>
        )}

        <WorkLogPanel todayMs={todayMs} days={days} goalHours={config.dailyGoalHours} />

        <SettingsPanel config={config} onChange={setConfig} disabled={phase !== 'idle'} />
      </main>

      {showOverlay && (
        <BreakOverlay
          remainingMs={remainingMs}
          config={config}
          onSkip={skipBreak}
          onDismiss={() => setOverlayDismissed(true)}
        />
      )}
    </div>
  )
}

function PrimaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl bg-emerald-500 px-8 py-3 text-lg font-semibold text-white hover:bg-emerald-400"
    >
      {children}
    </button>
  )
}

function SecondaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl bg-slate-700 px-8 py-3 text-lg font-semibold text-slate-100 hover:bg-slate-600"
    >
      {children}
    </button>
  )
}
