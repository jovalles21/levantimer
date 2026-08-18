import { useEffect, useRef } from 'react'
import { idleDetectionSupported } from '../lib/idle'

/**
 * Observa la inactividad del sistema mientras `active` sea true y avisa una
 * sola vez con el último instante de actividad estimado. No reanuda nada:
 * al desactivarse `active` (p. ej. porque el timer se pausó) deja de observar.
 */
export function useIdleDetector(
  active: boolean,
  thresholdMin: number,
  onIdle: (lastActiveAt: number) => void,
) {
  const onIdleRef = useRef(onIdle)
  onIdleRef.current = onIdle

  useEffect(() => {
    if (!active || !idleDetectionSupported()) return
    const controller = new AbortController()
    // La API exige un umbral mínimo de 60s.
    const thresholdMs = Math.max(60_000, thresholdMin * 60_000)
    let fired = false

    void (async () => {
      try {
        const detector = new (window as any).IdleDetector()
        detector.addEventListener('change', () => {
          if (fired) return
          if (detector.screenState === 'locked') {
            // Bloqueo de pantalla: la actividad terminó ahora mismo.
            fired = true
            onIdleRef.current(Date.now())
          } else if (detector.userState === 'idle') {
            // Sin teclado/ratón durante todo el umbral: la última actividad
            // fue hace ~thresholdMs.
            fired = true
            onIdleRef.current(Date.now() - thresholdMs)
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
