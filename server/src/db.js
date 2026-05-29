const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const pg = require('pg')

// Singleton pattern — reuse koneksi di Vercel serverless
// Mencegah pembuatan koneksi baru setiap function invocation
let prisma

if (!global.__prisma) {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,           // max 5 koneksi (Neon free tier limit)
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  })
  const adapter = new PrismaPg(pool)
  global.__prisma = new PrismaClient({ adapter })
}

prisma = global.__prisma

module.exports = prisma
