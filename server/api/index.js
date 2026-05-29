// Entry point untuk Vercel Serverless
// Vercel akan import file ini dan handle request/response sendiri
require('dotenv').config()
const app = require('../src/app')

module.exports = app
