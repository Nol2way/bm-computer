# ตั้งค่า Supabase (เฟส 1)

## 1) สร้างตาราง + ความปลอดภัย
Supabase Dashboard → **SQL Editor** → New query → วางไฟล์ [`schema.sql`](./schema.sql) ทั้งหมด → **Run**

## 2) ใส่ข้อมูลตัวอย่าง
New query → วางไฟล์ [`seed.sql`](./seed.sql) → **Run**
ตรวจ: `select count(*) from products;` ควรได้ **24**

## 3) เชื่อมเว็บกับ Supabase
ที่เครื่อง สร้างไฟล์ `.env.local` (คัดจาก `.env.example`) ใส่:
```
VITE_SUPABASE_URL=https://xclugpegrcuqmnapysnf.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key จาก Settings → API>
```
> `.env.local` ถูก gitignore แล้ว — ปลอดภัย ไม่ขึ้น GitHub

## 4) ใส่ค่าเดียวกันบน Cloudflare Pages
Cloudflare → โปรเจค Pages → **Settings → Environment variables** → เพิ่ม
`VITE_SUPABASE_URL` และ `VITE_SUPABASE_ANON_KEY` → **Redeploy**

## 5) ทำตัวเองเป็นแอดมิน (หลังสมัครสมาชิกครั้งแรก)
SQL Editor:
```sql
update public.profiles set role='admin' where email='YOUR_EMAIL';
```

## 6) (ถ้าต้องการ) เปิด Google OAuth
Authentication → Providers → Google → ใส่ Client ID/Secret จาก Google Cloud Console
แล้วเพิ่ม redirect URL ของเว็บ (เช่น `https://bm-computer.pages.dev`)

---
**ความปลอดภัย:** ทุกตารางเปิด Row Level Security (RLS) — ลูกค้าเห็นเฉพาะข้อมูลตัวเอง, แก้ catalog/สไลด์ได้เฉพาะ `role='admin'`
