import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// Открыть/сфокусировать PWA при тапе на уведомление
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients: readonly WindowClient[]) => {
        const existing = clients.find((c) => 'focus' in c)
        if (existing) return (existing as WindowClient).focus()
        return self.clients.openWindow('/')
      })
  )
})
