// Se importa desde el service worker generado por Workbox (vite.config.ts).
// Al pulsar la notificación, trae la app al frente (o la abre si está cerrada).
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of all) {
        if ('focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow('/')
    })(),
  )
})
