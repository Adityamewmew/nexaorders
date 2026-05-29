const express = require('express')
const prisma = require('../db')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

// GET /api/dashboard — statistik hari ini (admin dan kasir)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [totalMenu, totalMeja, totalKasir, transaksiHariIni, penjualanHariIni] = await Promise.all([
      prisma.product.count(),
      prisma.tableMeja.count(),
      prisma.user.count({ where: { role: 'CASHIER' } }),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.aggregate({
        where: { status: 'DONE', createdAt: { gte: today } },
        _sum: { total: true }
      })
    ])

    res.json({
      totalMenu,
      totalMeja,
      totalKasir,
      transaksiHariIni,
      penjualanHariIni: penjualanHariIni._sum.total || 0
    })
  } catch (e) {
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

// GET /api/dashboard/sales — laporan penjualan dengan filter tanggal (admin dan kasir)
router.get('/sales', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const where = { status: 'DONE' }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        const start = new Date(startDate)
        if (isNaN(start.getTime())) return res.status(400).json({ error: 'startDate tidak valid' })
        where.createdAt.gte = start
      }
      if (endDate) {
        const end = new Date(endDate)
        if (isNaN(end.getTime())) return res.status(400).json({ error: 'endDate tidak valid' })
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
        payment: true,
        table: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const totalPendapatan = orders.reduce((sum, o) => sum + o.total, 0)
    const totalTransaksi = orders.length
    const totalItemTerjual = orders.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
      0
    )

    res.json({
      orders,
      summary: { totalPendapatan, totalTransaksi, totalItemTerjual }
    })
  } catch (e) {
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

module.exports = router
