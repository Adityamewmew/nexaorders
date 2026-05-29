# 🔍 Audit Report — NexaOrder Project

> **Tanggal Audit:** 2026-05-29  
> **Scope:** Full-stack — Express.js (server) + React/Redux (client)  
> **Severity Legend:** 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low / Info

---

## 1. RINGKASAN EKSEKUTIF

| Area | Temuan | Severity Tertinggi |
|------|--------|--------------------|
| Secrets & Config | JWT secret lemah, DB credential hardcoded di .env | 🔴 Critical |
| Authentication | Tidak ada rate limiting, token tidak bisa di-revoke | 🔴 Critical |
| Authorization | Order & Payment bisa diakses/dibuat siapapun tanpa auth | 🟠 High |
| Input Validation | Beberapa endpoint tidak validasi input sepenuhnya | 🟡 Medium |
| Error Handling | Stack trace bocor ke client via `e.message` | 🟠 High |
| File Upload | MIME type mudah dipalsu, tidak ada scan malware | 🟡 Medium |
| Frontend Auth | Token disimpan di `localStorage` (rentan XSS) | 🟠 High |
| Frontend Route Guard | Proteksi hanya di client-side (bypassable) | 🟡 Medium |
| Database Schema | Role & status pakai `String` bukan Enum Prisma | 🟢 Low |
| CORS | `allowedOrigins` kosong = allow all origins | 🔴 Critical |

---

## 2. DETAIL TEMUAN

---

### 🔴 CRITICAL — Secrets & Environment

