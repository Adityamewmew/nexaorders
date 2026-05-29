const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

// Buat folder uploads jika belum ada
const uploadDir = path.resolve(__dirname, '../../uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

// Simpan ke memori dulu untuk validasi magic bytes
const storage = multer.memoryStorage()

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp']

// Magic bytes untuk validasi konten aktual file
const MAGIC_BYTES = {
  'image/jpeg': [Buffer.from([0xFF, 0xD8, 0xFF])],
  'image/png': [Buffer.from([0x89, 0x50, 0x4E, 0x47])],
  'image/webp': [Buffer.from('RIFF'), Buffer.from('WEBP')],
}

function checkMagicBytes(buffer, mime) {
  const signatures = MAGIC_BYTES[mime]
  if (!signatures) return false
  if (mime === 'image/webp') {
    // WEBP: bytes 0-3 = RIFF, bytes 8-11 = WEBP
    return buffer.slice(0, 4).equals(signatures[0]) &&
      buffer.slice(8, 12).equals(signatures[1])
  }
  return signatures.some(sig => buffer.slice(0, sig.length).equals(sig))
}

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (!ALLOWED_EXT.includes(ext) || !ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new Error('Format tidak didukung. Gunakan JPG, PNG, atau WebP'))
    }
    cb(null, true)
  }
})

// POST /api/upload — admin dan kasir
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Tidak ada file yang diupload' })

  // P3: Validasi magic bytes — cek konten aktual file
  if (!checkMagicBytes(req.file.buffer, req.file.mimetype)) {
    return res.status(400).json({ error: 'Konten file tidak sesuai dengan format yang diizinkan' })
  }

  // Simpan file ke disk setelah validasi
  const ext = path.extname(req.file.originalname).toLowerCase()
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`
  const filepath = path.join(uploadDir, filename)

  try {
    fs.writeFileSync(filepath, req.file.buffer)
    res.json({ url: `/uploads/${filename}` })
  } catch {
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

module.exports = router
