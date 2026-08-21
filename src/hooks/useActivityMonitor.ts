import { useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { idleDetectionSupported, isTauri } from '../lib/idle'

// Cada cuánto se consulta la inactividad nativa. Mientras hay actividad basta
// con mirar de vez en cuando (el umbral son minutos); una vez inactivo se mira
// a menudo para que la reanudación se sienta inmediata.
const POLL_ACTIVE_MS = 60_000
const POLL_IDLE_MS = 5_000

/**
 * Observa la inactividad del sistema mientras `enabled` sea true y avisa en las
 * dos direcciones: `onIdle` al superarse el umbral y `onActive` al volver la
 * actividad. `onActive` solo dispara tras haber visto inactividad, así que
 * cambiar `epoch` (una acción manual tuya) descarta la inactividad observada
 * antes y evita que la app reaccione a algo que ya no viene al caso.
 *
 * Los timestamps se derivan de la inactividad medida, no del momento del
 * sondeo, así que el registro es exacto aunque la detección llegue tarde.
 */
export function useActivityMonitor(
  enabled: boolean,
  thresholdMin: number,
  onIdle: (idleStartedAt: number) => void,
  onActive: (activeSinceAt: number) => void,
  epoch = 0,
) {
  const onIdleRef = useRef(onIdle)
  onIdleRef.current = onIdle
  const onActiveRef = useRef(onActive)
  onActiveRef.current = onActive

  useEffect(() => {
    if (!enabled || !idleDetectionSupported()) return
    const thresholdMs = Math.max(60_000, thresholdMin * 60_000)
    let isIdle = false

    // App de escritorio: pregunta al sistema cuánto llevas sin teclado/ratón.
    if (isTauri) {
      let timer: ReturnType<typeof setTimeout>
      let stopped = false

      const poll = () => {
        void invoke<number>('get_idle_ms')
          .then((idleMs) => {
            if (stopped) return
            if (!isIdle && idleMs >= thresholdMs) {
              isIdle = true
              onIdleRef.current(Date.now() - idleMs)
            } else if (isIdle && idleMs < thresholdMs) {
              isIdle = false
              onActiveRef.current(Date.now() - idleMs)
            }
          })
          .catch(() => {})
          .finally(() => {
            if (!stopped) timer = setTimeout(poll, isIdle ? POLL_IDLE_MS : POLL_ACTIVE_MS)
          })
      }

      timer = setTimeout(poll, POLL_ACTIVE_MS)
      return () => {
        stopped = true
        clearTimeout(timer)
      }
    }

    // Navegador: Idle Detection API (exige umbral mínimo de 60s).
    const controller = new AbortController()
    void (async () => {
      try {
        const detector = new (window as any).IdleDetector()
        detector.addEventListener('change', () => {
          const away = detector.screenState === 'locked' || detector.userState === 'idle'
          if (away && !isIdle) {
            isIdle = true
            // El navegador no expone el instante exacto: se estima con el umbral.
            onIdleRef.current(Date.now() - thresholdMs)
          } else if (!away && isIdle) {
            isIdle = false
            onActiveRef.current(Date.now())
          }
        })
        await detector.start({ threshold: thresholdMs, signal: controller.signal })
      } catch {
        // Permiso no concedido o API no disponible: sin auto-pausa.
      }
    })()

    return () => controller.abort()
  }, [enabled, thresholdMin, epoch])
}
