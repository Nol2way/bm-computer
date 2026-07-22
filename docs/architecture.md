# สถาปัตยกรรมระบบ (System Architecture) - BM Computer

เอกสารนี้อธิบายสถาปัตยกรรมของระบบร้านค้าออนไลน์ **BM Computer (บ้านมีคอม)** ตามที่ **ใช้งานจริงบนระบบ production**
ทุกอย่างในเอกสารนี้ตรวจสอบย้อนกลับได้จากโค้ดในรีโพและจาก Swagger ที่ `/api/docs`

- เว็บไซต์จริง: https://bm-computer.pages.dev
- เอกสาร API (Swagger): https://bm-computer.pages.dev/api/docs

> GitHub เรนเดอร์ Mermaid อัตโนมัติ - เปิดไฟล์นี้บน GitHub จะเห็นเป็นแผนภาพทันที

---

## 1. ภาพรวมสถาปัตยกรรม

ระบบแบ่งเป็น 3 ชั้นชัดเจน โดย **หน้าเว็บไม่ต่อฐานข้อมูลโดยตรง** ทุกคำขอผ่าน Backend API เสมอ

```mermaid
graph TB
    subgraph Client["ผู้ใช้งาน"]
        A["เว็บเบราว์เซอร์<br/>React 18 + Vite<br/>Responsive รองรับมือถือ"]
    end

    subgraph CF["Cloudflare"]
        P["Cloudflare Pages<br/>โฮสต์ไฟล์หน้าเว็บ + CDN ทั่วโลก"]
        PF["Pages Function proxy<br/>functions/api/[[path]].js<br/>ทำให้ /api เป็น same-origin"]
        W["Cloudflare Worker (Backend API)<br/>Hono + OpenAPI · 55 endpoints<br/>auth, account, catalog, orders,<br/>admin, payments, builder, warranty"]
        TS["Turnstile<br/>กันบอทตอนสมัคร/เข้าสู่ระบบ"]
    end

    subgraph SB["Supabase"]
        AU["Supabase Auth<br/>อีเมล/รหัสผ่าน + Google OAuth"]
        DB[("PostgreSQL<br/>+ Row Level Security ทุกตาราง")]
        ST["Storage<br/>bucket warranty-evidence แบบปิด"]
    end

    ES["EasySlip API<br/>ตรวจสลิปโอนเงินจริง"]

    A -->|"HTTPS"| P
    A -->|"/api/* พร้อมคุกกี้ session"| PF
    PF --> W
    A -.->|"captcha token"| TS
    W --> TS
    W -->|"ตรวจ token + ออก session"| AU
    W -->|"อ่าน/เขียนในนามผู้ใช้ ผ่าน RLS"| DB
    W -->|"signed URL อายุสั้น"| ST
    W -->|"ยืนยันสลิป"| ES
```

**อ่านแผนภาพนี้ยังไง:** ผู้ใช้เห็นแค่โดเมนเดียว (`bm-computer.pages.dev`) ทั้งหน้าเว็บและ API
คำขอที่ขึ้นต้นด้วย `/api/` จะถูก Pages Function ส่งต่อไปยัง Worker ให้เบื้องหลัง
ผลคือคุกกี้ session เป็น **first-party** ทุกเบราว์เซอร์ (แก้ปัญหาเบราว์เซอร์ที่บล็อก third-party cookie)

---

## 2. คำอธิบายแต่ละชั้น

