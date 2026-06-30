# สถาปัตยกรรมระบบ (System Architecture) — BM Computer

เอกสารนี้อธิบายสถาปัตยกรรมของระบบร้านค้าออนไลน์ **BM Computer (บ้านมีคอม)**
ทั้งในเฟส **Wireframe** (ปัจจุบัน) และเฟส **ระบบจริง** (อนาคต) พร้อมแผนภาพ Mermaid
ตาม Checklist ข้อ 5 ของ Workshop #1

> 💡 GitHub เรนเดอร์ Mermaid อัตโนมัติ — เปิดไฟล์นี้บน GitHub จะเห็นเป็นแผนภาพทันที

---

## 1. ภาพรวมสถาปัตยกรรม (ระบบจริง)

```mermaid
graph TB
    subgraph Client["🖥️ Client Layer"]
        A[Web Browser<br/>React + Vite]
        B[Mobile / PWA<br/>Responsive]
    end

    subgraph Edge["☁️ Cloudflare — Edge & Security"]
        C[CDN + Cache]
        D[WAF + DDoS Protection]
        E[SSL/TLS + Bot Management]
        F[Cloudflare Pages<br/>โฮสต์เว็บ Frontend]
    end

    subgraph Backend["🗄️ Supabase — Backend as a Service"]
        G[Supabase Auth<br/>Email/Password + Google OAuth]
        H[(PostgreSQL<br/>+ Row Level Security)]
        I[Storage<br/>รูปสินค้า]
        J[Edge Functions<br/>Logic: คำสั่งซื้อ/ชำระเงิน]
        K[Realtime<br/>อัปเดตสถานะออเดอร์]
    end

    subgraph External["🔌 External Services"]
        L[Payment Gateway<br/>Omise / 2C2P<br/>PromptPay · บัตร · COD]
        M[LINE Official / Notify]
        N[Email Service<br/>Resend / SendGrid]
    end

    A --> C
    B --> C
    C --> D --> E --> F
    F --> G
    F --> H
    F --> I
    F --> J
    G --> H
    J --> H
    J --> L
    J --> M
    J --> N
    H -.->|subscribe| K
    K -.-> A
```

---

## 2. คำอธิบายแต่ละชั้น (Layer)

| ชั้น | เทคโนโลยี | หน้าที่ |
|------|-----------|---------|
| **Client** | React + Vite, React Router, **Tailwind CSS v4** | หน้าตาเว็บ (UI) responsive · Dark/Light mode · 2 ภาษา (ไทย/อังกฤษ) |
| **Edge & Security** | Cloudflare (Pages, CDN, WAF, DDoS, SSL) | โฮสต์เว็บฟรี + ป้องกันการโจมตี + เร่งความเร็วทั่วโลก |
| **Auth** | Supabase Auth | ระบบล็อกอินของตัวเอง (อีเมล/รหัสผ่าน) + Google OAuth |
| **Database** | Supabase PostgreSQL + RLS | เก็บข้อมูลสินค้า ผู้ใช้ คำสั่งซื้อ พร้อมกฎความปลอดภัยระดับแถว |
| **Storage** | Supabase Storage | เก็บรูปภาพสินค้า/สลิป |
| **Logic** | Supabase Edge Functions | ประมวลผลคำสั่งซื้อ ยืนยันการชำระเงิน webhook |
| **Realtime** | Supabase Realtime | อัปเดตสถานะออเดอร์แบบเรียลไทม์ |
| **External** | Omise/2C2P, LINE, Email | ชำระเงิน แจ้งเตือน และอีเมล |

---

## 3. สถาปัตยกรรมเฟสปัจจุบัน (Wireframe)

ตอนนี้เป็น **Static SPA** ยังไม่ต่อ backend — ใช้ Mock Data เพื่อโชว์ UI/UX

```mermaid
graph LR
    U[ผู้ใช้] --> P[GitHub Pages<br/>Static Hosting]
    P --> R[React SPA<br/>HashRouter]
    R --> M[Mock Data<br/>src/data/mock.js]
```

---

## 4. Flow การสั่งซื้อ (ระบบจริง)

```mermaid
sequenceDiagram
    actor U as ลูกค้า
    participant W as เว็บ (React)
    participant A as Supabase Auth
    participant D as PostgreSQL
    participant Pay as Payment Gateway

    U->>W: เลือกสินค้า + ใส่ตะกร้า
    U->>A: เข้าสู่ระบบ (Email / Google)
    A-->>W: JWT Session
    U->>W: ยืนยันคำสั่งซื้อ
    W->>D: บันทึกออเดอร์ (status=รอชำระ)
    W->>Pay: สร้างรายการชำระเงิน
    Pay-->>U: QR PromptPay / หน้าบัตร
    Pay-->>W: webhook ชำระสำเร็จ
    W->>D: อัปเดต status=ชำระแล้ว
    D-->>U: แจ้งเตือน + ติดตามสถานะ
```

---

> ดู **โมเดลข้อมูล (ERD)** ได้ในไฟล์ [`analysis-design.md`](./analysis-design.md)
> และ **แผนการ deploy** ในไฟล์ [`deployment.md`](./deployment.md)
