/**
 * Detección de inactividad. En la app de escritorio (Tauri) se usa un comando
 * nativo sin permisos; en el navegador, la Idle Detection API (solo Chrome/Edge).
 */

/** True cuando corre dentro de la app de escritorio (Tauri) y no en el navegador. */
export const isTauri = '__TAURI_INTERNALS__' in window

export function idleDetectionSupported(): boolean {
  return isTauri || 'IdleDetector' in window
}

/** Pide permiso (debe llamarse desde un gesto del usuario). En Tauri no hace falta. */
export async function requestIdlePermission(): Promise<boolean> {
  if (isTauri) return true
  if (!idleDetectionSupported()) return false
  try {
    const state: string = await (window as any).IdleDetector.requestPermission()
    return state === 'granted'
  } catch {
    return false
  }
}
