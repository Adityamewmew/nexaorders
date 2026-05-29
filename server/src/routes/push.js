const express = require('express')
const webpush = require('web-push')
const prisma = require('../db')

const router = express.Router()

// Setup VAPID
webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:admin@nexaorder.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

// GET /api/push/vapid-public-key — frontend ambil public key
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY })
})

// POST /api/push/subscribe — customer subscribe, simpan subscription
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription, orderId } = req.body
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ error: 'Subscription tidak valid' })
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        orderId: orderId ? parseInt(orderId) : null,
      },
      create: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        orderId: orderId ? parseInt(orderId) : null,
      }
    })

    res.json({ message: 'Subscription berhasil disimpan' })
  } catch {
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

// POST /api/push/unsubscribe — hapus subscription
router.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body
    if (!endpoint) return res.status(400).json({ error: 'Endpoint wajib' })
    await prisma.pushSubscription.deleteMany({ where: { endpoint } })
    res.json({ message: 'Unsubscribe berhasil' })
  } catch {
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

// Helper: kirim notifikasi ke semua subscription yang terkait orderId
async function sendPushToOrder(orderId, payload) {
  try {
    const subs = await prisma.pushSubscription.findMany({
      where: { orderId: parseInt(orderId) }
    })

    const results = await Promise.allSettled(
      subs.map(sub =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          },
          JSON.stringify(payload)
        ).catch(async (err) => {
          // Hapus subscription yang sudah tidak valid (410 Gone)
          if (err.statusCode === 410 || err.statusCode === 404) {
            await prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } })
          }
          throw err
        })
      )
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    return { sent, total: subs.length }
  } catch {
    return { sent: 0, total: 0 }
  }
}

module.exports = { router, sendPushToOrder }
