            import api from './api'

// Konversi base64 URL ke Uint8Array (diperlukan untuk VAPID key)
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray.buffer as ArrayBuffer
}

// Cek apakah browser support push notification
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

// Register service worker
async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    return reg
  } catch (err) {
    console.error('SW registration failed:', err)
    return null
  }
}

// Minta izin notifikasi dan subscribe
export async function subscribePush(orderId: number): Promise<boolean> {
  if (!isPushSupported()) {
    console.log('Push notification tidak didukung browser ini')
    return false
  }

  try {
    // Minta izin notifikasi
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.log('Izin notifikasi ditolak')
      return false
    }

    // Register service worker
    const registration = await registerSW()
    if (!registration) return false

    // Ambil VAPID public key dari server
    const { publicKey } = (await api.get('/push/vapid-public-key')).data

    // Subscribe ke push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })

    // Kirim subscription ke server dengan orderId
    await api.post('/push/subscribe', {
      subscription: subscription.toJSON(),
      orderId,
    })

    console.log('Push subscription berhasil untuk order', orderId)
    return true
  } catch (err) {
    console.error('Subscribe push gagal:', err)
    return false
  }
}

// Unsubscribe dari push
export async function unsubscribePush(): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js')
    if (!registration) return
    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) return
    await api.post('/push/unsubscribe', { endpoint: subscription.endpoint })
    await subscription.unsubscribe()
  } catch (err) {
    console.error('Unsubscribe push gagal:', err)
  }
}
