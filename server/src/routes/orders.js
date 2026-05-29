const express = require('express')
const prisma = require('../db')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

const VALID_ORDER_STATUSES = ['PENDING', 'PROCESS', 'DONE']

// P3: Validasi transisi status yang diizinkan
const VALID_TRANSITIONS = {
  PENDING: ['PROCESS'],
  PROCESS: ['DONE'],
  DONE: [],
}

function parsePositiveInt(value) {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

// POST /api/orders — customer buat pesanan (no auth)
router.post('/', async (req, res) => {
  try {
    const { tableId, items, customerName, phone } = req.body
    const parsedTableId = parsePositiveInt(tableId)
    if (!parsedTableId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'tableId dan items wajib' })
    }

    const table = await prisma.tableMeja.findUnique({ where: { id: parsedTableId } })
    if (!table || table.status !== 'aktif') {
      return res.status(400).json({ error: 'Meja tidak valid atau nonaktif' })
    }

    let total = 0
    const orderItems = []

    for (const item of items) {
      const productId = parsePositiveInt(item?.productId)
      const quantity = parsePositiveInt(item?.quantity)
      if (!productId || !quantity) {
        return res.status(400).json({ error: 'productId dan quantity wajib angka positif' })
      }

      const product = await prisma.product.findUnique({ where: { id: productId } })
      if (!product) return res.status(400).json({ error: `Produk tidak ditemukan` })
      if (product.status !== 'tersedia' || product.stock < quantity) {
        return res.status(400).json({ error: `Stok produk ${product.name} tidak mencukupi` })
      }

      const subtotal = product.price * quantity
      total += subtotal
      orderItems.push({
        productId,
        quantity,
        note: typeof item.note === 'string' ? item.note.slice(0, 500) : null,
        toppings: null,
        subtotal
      })
    }

    const order = await prisma.order.create({
      data: {
        tableId: parsedTableId,
        customerName: customerName ? String(customerName).slice(0, 100) : null,
        phone: phone ? String(phone).slice(0, 20) : null,
        total,
        items: { create: orderItems }
      },
      include: { items: { include: { product: true } }, table: true }
    })

    res.status(201).json(order)
  } catch {
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

// GET /api/orders/:id — customer cek status (no auth)
router.get('/:id', async (req, res) => {
  try {
    const id = parsePositiveInt(req.params.id)
    if (!id) return res.status(400).json({ error: 'ID pesanan tidak valid' })

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, table: true, payment: true }
    })
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan' })
    res.json(order)
  } catch {
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

// GET /api/orders — kasir dan admin
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status } = req.query
    // P2: Validasi query param status
    if (status && !VALID_ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Status tidak valid' })
    }
    const where = status ? { status } : {}
    const orders = await prisma.order.findMany({
      where,
      include: { items: { include: { product: true } }, table: true, payment: true },
      orderBy: { createdAt: 'desc' }
    })
    res.json(orders)
  } catch {
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

// PATCH /api/orders/:id/status — kasir dan admin
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body
    const id = parsePositiveInt(req.params.id)
    if (!id) return res.status(400).json({ error: 'ID pesanan tidak valid' })
    if (!VALID_ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Status tidak valid' })
    }

    // P3: Validasi transisi status
    const current = await prisma.order.findUnique({ where: { id }, select: { status: true } })
    if (!current) return res.status(404).json({ error: 'Pesanan tidak ditemukan' })

    const allowed = VALID_TRANSITIONS[current.status] || []
    if (!allowed.includes(status)) {
      return res.status(400).json({
        error: `Tidak bisa mengubah status dari ${current.status} ke ${status}`
      })
    }

    const order = await prisma.order.update({ where: { id }, data: { status } })
    res.json(order)
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Pesanan tidak ditemukan' })
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

module.exports = router
