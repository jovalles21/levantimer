import { useEffect, useState } from 'react'

/** Estado persistido en localStorage bajo la clave dada. */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored === null) return initialValue
      // Mezclamos con el inicial por si se añaden campos nuevos con el tiempo.
      const parsed = JSON.parse(stored)
      return typeof parsed === 'object' && parsed !== null && typeof initialValue === 'object'
        ? { ...initialValue, ...parsed }
        : parsed
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Ignoramos errores de cuota / modo privado.
    }
  }, [key, value])

  return [value, setValue] as const
}
