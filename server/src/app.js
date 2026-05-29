// Load .env menggunakan dotenv v16 yang sudah di-install
require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

const express = require('express')
const cors = require('cors')
const path = require('path')
const rateLimit = require('express-rate-limit')

const authRoutes = require('./routes/auth')
const categoryRoutes = require('./routes/kategori')
const productRoutes = require('./routes/products')
const tableRoutes = require('./routes/tables')
const orderRoutes = require('./routes/orders')
const paymentRoutes = require('./routes/payments')
const userRoutes = require('./routes/users')
const dashboardRoutes = require('./routes/dashboard')
const uploadRoutes = require('./routes/upload')

const app = express()

// CORS — hanya izinkan origin yang terdaftar
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    // Izinkan request tanpa origin (Postman, server-to-server)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new Error('Origin tidak diizinkan oleh CORS'))
  },
  credentials: true,
}))

app.use(express.json({ limit: '1mb' }))

// Rate limiting global — lebih longgar di development
const globalMax = process.env.NODE_ENV === 'production' ? 100 : 1000
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: globalMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak request, coba lagi nanti' },
  skip: (req) => process.env.NODE_ENV !== 'production' && (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1'),
})
app.use(globalLimiter)

// Serve uploaded images — gunakan path.resolve untuk keamanan
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/products', productRoutes)
app.use('/api/tables', tableRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/users', userRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/upload', uploadRoutes)

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }))

// Global error handler — jangan bocorkan detail error ke client
app.use((err, req, res, _next) => {
  console.error('[ERROR]', err.message)
  if (err.message === 'Origin tidak diizinkan oleh CORS') {
    return res.status(403).json({ error: 'Origin tidak diizinkan' })
  }
  res.status(500).json({ error: 'Terjadi kesalahan server' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
