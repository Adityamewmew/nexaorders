const jwt = require('jsonwebtoken')
const prisma = require('../db')

async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Token required' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // P2: Validasi status akun per-request (bukan hanya saat login)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, status: true, role: true }
    })
    if (!user || user.status === 'nonaktif') {
      return res.status(401).json({ error: 'Akun tidak aktif atau tidak ditemukan' })
    }

    req.user = decoded
    next()
  } catch (e) {
    if (e.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired' })
    return res.status(401).json({ error: 'Invalid token' })
  }
}

function adminOnly(req, res, next) {
  if (!['SUPERADMIN', 'MERCHANT_ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Akses ditolak' })
  }
  next()
}

module.exports = { authMiddleware, adminOnly }
