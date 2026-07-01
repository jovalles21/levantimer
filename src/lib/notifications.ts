// Notificaciones del sistema con la Notification API.

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  return Notification.requestPermission()
}

export function notify(title: string, body: string): void {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, requireInteraction: true })
  } catch {
    // Algunos navegadores requieren mostrarla vía service worker; la ignoramos.
  }
}
