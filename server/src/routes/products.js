const express = require('express')
const prisma = require('../db')
const { authMiddleware, adminOnly } = require('../middleware/auth')

const router = express.Router()
const VALID_PRODUCT_STATUSES = ['tersedia', 'habis']

function parseNonNegativeInt(value) {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null
}

function parsePositiveInt(value) {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

// GET /api/products — publik, bisa filter by categoryId
router.get('/', async (req, res) => {
  try {
    const { categoryId } = req.query
    if (categoryId !== undefined) {
      const parsedCategoryId = parsePositiveInt(categoryId)
      if (!parsedCategoryId) return res.status(400).json({ error: 'categoryId tidak valid' })
    }
    const where = categoryId ? { categoryId: parsePositiveInt(categoryId) } : {}
    const products = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' }
    })
    res.json(products)
  } catch (e) {
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

// GET /api/products/:id — publik
router.get('/:id', async (req, res) => {
  try {
    const id = parsePositiveInt(req.params.id)
    if (!id) return res.status(400).json({ error: 'ID produk tidak valid' })

    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true }
    })
    if (!product) return res.status(404).json({ error: 'Produk tidak ditemukan' })
    res.json(product)
  } catch (e) {
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

// POST /api/products — admin only
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, price, stock, description, image, categoryId, status } = req.body
    const parsedPrice = parsePositiveInt(price)
    const parsedStock = stock === undefined ? 0 : parseNonNegativeInt(stock)
    const parsedCategoryId = parsePositiveInt(categoryId)
    if (!name || !parsedPrice || !parsedCategoryId || parsedStock === null) {
      return res.status(400).json({ error: 'Nama, harga, dan kategori wajib' })
    }
    if (status && !VALID_PRODUCT_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Status produk tidak valid' })
    }
    const product = await prisma.product.create({
      data: {
        name,
        price: parsedPrice,
        stock: parsedStock,
        description: description || null,
        image: image || null,
        categoryId: parsedCategoryId,
        status: status || 'tersedia'
      },
      include: { category: true }
    })
    res.status(201).json(product)
  } catch (e) {
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

// PUT /api/products/:id — admin only
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, price, stock, description, image, categoryId, status } = req.body
    const id = parsePositiveInt(req.params.id)
    if (!id) return res.status(400).json({ error: 'ID produk tidak valid' })

    const parsedPrice = price !== undefined ? parsePositiveInt(price) : undefined
    const parsedStock = stock !== undefined ? parseNonNegativeInt(stock) : undefined
    const parsedCategoryId = categoryId !== undefined ? parsePositiveInt(categoryId) : undefined

    if (price !== undefined && !parsedPrice) return res.status(400).json({ error: 'Harga tidak valid' })
    if (stock !== undefined && parsedStock === null) return res.status(400).json({ error: 'Stok tidak valid' })
    if (categoryId !== undefined && !parsedCategoryId) return res.status(400).json({ error: 'Kategori tidak valid' })
    if (status && !VALID_PRODUCT_STATUSES.includes(status)) return res.status(400).json({ error: 'Status produk tidak valid' })

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        price: parsedPrice,
        stock: parsedStock,
        description,
        image,
        categoryId: parsedCategoryId,
        status
      },
      include: { category: true }
    })
    res.json(product)
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Produk tidak ditemukan' })
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

// PATCH /api/products/:id/stock — admin dan kasir
router.patch('/:id/stock', authMiddleware, async (req, res) => {
  try {
    const { stock, status } = req.body
    const id = parsePositiveInt(req.params.id)
    if (!id) return res.status(400).json({ error: 'ID produk tidak valid' })

    const data = {}
    if (stock !== undefined) {
      const parsedStock = parseNonNegativeInt(stock)
      if (parsedStock === null) return res.status(400).json({ error: 'Stok tidak valid' })
      data.stock = parsedStock
    }
    if (status) {
      if (!VALID_PRODUCT_STATUSES.includes(status)) return res.status(400).json({ error: 'Status produk tidak valid' })
      data.status = status
    }
    if (Object.keys(data).length === 0) return res.status(400).json({ error: 'Tidak ada perubahan stok/status' })

    const product = await prisma.product.update({
      where: { id },
      data
    })
    res.json(product)
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Produk tidak ditemukan' })
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

// DELETE /api/products/:id — admin only
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const id = parsePositiveInt(req.params.id)
    if (!id) return res.status(400).json({ error: 'ID produk tidak valid' })
    await prisma.product.delete({ where: { id } })
    res.json({ message: 'Produk dihapus' })
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Produk tidak ditemukan' })
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

module.exports = router
