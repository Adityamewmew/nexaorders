const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const rateLimit = require('express-rate-limit')
const prisma = require('../db')
const { authMiddleware, adminOnly } = require('../middleware/auth')

const router = express.Router()

// P2: Rate limiting — max 10 percobaan login per 15 menit per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' },
})

const ALLOWED_ROLES_BY_CREATOR = {
  SUPERADMIN: ['MERCHANT_ADMIN', 'CASHIER'],
  MERCHANT_ADMIN: ['CASHIER']
}

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body
    const identifier = email || username
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/email dan password wajib diisi' })
    }

    const user = await prisma.user.findFirst({
      where: { OR: [{ username: identifier }, { email: identifier }] }
    })

    // Gunakan pesan generik untuk mencegah user enumeration
    if (!user) return res.status(401).json({ error: 'Username/email atau password salah' })
    if (user.status === 'nonaktif') return res.status(403).json({ error: 'Akun nonaktif' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Username/email atau password salah' })

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' } // Kurangi dari 24h ke 8h
    )

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, name: user.name, role: user.role }
    })
  } catch {
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

// POST /api/auth/register — buat akun (admin only)
router.post('/register', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { username, email, password, name, role = 'CASHIER', photo } = req.body
    if (!username || !password || !name) {
      return res.status(400).json({ error: 'Username, password, dan nama wajib diisi' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter' })
    }
    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ error: 'Username harus 3-50 karakter' })
    }

    const allowedRoles = ALLOWED_ROLES_BY_CREATOR[req.user.role] || []
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Role yang diminta tidak diizinkan' })
    }

    const hashed = await bcrypt.hash(password, 12) // Naikkan cost factor ke 12
    const user = await prisma.user.create({
      data: { username, email: email || null, password: hashed, name, role, photo: photo || null }
    })

    res.status(201).json({ id: user.id, username: user.username, email: user.email, name: user.name, role: user.role })
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'Username atau email sudah digunakan' })
    res.status(500).json({ error: 'Terjadi kesalahan server' })
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

    const hashed = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } })
    res.json({ message: 'Password berhasil diubah' })
  } catch {
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

// GET /api/auth/me — verifikasi token masih valid (P3)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, email: true, name: true, role: true, status: true }
    })
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' })
    res.json(user)
  } catch {
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

module.exports = router