| ชั้น | เทคโนโลยีที่ใช้จริง | หน้าที่ |
|------|--------------------|---------|
| **Frontend** | React 18 + Vite + React Router (BrowserRouter) + Tailwind CSS v4 | หน้าตาเว็บ responsive · โหมดมืด/สว่าง · 2 ภาษา (ไทย/อังกฤษ) |
| **Hosting + CDN** | Cloudflare Pages | โฮสต์ไฟล์ static + กระจายทั่วโลก + auto-deploy จาก GitHub `main` |
| **API Proxy** | Cloudflare Pages Function | ส่งต่อ `/api/*` ไป Worker ให้เป็น same-origin (คุกกี้ first-party) |
| **Backend API** | Cloudflare Worker · Hono + @hono/zod-openapi | ตรวจสิทธิ์ ตรวจข้อมูลเข้า คิดราคา ตัดสต็อก ตรวจสลิป ออก Swagger |
| **Auth** | Supabase Auth (ห่อด้วย Worker) | สมัคร/เข้าสู่ระบบ + Google OAuth · Worker แปลง token เป็นคุกกี้ HttpOnly |
| **Database** | Supabase PostgreSQL + RLS | เก็บสินค้า ผู้ใช้ ออเดอร์ รีวิว สเปคคอม เคลมประกัน พร้อมกฎสิทธิ์ระดับแถว |
| **Storage** | Supabase Storage (bucket ปิด) | รูปหลักฐานเคลมประกัน เข้าถึงผ่าน signed URL อายุ 10 นาทีเท่านั้น |
| **ชำระเงิน** | PromptPay QR (EMVCo) + EasySlip API | สร้าง QR ล็อกยอดฝั่งเว็บ · ตรวจสลิปจริงฝั่ง Worker |
| **กันบอท** | Cloudflare Turnstile | ด่านตรวจตอนสมัคร/เข้าสู่ระบบ |

> **หมายเหตุสำคัญ:** ระบบ **ไม่ได้ใช้** Supabase Edge Functions, Supabase Realtime,
> payment gateway ภายนอก (Omise/2C2P), LINE Notify หรือบริการส่งอีเมลภายนอก
> ตรรกะฝั่งเซิร์ฟเวอร์ทั้งหมดอยู่ใน Cloudflare Worker ที่โฟลเดอร์ `backend/`

---

## 3. โมเดล Session และการบังคับสิทธิ์

จุดที่ต่างจากเว็บ Supabase ทั่วไป: **เบราว์เซอร์ไม่ได้ถือ token ของ Supabase เลย**

```mermaid
sequenceDiagram
    actor U as ผู้ใช้
    participant W as หน้าเว็บ (React)
    participant API as Worker (Backend)
    participant SB as Supabase

    U->>W: กรอกอีเมล/รหัสผ่าน + ผ่าน Turnstile
    W->>API: POST /api/auth/login
    API->>SB: ตรวจรหัสผ่าน
    SB-->>API: access token + refresh token
    API-->>W: ตั้งคุกกี้ HttpOnly (bm_at, bm_rt)
    Note over W,API: token ไม่เคยถึงมือ JavaScript ฝั่งเบราว์เซอร์

    U->>W: เปิดหน้าบัญชีของฉัน
    W->>API: GET /api/account/profile (แนบคุกกี้อัตโนมัติ)
    API->>SB: query ในนามผู้ใช้คนนั้น (แนบ access token)
    SB-->>API: RLS ยอมให้เห็นเฉพาะแถวของตัวเอง
    API-->>W: ข้อมูลโปรไฟล์

    Note over API,SB: access หมดอายุ 15 นาที<br/>Worker ต่ออายุด้วย refresh rotation ให้เอง
```

**ทำไมออกแบบแบบนี้**

1. **token อยู่ในคุกกี้ HttpOnly** สคริปต์ฝั่งเบราว์เซอร์อ่านไม่ได้ ลดความเสียหายถ้าโดน XSS
2. **Worker สวมสิทธิ์ผู้ใช้ตอน query** ไม่ใช้ service_role ทำงานทั่วไป ดังนั้น RLS ของฐานข้อมูลยังบังคับจริง
   ต่อให้โค้ดฝั่ง Worker พลาด ฐานข้อมูลก็ยังไม่ยอมให้เห็นข้อมูลของคนอื่น
3. **service_role ใช้เฉพาะ 2 งานที่ต้องข้ามสิทธิ์จริงๆ** คือ ยืนยันสลิป และยืนยันอีเมลตอนสมัคร

---

## 4. เส้นทางการสั่งซื้อและตัดสต็อก

จุดสำคัญ: **สต็อกถูกกันไว้ 3 ชั้น** และตัดสต็อกจริงตอน "ชำระเงินสำเร็จ" เท่านั้น

