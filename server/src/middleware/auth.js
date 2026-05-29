const jwt = require('jsonwebtoken')

// Catatan: Tidak query DB per-request untuk performa.
// Status akun dicek saat login. Token expire dalam 8 jam.
// Jika akun di-nonaktifkan, kasir masih bisa akses sampai token expire (max 8 jam).
// Trade-off yang acceptable untuk performa.

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Token required' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
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
