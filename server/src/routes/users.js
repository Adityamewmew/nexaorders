const express = require('express')
const bcrypt = require('bcryptjs')
const prisma = require('../db')
const { authMiddleware, adminOnly } = require('../middleware/auth')

const router = express.Router()
const MANAGEABLE_ROLES_BY_ACTOR = {
  SUPERADMIN: ['SUPERADMIN', 'MERCHANT_ADMIN', 'CASHIER'],
  MERCHANT_ADMIN: ['CASHIER']
}

function parseId(value) {
  const id = Number.parseInt(value, 10)
  return Number.isInteger(id) && id > 0 ? id : null
}

async function resolveTargetUser(req, res) {
  const id = parseId(req.params.id)
  if (!id) {
    res.status(400).json({ error: 'ID user tidak valid' })
    return null
  }

  const target = await prisma.user.findUnique({ where: { id } })
  if (!target) {
    res.status(404).json({ error: 'User tidak ditemukan' })
    return null
  }

  const allowedRoles = MANAGEABLE_ROLES_BY_ACTOR[req.user.role] || []
  if (!allowedRoles.includes(target.role)) {
    res.status(403).json({ error: 'Tidak diizinkan mengelola role ini' })
    return null
  }

  if (req.user.role === 'MERCHANT_ADMIN' && target.id === req.user.id) {
    res.status(403).json({ error: 'Tidak bisa mengubah akun sendiri di endpoint ini' })
    return null
  }

  return { id, target }
}

// GET /api/users — admin only, bisa filter by role
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { role } = req.query
    const allowedRoles = MANAGEABLE_ROLES_BY_ACTOR[req.user.role] || []
    const where = role
      ? { role: String(role) }
      : { role: { in: allowedRoles } }

    if (role && !allowedRoles.includes(String(role))) {
      return res.status(403).json({ error: 'Role filter tidak diizinkan' })
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        status: true,
        photo: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(users)
  } catch (e) {
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

// PATCH /api/users/:id — edit nama atau status (admin only)
router.patch('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const resolved = await resolveTargetUser(req, res)
    if (!resolved) return

    const { name, status } = req.body
    const updates = {}
    if (name !== undefined) updates.name = String(name).trim()
    if (status !== undefined) {
      if (!['aktif', 'nonaktif'].includes(status)) {
        return res.status(400).json({ error: 'Status hanya boleh aktif/nonaktif' })
      }
      updates.status = status
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Tidak ada field yang diubah' })
    }

    const user = await prisma.user.update({
      where: { id: resolved.id },
      data: updates,
      select: { id: true, username: true, name: true, role: true, status: true }
    })
    res.json(user)
  } catch (e) {
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

// PATCH /api/users/:id/reset-password — reset password kasir (admin only)
router.patch('/:id/reset-password', authMiddleware, adminOnly, async (req, res) => {
  try {
    const resolved = await resolveTargetUser(req, res)
    if (!resolved) return

    const { password } = req.body
    if (!password) return res.status(400).json({ error: 'Password baru wajib' })
    if (password.length < 6) return res.status(400).json({ error: 'Password minimal 6 karakter' })
    const hashed = await bcrypt.hash(password, 10)
    await prisma.user.update({
      where: { id: resolved.id },
      data: { password: hashed }
    })
    res.json({ message: 'Password berhasil direset' })
  } catch (e) {
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

// DELETE /api/users/:id — hapus user (admin only)
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const resolved = await resolveTargetUser(req, res)
    if (!resolved) return

    await prisma.user.delete({ where: { id: resolved.id } })
    res.json({ message: 'User dihapus' })
  } catch (e) {
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

module.exports = router
