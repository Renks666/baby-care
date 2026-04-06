export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function isNotificationsSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator
}

interface TimerNotificationOptions {
  tag: string
  title: string
  body: string
}

export async function showTimerNotification({ tag, title, body }: TimerNotificationOptions) {
  if (!isNotificationsSupported()) return
  const granted = await requestNotificationPermission()
  if (!granted) return

  const reg = await navigator.serviceWorker.ready
  await reg.showNotification(title, {
    body,
    tag,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    silent: true,
  })
}

export async function closeTimerNotification(tag: string) {
  if (!isNotificationsSupported()) return
  const reg = await navigator.serviceWorker.ready
  const notifications = await reg.getNotifications({ tag })
  notifications.forEach((n) => n.close())
}
