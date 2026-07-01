export type Phase = 'idle' | 'working' | 'break'

export interface Config {
  /** Minutos de trabajo antes de avisar para levantarse. */
  workInterval: number
  /** Minutos que dura el descanso. */
  breakDuration: number
  /** Si el overlay del descanso bloquea la pantalla hasta terminar. */
  blockingOverlay: boolean
  /** Si se usan notificaciones del sistema. */
  notifications: boolean
  /** Si se reproduce sonido en las alertas. */
  sound: boolean
}

export const DEFAULT_CONFIG: Config = {
  workInterval: 30,
  breakDuration: 5,
  blockingOverlay: true,
  notifications: true,
  sound: true,
}
