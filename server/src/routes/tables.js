const express = require('express')
const prisma = require('../db')
const { authMiddleware, adminOnly } = require('../middleware/auth')

const router = express.Router()

function parsePositiveInt(value) {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

// GET /api/tables — publik
router.get('/', async (req, res) => {
  try {
    const tables = await prisma.tableMeja.findMany({ orderBy: { id: 'asc' } })
    res.json(tables)
  } catch {
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

// POST /api/tables — admin only
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { number, status } = req.body
    if (!number || typeof number !== 'string' || number.trim().length === 0) {
      return res.status(400).json({ error: 'Nomor meja wajib' })
    }
    const table = await prisma.tableMeja.create({
      data: { number: number.trim(), status: status || 'aktif' }
    })
    res.status(201).json(table)
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'Nomor meja sudah ada' })
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

// PUT /api/tables/:id — admin only
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const id = parsePositiveInt(req.params.id)
    if (!id) return res.status(400).json({ error: 'ID meja tidak valid' })
    const { number, status } = req.body
    const table = await prisma.tableMeja.update({
      where: { id },
      data: { number, status }
    })
    res.json(table)
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Meja tidak ditemukan' })
    if (e.code === 'P2002') return res.status(400).json({ error: 'Nomor meja sudah ada' })
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

// DELETE /api/tables/:id — admin only
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const id = parsePositiveInt(req.params.id)
    if (!id) return res.status(400).json({ error: 'ID meja tidak valid' })
    await prisma.tableMeja.delete({ where: { id } })
    res.json({ message: 'Meja dihapus' })
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Meja tidak ditemukan' })
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

module.exports = router
