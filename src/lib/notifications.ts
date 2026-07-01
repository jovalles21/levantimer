// Notificaciones del sistema con la Notification API.

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  return Notification.requestPermission()
}

// Opciones extendidas: vibrate/renotify no están en el tipo estándar del DOM.
type NotifyOptions = NotificationOptions & { vibrate?: number[]; renotify?: boolean }

export function notify(title: string, body: string): void {
  if (!notificationsSupported() || Notification.permission !== 'granted') return

  const options: NotifyOptions = {
    body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: 'levantimer',
    renotify: true,
    requireInteraction: true,
    vibrate: [300, 150, 300],
  }

  // En PWAs instaladas `new Notification()` lanza excepción; hay que mostrarla
  // a través del service worker. Ese camino además permite traer la app al
  // frente al pulsar la notificación (ver public/notif-sw.js).
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((reg) => reg.showNotification(title, options))
      .catch(() => showFromPage(title, options))
  } else {
    showFromPage(title, options)
  }
}

function showFromPage(title: string, options: NotifyOptions): void {
  try {
    new Notification(title, options)
  } catch {
    // El navegador no permite notificaciones desde la página; la ignoramos.
  }
}
