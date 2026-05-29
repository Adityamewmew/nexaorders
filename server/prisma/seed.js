require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const pg = require('pg')
const bcrypt = require('bcryptjs')

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const initialPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!'
  const hashedPassword = await bcrypt.hash(initialPassword, 10)

  // Superadmin platform
  await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      username: 'superadmin',
      email: 'admin@nexaorder.com',
      password: hashedPassword,
      name: 'Rio Superadmin',
      role: 'SUPERADMIN',
      status: 'aktif'
    }
  })

  // Merchant admin
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { role: 'MERCHANT_ADMIN', email: 'arifin@bakso.com' },
    create: {
      username: 'admin',
      email: 'arifin@bakso.com',
      password: hashedPassword,
      name: 'Arifin (Pemilik)',
      role: 'MERCHANT_ADMIN',
      status: 'aktif'
    }
  })

  // Kategori default
  const categories = ['Makanan', 'Minuman', 'Lainnya']
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name }
    })
  }

  console.log('Seed selesai: superadmin + merchant admin + 3 kategori')
  // Password tidak dicetak ke console untuk keamanan
  // Gunakan SEED_ADMIN_PASSWORD di .env untuk mengatur password awal
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