#### 2.1 JWT Secret Terlalu Lemah
**File:** [`server/.env` L2](file:///c:/laragon/www/nexaw/server/.env#L2)

```
JWT_SECRET="nexaorder_secret_key_2026"
```

- Secret predictable, pendek, tidak random.
- Siapapun yang mengetahui pola nama bisa mencoba brute-force signature JWT.

**Rekomendasi:**
```bash
# Generate secret kuat (min 256-bit)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

#### 2.2 Database Credential Terekspos di .env (Production Risk)
**File:** [`server/.env` L1](file:///c:/laragon/www/nexaw/server/.env#L1)

Database URL Neon (production) beserta password **tersimpan di file `.env` yang ada di repository root** — `.gitignore` sudah benar mengexclude `.env`, namun credential ini adalah DB production nyata.

> [!CAUTION]
> Jika repository pernah di-push dalam kondisi `.env` tidak ter-ignore (misal lupa di awal), credential ini sudah bocor ke git history. Segera **rotate password** di Neon dashboard.

---

#### 2.3 CORS Terlalu Permisif — Allow All Origins
**File:** [`server/src/app.js` L27-L38](file:///c:/laragon/www/nexaw/server/src/app.js#L27-L38)

```js
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  ...
if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
  return callback(null, true)  // ← ALLOW ALL jika CORS_ORIGINS tidak diset!
}
```

`CORS_ORIGINS` **tidak ada** di file `.env` server, sehingga `allowedOrigins = []` → semua origin diizinkan. Ini membuat API bisa dipanggil dari domain mana saja.

**Rekomendasi:**
```
# Tambahkan ke server/.env
CORS_ORIGINS=http://localhost:5173,https://yourdomain.com
```

---

### 🟠 HIGH — Authentication

#### 2.4 Tidak Ada Rate Limiting pada Login Endpoint
**File:** [`server/src/routes/auth.js` L14-L45](file:///c:/laragon/www/nexaw/server/src/routes/auth.js#L14-L45)

`POST /api/auth/login` tidak punya throttling. Attacker bisa melakukan brute-force password tanpa batas.

**Rekomendasi:** Pasang `express-rate-limit` minimal untuk auth endpoints:
```js
const rateLimit = require('express-rate-limit')
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 })
router.post('/login', loginLimiter, async (req, res) => { ... })
```

---

#### 2.5 Token JWT Tidak Bisa Di-Revoke (No Token Blacklist)
**File:** [`server/src/middleware/auth.js`](file:///c:/laragon/www/nexaw/server/src/middleware/auth.js)

Token berlaku selama **24 jam** tanpa mekanisme revoke. Jika user logout, token lama masih valid hingga expire. Jika akun di-nonaktifkan, user yang sedang login tetap bisa akses API.

**Rekomendasi:** Implementasi blacklist token di Redis, atau gunakan token berumur pendek (15 menit) + refresh token mechanism.

---

#### 2.6 Status Akun Hanya Dicek Saat Login, Bukan Per-Request
**File:** [`server/src/routes/auth.js` L27](file:///c:/laragon/www/nexaw/server/src/routes/auth.js#L27)

```js
if (user.status === 'nonaktif') return res.status(403).json({ error: 'Akun nonaktif' })
```

Pengecekan `status === 'nonaktif'` hanya terjadi saat login. Jika admin men-nonaktifkan akun kasir yang sedang aktif, kasir tersebut **masih bisa mengakses semua endpoint** sampai tokennya expire (24 jam).

**Rekomendasi:** Tambahkan pengecekan status di `authMiddleware`:
```js
const user = await prisma.user.findUnique({ where: { id: decoded.id }, select: { status: true } })
if (!user || user.status === 'nonaktif') return res.status(401).json({ error: 'Akun nonaktif' })
```

---

### 🟠 HIGH — Authorization

#### 2.7 Payment Endpoint Tidak Memerlukan Auth
**File:** [`server/src/routes/payments.js` L10-L40](file:///c:/laragon/www/nexaw/server/src/routes/payments.js#L10-L40)

```js
// POST /api/payments — customer bayar (no auth)
router.post('/', async (req, res) => { ... })
```

Siapapun bisa membuat record payment untuk **order manapun** cukup dengan mengetahui `orderId`. Ini memungkinkan:
- Memarking order orang lain sebagai "sudah dibayar"  
- Flooding database dengan payment records palsu

**Rekomendasi:** Setidaknya validasi bahwa payment belum ada sebelumnya (sudah ada `P2002` catch), dan pertimbangkan apakah customer memang boleh trigger payment atau harus kasir yang konfirmasi.

---

#### 2.8 Order GET/:id Tidak Ada Auth — Semua Data Order Bisa Diakses
**File:** [`server/src/routes/orders.js` L74-L93](file:///c:/laragon/www/nexaw/server/src/routes/orders.js#L74-L93)

```js
// GET /api/orders/:id — customer cek status pesanan (no auth)
router.get('/:id', async (req, res) => { ... })
```

Data order mencakup `customerName`, `phone`, `items`, dan `payment` — semua bisa diakses oleh siapapun yang mengetahui `orderId` (yang hanya berupa auto-increment integer). Attacker bisa enumerate semua order dengan loop `id=1,2,3...`.

**Rekomendasi:** Gunakan UUID untuk Order ID, atau tambahkan token sesi per-pelanggan.

---

#### 2.9 `PATCH /api/orders/:id/status` Tidak Ada Validasi Role
**File:** [`server/src/routes/orders.js` L119-L137](file:///c:/laragon/www/nexaw/server/src/routes/orders.js#L119-L137)

```js
router.patch('/:id/status', authMiddleware, async (req, res) => {
```

Hanya menggunakan `authMiddleware` — artinya **siapapun yang login** (termasuk Kasir) bisa mengubah status order ke apapun termasuk `DONE`, yang seharusnya hanya dilakukan setelah payment konfirmasi.

---

### 🟠 HIGH — Error Handling & Information Disclosure

#### 2.10 Stack Trace / Error Message Bocor ke Client
**File:** Semua routes — contoh [`orders.js` L70](file:///c:/laragon/www/nexaw/server/src/routes/orders.js#L70)

```js
} catch (e) {
  res.status(500).json({ error: e.message })  // ← BOCOR!
}
```

**Ditemukan di:** `auth.js`, `users.js`, `orders.js`, `products.js`, `payments.js`, `tables.js`, `kategori.js`, `dashboard.js` — **semua routes**.

Error message dari Prisma, Node.js, atau database bisa mengandung informasi sensitif: nama tabel, query SQL, path server, dll.

**Rekomendasi:**
```js
} catch (e) {
  console.error('[ERROR]', e) // log hanya di server
  res.status(500).json({ error: 'Terjadi kesalahan server' }) // generic ke client
}
```

---

### 🟡 MEDIUM — Input Validation

#### 2.11 `tables.js` Menggunakan `parseInt` Tanpa Validasi
**File:** [`server/src/routes/tables.js` L37, L51](file:///c:/laragon/www/nexaw/server/src/routes/tables.js#L37)

```js
where: { id: parseInt(req.params.id) }  // jika NaN → Prisma error!
```

`PUT /api/tables/:id` dan `DELETE /api/tables/:id` menggunakan `parseInt` langsung tanpa validasi — berbeda dengan file lain yang menggunakan helper `parsePositiveInt()`. Jika `:id` bukan angka, Prisma akan throw error yang kemudian bocor ke client (lihat #2.10).

Sama juga di [`kategori.js` L27](file:///c:/laragon/www/nexaw/server/src/routes/kategori.js#L27).

---

#### 2.12 `GET /api/orders` Tidak Validasi Query Param `status`
**File:** [`server/src/routes/orders.js` L100-L117](file:///c:/laragon/www/nexaw/server/src/routes/orders.js#L100-L117)

```js
const { status } = req.query
const where = status ? { status } : {}
```

Query `?status=INVALID_STATUS` akan diteruskan ke Prisma tanpa validasi. Seharusnya divalidasi terhadap `VALID_ORDER_STATUSES`.

---

#### 2.13 `GET /api/dashboard/sales` — Date Injection Risk
**File:** [`server/src/routes/dashboard.js` L44-L48](file:///c:/laragon/www/nexaw/server/src/routes/dashboard.js#L44-L48)

```js
if (startDate) where.createdAt.gte = new Date(startDate)
```

Input `startDate` langsung dilempar ke `new Date()` tanpa sanitasi. Nilai yang invalid akan menghasilkan `Invalid Date` yang diteruskan ke Prisma query. Prisma ORM akan reject ini, tapi error message akan bocor (lihat #2.10).

---

### 🟡 MEDIUM — File Upload

#### 2.14 MIME Type Bisa Dipalsu
**File:** [`server/src/routes/upload.js` L22-L28](file:///c:/laragon/www/nexaw/server/src/routes/upload.js#L22-L28)

```js
const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp']
  const allowedMime = ['image/jpeg', 'image/png', 'image/webp']
  const ext = path.extname(file.originalname).toLowerCase()
  if (allowed.includes(ext) && allowedMime.includes(file.mimetype)) cb(null, true)
