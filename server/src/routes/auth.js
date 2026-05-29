const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../db')
const { authMiddleware, adminOnly } = require('../middleware/auth')

const router = express.Router()

// POST /api/auth/login — support email atau username
router.post('/login', async (req, res) => {
  try {
    const { username, email, password } = req.body
    const identifier = email || username
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/email dan password wajib diisi' })
    }

    const user = await prisma.user.findFirst({
      where: { OR: [{ username: identifier }, { email: identifier }] }
    })

    if (!user) return res.status(401).json({ error: 'Username/email atau password salah' })
    if (user.status === 'nonaktif') return res.status(403).json({ error: 'Akun nonaktif' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Username/email atau password salah' })

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, name: user.name, role: user.role }
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/auth/register — buat akun kasir (admin only)
router.post('/register', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { username, email, password, name, role = 'CASHIER', photo } = req.body
    if (!username || !password || !name) {
      return res.status(400).json({ error: 'Username, password, dan nama wajib diisi' })
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { username, email: email || null, password: hashed, name, role, photo: photo || null }
    })

    res.status(201).json({ id: user.id, username: user.username, email: user.email, name: user.name, role: user.role })
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'Username atau email sudah digunakan' })
    res.status(500).json({ error: e.message })
  }
})

// PATCH /api/auth/change-password — user ganti password sendiri
router.patch('/change-password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body
    if (!oldPassword || !newPassword) return res.status(400).json({ error: 'Password lama dan baru wajib diisi' })
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password baru minimal 6 karakter' })

    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' })

    const valid = await bcrypt.compare(oldPassword, user.password)
    if (!valid) return res.status(401).json({ error: 'Password lama tidak sesuai' })

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } })
    res.json({ message: 'Password berhasil diubah' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
