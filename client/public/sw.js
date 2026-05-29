// Service Worker untuk Web Push Notification
// File ini harus ada di root public/ agar bisa diakses di /sw.js

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

// Handle push notification yang masuk
self.addEventListener('push', (event) => {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch {
    data = {
      title: 'Nexa Order',
      body: event.data.text(),
      icon: '/favicon.svg',
    }
  }

  const options = {
    body: data.body || 'Ada update untuk pesananmu',
    icon: data.icon || '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [200, 100, 200],
    tag: `order-${data.orderId || 'update'}`, // tag mencegah notif duplikat
    renotify: true,
    data: {
      url: data.url || '/',
      orderId: data.orderId,
    },
    actions: [
      { action: 'view', title: 'Lihat Status' },
      { action: 'close', title: 'Tutup' },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Nexa Order', options)
  )
})

// Handle klik pada notifikasi
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'close') return

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Jika ada tab yang sudah buka, fokus ke sana
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Jika tidak ada, buka tab baru
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})
