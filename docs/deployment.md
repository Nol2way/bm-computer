# แผนการ Deploy และคำแนะนำ Cloud - BM Computer

เอกสารนี้สรุปแผนการนำเว็บขึ้นออนไลน์ ทั้ง **เฟสส่งงาน (ฟรี ทำได้ทันที)** และ **เฟสระบบจริง**
ตามโจทย์: โฮสต์ฟรี · อัปเดตได้ตลอดเวลา · มีฐานข้อมูลคลาวด์ · ระบบล็อกอิน + Google OAuth · ความปลอดภัย Cloudflare

---

## สรุปสแตกที่แนะนำ (Recommended Stack)

| ส่วน | เลือกใช้ | เหตุผล | ฟรี? |
|------|---------|--------|:---:|
| **โฮสต์เว็บ** | **Cloudflare Pages** | Deploy อัตโนมัติจาก Git, bandwidth ไม่จำกัด, rollback ได้, แก้แล้ว push = อัปเดตทันที | ✅ |
| (ส่งงาน) | **GitHub Pages** | ตรงตาม Checklist ข้อ 6, ฟรี, ใช้ได้ทันที | ✅ |
| **ฐานข้อมูล + Auth** | **Supabase** | PostgreSQL + ระบบล็อกอินของตัวเอง + Google OAuth + Storage ในตัว | ✅ (free tier) |
| **ความปลอดภัย/CDN** | **Cloudflare** | WAF, ป้องกัน DDoS, SSL ฟรี, Rate Limit, Bot Management | ✅ |
| **ชำระเงิน** | Omise / 2C2P | รองรับ PromptPay + บัตร ที่ใช้ในไทย | ตามรอบบิล |

> ทำไมคู่นี้: **Supabase + Cloudflare** ให้ทุกอย่างที่โจทย์ต้องการครบในแพ็กฟรี และต่อกับ React + Vite ได้ง่ายที่สุด

---

## ส่วนที่ 1 - Deploy เพื่อส่งงาน (GitHub Pages) ✅ ทำได้เลย

ใช้ได้ทันทีไม่ต้องตั้ง backend (เฟส Wireframe ใช้ Mock Data)

```bash
# 1) build เว็บ
npm run build          # ได้โฟลเดอร์ dist/

# 2) ติดตั้งตัวช่วย deploy ครั้งเดียว
npm install -D gh-pages
```

เพิ่มสคริปต์ใน `package.json`:
```json
"scripts": {
  "deploy": "npm run build && gh-pages -d dist"
}
```

```bash
# 3) push โค้ดขึ้น GitHub แล้วสั่ง
npm run deploy
```
> เปิด **Settings → Pages → Branch: gh-pages** บน GitHub จะได้ URL เช่น
> `https://<username>.github.io/bm-computer/`
> โปรเจคตั้ง `base: './'` + ใช้ `HashRouter` ไว้แล้ว จึงทำงานบน GitHub Pages ได้ทันที

---

## ส่วนที่ 2 - Deploy ระบบจริง (Cloudflare Pages)

เหมาะกว่าเมื่อระบบโตขึ้น (โดเมนของตัวเอง + ความปลอดภัยเต็มรูปแบบ)

1. push โค้ดขึ้น GitHub
2. เข้า **Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git**
3. ตั้งค่า build:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output directory: `dist`
4. กด Deploy - ทุกครั้งที่ `git push` Cloudflare จะ build + อัปเดตให้อัตโนมัติ (CI/CD)

> เมื่อย้ายมา Cloudflare Pages แนะนำสลับ `HashRouter` → `BrowserRouter`
> และเพิ่มไฟล์ `public/_redirects` หนึ่งบรรทัด: `/*  /index.html  200`

---

## ส่วนที่ 3 - ฐานข้อมูล + ระบบล็อกอิน (Supabase)

1. สร้างโปรเจคที่ [supabase.com](https://supabase.com) (ฟรี)
2. สร้างตารางตาม [ERD](./analysis-design.md#6-โมเดลข้อมูลเบื้องต้น-erd) (`users`, `products`, `orders`, ...)
3. **เปิด Row Level Security (RLS)** ทุกตาราง - ให้ลูกค้าเห็นเฉพาะข้อมูลของตัวเอง
4. **ระบบล็อกอินของตัวเอง:** เปิด Email/Password ใน Authentication → Providers
5. **Google OAuth:** Authentication → Providers → Google → ใส่ Client ID/Secret จาก Google Cloud Console
6. ต่อกับ React:
```bash
npm install @supabase/supabase-js
```
```js
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)
```
> เก็บ key ในไฟล์ `.env` (มีใน `.gitignore` แล้ว - **ห้าม commit**)

---

## ส่วนที่ 4 - ความปลอดภัย (Cloudflare Security)

| ฟีเจอร์ | ป้องกัน | วิธีเปิด |
|---------|--------|---------|
| **SSL/TLS** | ดักจับข้อมูล | เปิดอัตโนมัติ (Full/Strict) |
| **WAF** | SQL Injection, XSS | Security → WAF → เปิด Managed Rules |
| **DDoS Protection** | ยิงถล่มเซิร์ฟเวอร์ | เปิดอัตโนมัติทุกแผน |
| **Rate Limiting** | brute-force ล็อกอิน | ตั้งกฎจำกัดคำขอ/นาที |
| **Bot Management** | บอตกวาดข้อมูล | Security → Bots |

**แนวปฏิบัติด้านความปลอดภัยเพิ่มเติม**
- ไม่เก็บข้อมูลบัตรเครดิตเอง - ส่งต่อ Payment Gateway โดยตรง
- ใช้ RLS ของ Supabase ควบคุมสิทธิ์ระดับแถวข้อมูล
- แยก key สำหรับ dev/prod และหมุนเวียน (rotate) เป็นระยะ

---

## เช็คลิสต์ก่อน Deploy
- [ ] `npm run build` ผ่าน ไม่มี error
- [ ] ทดสอบ `npm run preview` หน้าหลักครบ
- [ ] ไฟล์ `.env` ไม่ถูก commit (เช็ค `.gitignore`)
- [ ] เปิด HTTPS + WAF บน Cloudflare
- [ ] เปิด RLS ทุกตารางใน Supabase
