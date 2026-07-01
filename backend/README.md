# BM Computer - Backend API

Backend เดียว (modular monolith) บน **Cloudflare Worker** ด้วย **Hono + OpenAPI/Swagger**
รวม auth (session สั้น + HttpOnly cookie), บัญชีของฉัน, แคตตาล็อก, ออเดอร์, admin, และชำระเงิน
ออกแบบให้ **แยกเป็น microservice ทีหลังได้** โดยไม่ต้องรื้อ (แต่ละโดเมนแยกไฟล์ใน `src/modules/`)

- 📖 Swagger UI: `/api/docs`
- 📄 OpenAPI JSON: `/api/openapi.json`
- ❤️ Health: `/api/health`

---

## สถาปัตยกรรม

```
frontend (React/Vite, Cloudflare Pages)
        │  fetch(credentials:'include')  ->  ส่ง HttpOnly cookie อัตโนมัติ
        ▼
backend Worker (Hono + OpenAPI)   ← ไฟล์นี้
        │  service_role (ข้าม RLS อย่างปลอดภัยฝั่ง server) / anon (อ่าน public + auth)
        ▼
Supabase (PostgreSQL + Auth + RLS เป็น defense-in-depth)
```

### โครงสร้างโค้ด
```
src/
├── index.ts            entry: mount modules, CORS, Swagger UI, error handler
├── lib/
│   ├── env.ts          ชนิด Bindings + helper
│   ├── supabase.ts     adminClient (service_role) / anonClient
│   ├── cookies.ts      ออก/ล้างคุกกี้ session (access 15 นาที / refresh 7 วัน)
│   ├── session.ts      verify Supabase JWT (jose, เช็ค exp)
│   ├── middleware.ts   requireAuth / requireAdmin
│   ├── turnstile.ts    ตรวจ captcha ฝั่ง server
│   ├── http.ts         error กลาง + onError handler
│   └── openapi.ts      schema/response ที่ใช้ซ้ำ
└── modules/
    ├── auth.ts         register / login / refresh / logout / me
    ├── account.ts      profile, addresses, tax-profiles, payment-methods, wishlist, summary
    ├── catalog.ts      products / categories / brands / slides (อ่าน public)
    ├── orders.ts       create / my orders / track by code
    ├── admin.ts        products/slides/orders/stats/settings CRUD (requireAdmin) + settings อ่าน public
    └── payments.ts     verify-slip (EasySlip)
```

---

## โมเดล Auth + Session (สำคัญ)

ห่อ **Supabase Auth** ไว้ข้างหลัง แล้วจัดการ session ด้วย **HttpOnly cookie** (JS ฝั่ง client อ่านไม่ได้ = กัน XSS ขโมย token)

| คุกกี้ | เนื้อหา | อายุ | หมายเหตุ |
|--------|---------|------|----------|
| `bm_at` | Supabase access token (JWT) | **15 นาที** (`ACCESS_TTL`) | สั้นตามมาตรฐานสากล (OWASP) |
| `bm_rt` | Supabase refresh token | **7 วัน** (`REFRESH_TTL`), path `/api/auth` | ใช้ต่ออายุ + rotation ทุกครั้ง |

- ทุกรีเควสต์ที่ต้องล็อกอิน: อ่าน `bm_at` -> ตรวจกับ Supabase (`auth.getUser`) เช็ค signature+exp -> หมดอายุ = 401
- ทุก query ต่อ DB ใช้ **client แบบสวมสิทธิ์ user** (แนบ access token) -> ถูกบังคับด้วย **RLS** ในนามผู้ใช้ (ไม่ต้องพึ่ง service_role)
- ฝั่ง frontend (`src/lib/apiClient.js`) เจอ 401 จะยิง `POST /api/auth/refresh` อัตโนมัติ 1 ครั้งแล้วลองใหม่
- refresh ล้มเหลว (หมดจริง) -> ล้างคุกกี้ -> ผู้ใช้ต้องล็อกอินใหม่ (ไม่ค้าง session ตลอดเวลาอีกต่อไป)
- คุกกี้ `bm_at` maxAge 15 นาที -> เบราว์เซอร์ทิ้ง access token หลัง 15 นาที บังคับ refresh (ต่ออายุ+rotation)

> (ตัวเลือก hardening) ตั้ง JWT expiry ใน Supabase Dashboard (Auth -> Settings) ให้ ≈ 900s เพื่อให้ตัว token เองหมดตรงกับคุกกี้

---

## รันในเครื่อง (dev)

```bash
cd backend
npm install
cp .dev.vars.example .dev.vars      # แล้วเติมค่าลับจริง
npm run dev                         # ฟังที่ http://localhost:8787
```
frontend รันคู่กัน (คนละ terminal) โดยตั้ง `VITE_API_BASE=/` ใน `.env.local` (มีให้แล้ว)
-> vite จะ proxy `/api/*` ไปที่ worker :8787 (คุกกี้เป็น first-party ใช้งานได้เลย)

### ค่าลับใน `.dev.vars`
| ชื่อ | จำเป็น? | เอามาจาก |
|------|---------|----------|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | ✅ จำเป็น | Supabase Dashboard -> Settings -> API (เป็น public key) |
| `SUPABASE_SERVICE_ROLE_KEY` | เฉพาะ verify-slip | ที่เดียวกัน (ความลับสูงสุด ห้ามหลุด client) |
| `TURNSTILE_SECRET` | ไม่จำเป็น | Cloudflare Turnstile (เว้นว่าง = ข้ามการตรวจ) |
| `EASYSLIP_API_TOKEN` | ไม่จำเป็น | EasySlip (เว้นว่าง = verify-slip ปิด) |

> auth/account/catalog/orders/admin ใช้แค่ `SUPABASE_URL` + `SUPABASE_ANON_KEY` (บังคับสิทธิ์ด้วย RLS) - ไม่ต้องใช้ service_role/JWT secret

---

## Deploy (prod)

```bash
cd backend
npx wrangler login            # (ครั้งแรก) ล็อกอิน Cloudflare ผ่านเบราว์เซอร์
npx wrangler deploy
# ตั้งค่าลับ (ครั้งเดียว) - จำเป็น 2 ตัว:
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
# ตัวเลือก (เฉพาะถ้าจะเปิด verify-slip / Turnstile):
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put TURNSTILE_SECRET
npx wrangler secret put EASYSLIP_API_TOKEN
```

หลัง deploy ให้ตั้งใน frontend (`.env.production` ของ Cloudflare Pages):
```
VITE_API_BASE=https://bm-computer-api.<subdomain>.workers.dev
```
และเพิ่ม origin ของ frontend ใน `wrangler.toml` -> `[vars].FRONTEND_ORIGIN`
(คุกกี้ข้ามโดเมนใช้ `COOKIE_SAMESITE=None` + `COOKIE_SECURE=true` ซึ่งตั้งไว้แล้ว)

> ทางเลือกที่คุกกี้ปลอดภัย/ง่ายกว่า: ผูก worker เข้ากับโดเมนเดียวกับ frontend (custom domain / route)
> แล้วใช้ `SameSite=Lax` แบบ same-origin ได้ (เลี่ยงปัญหา third-party cookie ของเบราว์เซอร์)
```