```mermaid
sequenceDiagram
    actor U as ลูกค้า
    participant W as หน้าเว็บ
    participant API as Worker
    participant DB as PostgreSQL
    participant ES as EasySlip

    U->>W: หยิบสินค้าใส่ตะกร้า
    W->>API: GET /api/catalog/stock (เช็คสต็อกจริง)
    API-->>W: สต็อกคงเหลือรายชิ้น
    Note over W: ของหมด = ปิดปุ่มซื้อทันที (ชั้นที่ 1)

    U->>W: ยืนยันคำสั่งซื้อ
    W->>API: POST /api/orders
    API->>DB: อ่านราคาและสต็อกล่าสุด
    Note over API: คิดราคาใหม่จากฐานข้อมูล ไม่เชื่อราคาจากตะกร้า<br/>ของไม่พอ = ตอบ 409 (ชั้นที่ 2)
    API->>DB: สร้างออเดอร์ status=pending
    API-->>W: เลขที่คำสั่งซื้อ

    U->>W: สแกน PromptPay QR แล้วอัปโหลดสลิป
    W->>API: POST /api/payments/verify-slip
    API->>ES: ส่งรูปสลิปไปตรวจ
    ES-->>API: ยอดเงิน + เลขอ้างอิง + สลิปซ้ำหรือไม่
    Note over API: ยอดไม่พอ หรือสลิปซ้ำ = ปฏิเสธ
    API->>DB: เรียก mark_order_paid()
    Note over DB: ล็อกแถวออเดอร์ ตรวจสต็อก ตัดสต็อก<br/>และตั้ง paid ในธุรกรรมเดียว<br/>constraint กันสต็อกติดลบ (ชั้นที่ 3)
    DB-->>API: สำเร็จ
    API-->>U: ชำระเงินสำเร็จ ติดตามสถานะได้
```

---

## 5. โครงสร้างโค้ดในรีโพ

```mermaid
graph LR
    R["bm-computer/"] --> S["src/<br/>หน้าเว็บ React"]
    R --> B["backend/<br/>Cloudflare Worker"]
    R --> F["functions/<br/>Pages Function proxy"]
    R --> SUP["supabase/<br/>schema + migrations"]
    R --> D["docs/<br/>เอกสารโครงงาน"]

    S --> S1["pages/ หน้าต่างๆ"]
    S --> S2["components/ ชิ้นส่วน UI"]
    S --> S3["lib/ เรียก API + ตัวช่วย"]
    S --> S4["i18n/ ข้อความ 2 ภาษา"]

    B --> B1["src/modules/<br/>auth account catalog orders<br/>admin payments builder warranty"]
    B --> B2["src/lib/<br/>cookies session middleware"]
```

---

## 6. ความปลอดภัยตามชั้น

| ชั้น | มาตรการที่ทำจริง |
|------|------------------|
| เครือข่าย | Cloudflare HTTPS ทุกคำขอ · กัน DDoS ระดับ edge |
| กันบอท | Turnstile ตอนสมัคร/เข้าสู่ระบบ ตรวจฝั่ง Worker |
| Session | คุกกี้ HttpOnly + Secure + SameSite · access 15 นาที · refresh rotation · ไม่ใช้งาน 1 ชม. หลุดเอง |
| สิทธิ์ข้อมูล | RLS เปิดทุกตาราง · Worker query ในนามผู้ใช้ · แอดมินตรวจด้วย `is_admin()` |
| ข้อมูลเข้า | ตรวจด้วย zod ทุก endpoint ทั้ง type ความยาว และค่าที่อนุญาต |
| ราคาและสต็อก | คิดใหม่ที่เซิร์ฟเวอร์เสมอ · constraint ห้ามสต็อกติดลบ · ตัดสต็อกแบบ atomic |
| ไฟล์อัปโหลด | จำกัดชนิดไฟล์และขนาด · เก็บใน bucket ปิด · เข้าถึงผ่าน signed URL อายุ 10 นาที |
| ความลับ | service_role และ token ภายนอกเก็บเป็น secret ของ Worker ไม่อยู่ในโค้ดฝั่งเบราว์เซอร์ |

---

> ดู **โมเดลข้อมูล (ERD)** ได้ในไฟล์ [`analysis-design.md`](./analysis-design.md)
> และ **ขั้นตอน deploy** ในไฟล์ [`deployment.md`](./deployment.md)
