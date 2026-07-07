# รัน BM Computer บนเครื่องตัวเอง (สำหรับทีม)

DB ไม่ต้องตั้งเอง — เราใช้ **Supabase คลาวด์ก้อนเดียวกันทั้งทีม** ข้อมูลการเชื่อมต่อเป็น public key อยู่ในรีโปแล้ว clone มาทำตามนี้ก็ต่อ DB ติดเลย

## ขั้นตอน

```bash
git clone https://github.com/manatsawintho-ragoon/bm-computer
cd bm-computer

# 1) frontend
npm install
cp .env.production .env.local

# 2) backend (คนละโฟลเดอร์ ต้อง install แยก)
cd backend
npm install
```

**3) สร้างไฟล์ `backend/.dev.vars`** (จำเป็น — ไม่มีไฟล์นี้ล็อกอินจะไม่ติด) ใส่แค่ 3 บรรทัดนี้:

```
COOKIE_SAMESITE="Lax"
COOKIE_SECURE="false"
FRONTEND_ORIGIN="http://localhost:5173"
```

**4) รัน** (กลับมาที่โฟลเดอร์หลัก):

```bash
cd ..
npm run dev
```

เปิด http://localhost:5173 — สินค้า/หมวด/แบรนด์ต้องขึ้นครบ = ต่อ DB สำเร็จ ✅
(`npm run dev` รัน backend `:8787` + เว็บ `:5173` ให้พร้อมกัน)

## จุดที่พลาดบ่อย

- **สินค้าไม่ขึ้น / ล็อกอินไม่ติด** → เช็คว่าสร้าง `backend/.dev.vars` แล้ว และรันด้วย `npm run dev` (ไม่ใช่ `npm run dev:web` อย่างเดียว — backend ต้องรันคู่กัน)
- **`.dev.vars` อย่าก็อปจาก `.dev.vars.example`** ทั้งไฟล์ เพราะข้างในเป็นค่าตัวอย่างปลอมที่จะไปทับค่าจริง ใช้แค่ 3 บรรทัดข้างบนพอ

## Login / Register / Google บน localhost

- **Login อีเมล+รหัสผ่าน**: ใช้ได้เลย (Turnstile ตอน dev ใช้ test key ที่ผ่านเสมอ ฝั่ง server ไม่ตรวจเพราะไม่ได้ตั้ง secret)
- **Register**: ใช้ได้เลยเช่นกัน - ถ้าโปรเจกต์ Supabase ปิด "Confirm email" ไว้ สมัครเสร็จเข้าระบบทันที
  (ถ้ายังเปิด Confirm email อยู่ จะขึ้นข้อความให้ไปกดยืนยันในอีเมลก่อน - แจ้งเจ้าของโปรเจกต์ให้ปิดได้ที่
  Supabase Dashboard → Authentication → Sign In / Providers → Email → ปิด Confirm email)
- **Google Login**: ต้องมี `http://localhost:5173/**` ใน Redirect URLs ของ Supabase
  (Dashboard → Authentication → URL Configuration) - ตั้งครั้งเดียวใช้ได้ทั้งทีม

## หมายเหตุ

- ทุกคนต่อ DB ตัวจริง (production) ก้อนเดียวกัน → **อย่าลบข้อมูลจริงตอนเทสต์** (ลบใน `/admin` = หายจากเว็บ live จริง)
- verify-slip / Turnstile ใช้ secret ฝั่ง server ที่ทีมไม่มี → ปิดไว้ตอน dev เป็นเรื่องปกติ ส่วนที่เหลือใช้งานได้ครบ
