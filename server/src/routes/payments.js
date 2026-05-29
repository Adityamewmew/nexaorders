const express = require('express')
const prisma = require('../db')

const router = express.Router()

function parsePositiveInt(value) {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

// POST /api/payments — customer bayar (no auth)
router.post('/', async (req, res) => {
  try {
    const { orderId, method } = req.body
    const parsedOrderId = parsePositiveInt(orderId)
    if (!parsedOrderId || !method) {
      return res.status(400).json({ error: 'orderId dan method wajib' })
    }
    if (!['CASH', 'QRIS'].includes(method)) {
      return res.status(400).json({ error: 'Method harus CASH atau QRIS' })
    }

    const order = await prisma.order.findUnique({ where: { id: parsedOrderId } })
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan' })
    if (order.total <= 0) return res.status(400).json({ error: 'Total pesanan tidak valid' })
    if (order.status === 'DONE') return res.status(400).json({ error: 'Pesanan sudah selesai' })

    const payment = await prisma.payment.create({
      data: { orderId: parsedOrderId, method, amount: order.total }
    })

    res.status(201).json(payment)
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'Pembayaran sudah ada untuk pesanan ini' })
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

module.exports = router
