import { useEffect, useState } from 'react'
import { DEFAULT_CONFIG } from './types'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useStandTimer } from './hooks/useStandTimer'
import { unlockAudio } from './lib/sound'
import { formatTime } from './lib/format'
import { TimerDisplay } from './components/TimerDisplay'
import { SettingsPanel } from './components/SettingsPanel'
import { BreakOverlay } from './components/BreakOverlay'

export default function App() {
  const [config, setConfig] = useLocalStorage('levantimer.config', DEFAULT_CONFIG)
  const { phase, running, remainingMs, start, pause, resume, reset, skipBreak } =
    useStandTimer(config)

  // Permite ocultar el overlay cuando no es bloqueante.
  const [overlayDismissed, setOverlayDismissed] = useState(false)

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

  const handleStart = () => {
    unlockAudio() // desbloquea el audio en el gesto del usuario
    start()
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
            <SecondaryButton onClick={pause}>Pausar</SecondaryButton>
          ) : (
            <PrimaryButton onClick={resume}>Reanudar</PrimaryButton>
          )}
          {phase !== 'idle' && <SecondaryButton onClick={reset}>Reiniciar</SecondaryButton>}
        </div>

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
