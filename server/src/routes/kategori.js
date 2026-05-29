const express = require('express')
const prisma = require('../db')
const { authMiddleware, adminOnly } = require('../middleware/auth')

const router = express.Router()

function parsePositiveInt(value) {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({ include: { products: true } })
    res.json(categories)
  } catch {
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name } = req.body
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Nama kategori wajib' })
    }
    const category = await prisma.category.create({ data: { name: name.trim() } })
    res.status(201).json(category)
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'Kategori sudah ada' })
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const id = parsePositiveInt(req.params.id)
    if (!id) return res.status(400).json({ error: 'ID kategori tidak valid' })
    await prisma.category.delete({ where: { id } })
    res.json({ message: 'Kategori dihapus' })
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Kategori tidak ditemukan' })
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

module.exports = router
