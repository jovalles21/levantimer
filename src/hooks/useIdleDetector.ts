import { useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { idleDetectionSupported, isTauri } from '../lib/idle'

// Cada cuánto se consulta la inactividad nativa en la app de escritorio.
const NATIVE_POLL_MS = 5000

/**
 * Observa la inactividad del sistema mientras `active` sea true y avisa una
 * sola vez al superarse el umbral. No reanuda nada: al desactivarse `active`
 * (p. ej. porque el timer se pausó) deja de observar.
 */
export function useIdleDetector(
  active: boolean,
  thresholdMin: number,
  onIdle: () => void,
) {
  const onIdleRef = useRef(onIdle)
  onIdleRef.current = onIdle

  useEffect(() => {
    if (!active || !idleDetectionSupported()) return
    const thresholdMs = Math.max(60_000, thresholdMin * 60_000)
    let fired = false

    // App de escritorio: pregunta al sistema cuánto llevas sin teclado/ratón.
    if (isTauri) {
      const id = setInterval(() => {
        void invoke<number>('get_idle_ms')
          .then((idleMs) => {
            if (!fired && idleMs >= thresholdMs) {
              fired = true
              onIdleRef.current()
            }
          })
          .catch(() => {})
      }, NATIVE_POLL_MS)
      return () => clearInterval(id)
    }

    // Navegador: Idle Detection API (exige umbral mínimo de 60s).
    const controller = new AbortController()
    void (async () => {
      try {
        const detector = new (window as any).IdleDetector()
        detector.addEventListener('change', () => {
          if (fired) return
          if (detector.screenState === 'locked' || detector.userState === 'idle') {
            fired = true
            onIdleRef.current()
          }
        })
        await detector.start({ threshold: thresholdMs, signal: controller.signal })
      } catch {
        // Permiso no concedido o API no disponible: sin auto-pausa.
      }
    })()

    return () => controller.abort()
  }, [active, thresholdMin])
}