```

`file.mimetype` dikirim oleh browser/client — bisa dimanipulasi. File berbahaya (misalnya script PHP dengan ekstensi `.jpg`) bisa diupload jika MIME type header dipalsu. Harus divalidasi menggunakan **magic bytes** (file signature) dari konten aktual file.

**Rekomendasi:** Gunakan library `file-type` untuk deteksi MIME dari content:
```js
import { fileTypeFromBuffer } from 'file-type'
const type = await fileTypeFromBuffer(buffer)
```

---

#### 2.15 Tidak Ada Anti-Directory Traversal di Served Static Files

**File:** [`server/src/app.js` L43-L44](file:///c:/laragon/www/nexaw/server/src/app.js#L43-L44)

```js
app.use('/uploads', serveStatic(path.join(__dirname, '../uploads')))
```

`serve-static` secara default aman dari path traversal, namun `../uploads` adalah path relatif yang bisa berbahaya jika ada symlink attacks. Gunakan `path.resolve()`:
```js
app.use('/uploads', serveStatic(path.resolve(__dirname, '../uploads')))
```

---

### 🟠 HIGH — Frontend Security

#### 2.16 Token JWT Disimpan di `localStorage` (Rentan XSS)
**File:** [`client/src/features/auth/authSlice.ts` L21](file:///c:/laragon/www/nexaw/client/src/features/auth/authSlice.ts#L21)

```ts
localStorage.setItem('nexa_token', action.payload.token);
```

`localStorage` bisa diakses oleh JavaScript apa saja di halaman yang sama. Jika ada celah XSS (misalnya dari user input yang tidak di-sanitize), token bisa dicuri.

**Rekomendasi Terbaik:** Gunakan `httpOnly` cookie yang tidak bisa diakses JS. Ini memerlukan perubahan di backend (set cookie saat login, kirim via cookie header).

**Rekomendasi Minimal:** Pastikan semua user input di-sanitize dan tidak ada `dangerouslySetInnerHTML`.

---

#### 2.17 Seluruh Auth State Disimpan di `localStorage` — Token Tidak Expired di Client
**File:** [`client/src/store/index.ts` L34-L40](file:///c:/laragon/www/nexaw/client/src/store/index.ts#L34-L40)

```ts
const stateToSave = {
  auth: state.auth,   // ← termasuk user info
  customer: state.customer,
};
```

`auth.user` (berisi `id`, `username`, `email`, `role`) disimpan ke `localStorage`. Saat app dibuka kembali, state ini di-load tanpa verifikasi apakah token masih valid di server. User bisa tetap "terlihat" logged in di client padahal token sudah expire atau direvoke.

**Rekomendasi:** Tambahkan `GET /api/auth/me` endpoint dan validasi token saat app pertama kali load (di `useEffect` pada root component).

---

#### 2.18 ProtectedRoute Hanya Client-Side Guard
**File:** [`client/src/components/ProtectedRoute.tsx`](file:///c:/laragon/www/nexaw/client/src/components/ProtectedRoute.tsx)

```ts
const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
```

Proteksi route hanya bergantung pada Redux store yang bisa dimanipulasi di browser. Ini **bukan bug** per se (karena real protection ada di server), namun perlu dipastikan semua API call tetap memerlukan token valid.

---

### 🟢 LOW / INFO

#### 2.19 Prisma Schema: Role & Status Sebaiknya Menggunakan Enum
**File:** [`server/prisma/schema.prisma`](file:///c:/laragon/www/nexaw/server/prisma/schema.prisma)

```prisma
role   String @default("CASHIER")   // ← bisa diisi nilai apapun
status String @default("aktif")     // ← bisa diisi nilai apapun
```

Menggunakan `String` berarti validasi harus dilakukan di aplikasi level. Jika ada query langsung ke DB atau bug validasi, nilai arbitrary bisa masuk.

**Rekomendasi:**
```prisma
enum Role {
  SUPERADMIN
  MERCHANT_ADMIN
  CASHIER
}

