import type { Config } from '../types'
import { notificationsSupported, requestPermission } from '../lib/notifications'

interface Props {
  config: Config
  onChange: (config: Config) => void
  disabled: boolean
}

export function SettingsPanel({ config, onChange, disabled }: Props) {
  const update = (patch: Partial<Config>) => onChange({ ...config, ...patch })

  const handleNotificationsToggle = async (checked: boolean) => {
    if (checked) {
      const permission = await requestPermission()
      update({ notifications: permission === 'granted' })
    } else {
      update({ notifications: false })
    }
  }

  return (
    <div className="w-full space-y-5 rounded-2xl bg-slate-800/60 p-6">
      <h2 className="text-lg font-semibold text-slate-100">Configuración</h2>

      <label className="flex items-center justify-between gap-4 text-slate-200">
        <span>Trabajar cada (min)</span>
        <input
          type="number"
          min={1}
          step={1}
          value={config.workInterval}
          disabled={disabled}
          onChange={(e) => update({ workInterval: Math.max(1, Number(e.target.value)) })}
          className="w-24 rounded-lg bg-slate-900 px-3 py-2 text-right text-slate-50 disabled:opacity-50"
        />
      </label>

      <label className="flex items-center justify-between gap-4 text-slate-200">
        <span>Descanso de (min)</span>
        <input
          type="number"
          min={1}
          step={1}
          value={config.breakDuration}
          disabled={disabled}
          onChange={(e) => update({ breakDuration: Math.max(1, Number(e.target.value)) })}
          className="w-24 rounded-lg bg-slate-900 px-3 py-2 text-right text-slate-50 disabled:opacity-50"
        />
      </label>

      <ToggleRow
        label="Overlay bloqueante"
        hint="Si está activo, no podrás cerrar el aviso hasta terminar el descanso."
        checked={config.blockingOverlay}
        onChange={(checked) => update({ blockingOverlay: checked })}
      />

      <ToggleRow
        label="Sonido"
        checked={config.sound}
        onChange={(checked) => update({ sound: checked })}
      />

      <ToggleRow
        label="Notificaciones del sistema"
        hint={notificationsSupported() ? undefined : 'No soportadas en este navegador.'}
        checked={config.notifications}
        disabled={!notificationsSupported()}
        onChange={handleNotificationsToggle}
      />
    </div>
  )
}

interface ToggleRowProps {
  label: string
  hint?: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}

function ToggleRow({ label, hint, checked, disabled, onChange }: ToggleRowProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 text-slate-200">
      <span className="flex flex-col">
        <span>{label}</span>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 accent-emerald-500 disabled:opacity-50"
      />
    </label>
  )
}
