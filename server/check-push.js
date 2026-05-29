require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const pg = require('pg')
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })
async function main() {
  const subs = await prisma.pushSubscription.findMany()
  console.log('Total subscriptions:', subs.length)
  subs.forEach(s => console.log('- orderId:', s.orderId, '| endpoint:', s.endpoint.substring(0, 60) + '...'))
}
main().catch(console.error).finally(() => prisma.$disconnect())