enum UserStatus {
  aktif
  nonaktif
}
```

---

#### 2.20 Seed Script Mencetak Password ke Console
**File:** [`server/prisma/seed.js` L54](file:///c:/laragon/www/nexaw/server/prisma/seed.js#L54)

```js
console.log(`Password awal akun seed: ${initialPassword}`)
```

Password plaintext tercetak di console/log. Jika log di-capture (CI/CD, log aggregation), password terekspos.

---

#### 2.21 `env` Loading Manual — Potensi Bug dengan Nilai Multi-Line
**File:** [`server/src/app.js` L2-L12](file:///c:/laragon/www/nexaw/server/src/app.js#L2-L12)

```js
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const [key, ...vals] = line.split('=')
  process.env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '')
})
```

Custom `.env` parser ini tidak menangani nilai multi-line, Windows CRLF sepenuhnya (meski ada `\r` yang mungkin termakan dalam key), atau komentar inline. Gunakan `dotenv` yang sudah battle-tested.

---

#### 2.22 `tenantId` di Customer Route Tidak Digunakan di Backend
**File:** [`client/src/App.tsx` L117](file:///c:/laragon/www/nexaw/client/src/App.tsx#L117)

```tsx
<Route path="/m/:tenantId/:tableId" element={<CustomerLayout />}>
```

Route customer memiliki `:tenantId` di URL, tapi backend tidak memiliki konsep multi-tenancy — tidak ada filtering berdasarkan merchant/tenant. Semua request langsung ke satu database. Ini bisa menjadi masalah di masa depan jika platform digunakan oleh beberapa merchant.

---

## 3. FLOW AUDIT

### Flow 1: Login (Merchant/Admin)

```
Client → POST /api/auth/login
  → [❌ No Rate Limit]
  → Cari user by username/email
  → Cek status
  → bcrypt.compare
  → JWT sign (24h)
  → Return token
