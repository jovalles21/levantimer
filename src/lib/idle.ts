/**
 * Wrapper mínimo sobre la Idle Detection API (solo Chrome/Edge). Detecta
 * inactividad de teclado/ratón a nivel de sistema y bloqueo de pantalla.
 */

export function idleDetectionSupported(): boolean {
  return 'IdleDetector' in window
}

/** Pide permiso (debe llamarse desde un gesto del usuario). */
export async function requestIdlePermission(): Promise<boolean> {
  if (!idleDetectionSupported()) return false
  try {
    const state: string = await (window as any).IdleDetector.requestPermission()
    return state === 'granted'
  } catch {
    return false
  }
}