```

**Masalah:** Tidak ada rate limiting. Token 24h tanpa revoke.

---

### Flow 2: Customer Order (QR Code)

```
Scan QR → /m/:tenantId/:tableId
  → [❌ tenantId tidak dipakai di backend]
  → Lihat menu (GET /api/products — publik ✅)
  → Tambah ke keranjang (client-side state ✅)
  → POST /api/orders (no auth)
    → [❌ customerName & phone tidak divalidasi panjang/format]
    → Validasi stock → Kurangi stock
    → [⚠️ Race condition: jika 2 order bersamaan, stock bisa negative]
    → Return orderId
  → POST /api/payments (no auth)
    → [❌ siapapun bisa submit payment untuk order mana saja]
    → Tidak ada konfirmasi kasir untuk payment QRIS
```

---

### Flow 3: Kasir Update Order Status

```
Kasir login → Token (24h)
  → GET /api/orders ✅ (auth required)
  → PATCH /api/orders/:id/status ⚠️
    → [❌ tidak ada validasi transisi status: bisa loncat dari PENDING ke DONE langsung]
    → [❌ tidak ada validasi apakah payment sudah dibuat sebelum set DONE]
```

---

### Flow 4: Admin Manage Staff

```
Admin login → Token
  → POST /api/auth/register ✅ (adminOnly)
    → [✅ Role check by ALLOWED_ROLES_BY_CREATOR]
    → [⚠️ photo field diterima dari body tapi tidak divalidasi URL/path]
  → PATCH /api/users/:id ✅ (adminOnly)
    → [✅ resolveTargetUser dengan role check]
  → DELETE /api/users/:id ✅ (adminOnly)
```

---

### Flow 5: Upload Gambar Produk

```
Admin/Kasir → POST /api/upload
  → authMiddleware ✅
  → multer fileFilter:
    → [⚠️ MIME type dari header, bisa dipalsu]
    → Ekstensi di-check ✅
  → File disimpan dengan nama: timestamp + random (aman dari overwrites ✅)
  → Return URL path
```

---

## 4. PRIORITAS PERBAIKAN

| Prioritas | Item | Effort |
|-----------|------|--------|
| 🔴 P1 | Ganti JWT_SECRET dengan nilai random kuat | Rendah |
| 🔴 P1 | Set CORS_ORIGINS di .env server | Rendah |
| 🔴 P1 | Rotate DB credential Neon (jika repo pernah public) | Rendah |
| 🟠 P2 | Tambah rate limiting di login endpoint | Rendah |
| 🟠 P2 | Generic error message di semua catch blocks | Rendah |
| 🟠 P2 | Validasi status akun di authMiddleware (per-request) | Sedang |
| 🟠 P2 | Perbaiki `parseInt` tanpa validasi di `tables.js` & `kategori.js` | Rendah |
| 🟡 P3 | Validasi transisi status order | Sedang |
| 🟡 P3 | UUID untuk Order ID (mencegah enumeration) | Sedang |
| 🟡 P3 | MIME validation via magic bytes di upload | Sedang |
| 🟡 P3 | `GET /api/auth/me` endpoint + verify token on app load | Sedang |
| 🟡 P3 | Validasi `startDate`/`endDate` di dashboard/sales | Rendah |
| 🟢 P4 | Enum di Prisma schema untuk role & status | Sedang (migration) |
| 🟢 P4 | Jangan print password di seed console.log | Rendah |
| 🟢 P4 | Ganti custom .env parser dengan `dotenv` | Rendah |
