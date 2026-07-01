# CLAUDE.md - BM Computer (บ้านมีคอม)

อ่านไฟล์นี้ก่อนเริ่มงานทุกครั้ง เพื่อเข้าใจว่าโปรเจคนี้คืออะไรและกฎเหล็กที่ห้ามละเมิด

---

## โปรเจคนี้คืออะไร
**BM Computer (บ้านมีคอม)** - เว็บไซต์ร้านค้าออนไลน์จำหน่ายอุปกรณ์คอมพิวเตอร์ **ที่ใช้งานจริง** (production e-commerce)
แนวทางคล้าย JIB / Advice / iHaveCPU แต่ **ดีไซน์เป็นสไตล์ของเราเอง** (ธีมแดง-ขาว-เทา) - ไม่ลอกใครเป๊ะ ใช้แค่ "ควรมีอะไรบ้าง"

- 🌐 Live: https://bm-computer.pages.dev
- 📦 Repo: https://github.com/manatsawintho-ragoon/bm-computer (push `main` = auto-deploy)
- 🗄️ DB/Auth: Supabase project `xclugpegrcuqmnapysnf`

---

## ⛔ กฎเหล็ก (ห้ามละเมิดเด็ดขาด)

1. **ห้าม tech-debt / ห้าม stub / ห้าม mock logic เด็ดขาด**
   ทุกปุ่ม ทุก action ต้อง **ทำงานได้จริง** logic ถูกต้องครบถ้วน
   (เพิ่มลงตะกร้า=เพิ่มจริง, ชำระเงิน=สร้างออเดอร์จริงใน DB, ลบ=ลบจริง ฯลฯ)
   ถ้าทำไม่เสร็จในรอบเดียว ให้ทำทีละฟีเจอร์ให้ **สมบูรณ์** ห้ามทิ้งครึ่งๆกลางๆ

2. **Dynamic ทั้งเว็บ - ทุกอย่างคุมจากหลังบ้าน (admin)**
   - เพิ่มสินค้า/หมวด/แบรนด์/สไลด์/แบนเนอร์/เนื้อหา ในหลังบ้าน → ขึ้นเว็บทันที
   - ไม่เพิ่ม = ไม่ขึ้น · ห้าม hardcode รายการสินค้า/หมวด/แบรนด์/เนื้อหาในโค้ด
   - ทุกข้อมูลที่ลูกค้าเห็น ต้องมาจาก Supabase (ยกเว้นข้อความ UI ที่อยู่ใน i18n)

3. **ลำดับความสำคัญ (priority สูง→ต่ำ)**
   1. **Security** - RLS เปิดทุกตาราง, เขียนข้อมูลได้เฉพาะ role ที่ควร, ไม่เก็บความลับใน client (anon key เปิดเผยได้, ห้าม commit service_role/PAT), validate ฝั่ง DB ด้วย policy
   2. **Performance / DB เร็ว / เว็บเร็ว** - query เลือกเฉพาะคอลัมน์ที่ใช้, มี index, pagination เมื่อข้อมูลเยอะ, lazy-load รูป, code-split, ไม่ดึงข้อมูลซ้ำ
   3. **UX - คิดถึงลูกค้าเสมอ ใช้งานง่าย** - flow สั้น, feedback ชัด (loading/empty/error/success), responsive, เข้าถึงได้ (a11y)

4. **คิดให้รอบคอบและรอบด้านก่อนลงมือเสมอ** - วางแผนก่อนเขียนโค้ด

5. **อัปเดตเอกสารตลอด** - แก้อะไรที่กระทบสถาปัตยกรรม/ฟีเจอร์ ต้องอัปเดต `README.md` และไฟล์นี้

6. **ห้ามใช้ em-dash (อักขระ U+2014) เด็ดขาด** ทุกที่ (โค้ด, UI, README, เอกสาร, คอมเมนต์) ใช้ hyphen `-` หรือ `·` แทน

7. **Login-gating:** ฟีเจอร์ที่ผูกกับตัวตนลูกค้า (เพิ่มลงตะกร้า, สั่งซื้อ, รีวิว, บันทึกที่อยู่) ต้องเช็คว่าล็อกอินก่อน ถ้ายังไม่ล็อกอินให้เปิด Auth modal และดึงข้อมูลจาก profile มาเติมให้อัตโนมัติ (ไม่ให้ลูกค้ากรอกซ้ำ)

8. **ความปลอดภัย localStorage:** เก็บได้เฉพาะข้อมูลไม่อ่อนไหวที่ลูกค้าแก้/ลบได้โดยไม่กระทบระบบ (ตะกร้า, ธีม, ภาษา) ห้ามเก็บความลับ/ข้อมูลยืนยันตัวตนเอง ควรใช้กลไกฝั่งเซิร์ฟเวอร์ (HttpOnly Secure Cookies) + ตรวจสิทธิ์ฝั่งเซิร์ฟเวอร์ (RLS) เสมอ

9. **ทางเข้า Admin ต้องไม่โผล่ที่สาธารณะ** (ห้ามลิงก์ใน footer/หน้าบ้าน) เข้าได้เฉพาะผ่านเมนูบัญชีเมื่อ role=admin หรือรู้ URL `/admin` เอง และหน้า/admin ต้องกั้นสิทธิ์

10. **แบรนด์/สินค้าต้องจริง:** โลโก้แบรนด์ใช้โลโก้จริง (เช่น Clearbit Logo API) และแสดงเฉพาะแบรนด์ที่มีสินค้าจริงในร้าน

11. **การแสดงสินค้า:** อย่างน้อย 6 ชิ้นต่อแถว ถ้าเกินให้เป็น carousel เลื่อน/ลากซ้ายขวาได้

12. **ค้นหาแบบ fuzzy:** รองรับพิมพ์ผิด/คำใกล้เคียง/คำพ้องเสียง ให้หาเจอง่ายและแม่นยำ

13. **Payment:** ยืนยันสลิปด้วย EasySlip API ผ่าน server (Cloudflare Pages Function) เท่านั้น token เก็บใน env ฝั่ง server ห้ามอยู่ใน client

14. **กันบอท:** login/register ใช้ Cloudflare Turnstile + ตรวจฝั่ง Supabase Auth (captchaToken)

15. **Placeholder ต้องได้มาตรฐานสากล:** ห้ามใส่ข้อมูลตัวอย่างปลอมเป็น placeholder (เช่น "สมชายใจดี") ใช้คำใบ้รูปแบบที่ถูกต้องแทน

---

## สถาปัตยกรรม
| ชั้น | เทคโนโลยี |
|------|-----------|
| Frontend | React 18 + Vite + React Router (BrowserRouter) |
| Styling | Tailwind CSS v4 (design tokens) · Dark/Light · ฟอนต์ Inter + Sarabun |
| Backend/DB/Auth | **Supabase** (PostgreSQL + Auth + Storage + RLS) |
| Hosting | **Cloudflare Pages** (auto-deploy จาก GitHub `main`) |
| ชำระเงิน | PromptPay QR (gateway จริงเป็นเฟสถัดไป) |

### Data flow
`Supabase (RLS) → src/lib/api.js → useFetch / context → components`
- อ่าน: ผ่าน anon key (RLS public read สำหรับ catalog)
- เขียน (admin): ผ่าน session ของผู้ใช้ที่ `role='admin'` (RLS `is_admin()`)

---

## โครงสร้างโค้ด
```
src/
├── lib/         supabase.js (client), api.js (query layer), useFetch.js, ui.js (helpers)
├── theme/       ThemeContext (dark/light)
├── i18n/        LanguageContext + translations.js (ไทย/อังกฤษ) - ข้อความ UI ทั้งหมดอยู่ที่นี่
├── components/  Navbar, Footer, BrandLogo, Icons (SVG เท่านั้น), ProductCard,
│                HeroCarousel, BrandBar, FlashSale, Lightbox, AuthModal, AuthForm
├── pages/       Home, ProductList, ProductDetail, Cart, Checkout, OrderTracking,
│                OrderHistory, PCBuilder, AdminDashboard, NotFound
└── data/mock.js  (กำลังเลิกใช้ - ย้ายไป DB ให้หมด)

supabase/        schema.sql, seed.sql, README.md (วิธี migrate)
```

## ฐานข้อมูล (ตารางหลัก)
`categories, brands, products, slides, profiles, orders, order_items, reviews, site_settings`
- ดูรายละเอียด + RLS ใน `supabase/schema.sql`
- ตาราง slides ยังไม่มี unique key (กัน seed ซ้ำ) - มี TODO ใส่ constraint

## คอนเวนชัน
- **ไอคอน: SVG เท่านั้น** (ใน `components/Icons.jsx`) - **ห้ามใช้ emoji เป็นไอคอน** (หลัก ui-ux-pro-max)
- **ข้อความทุกอย่าง 2 ภาษา** ผ่าน `t('section.key')` - ห้าม hardcode ข้อความไทย/อังกฤษในคอมโพเนนต์
- **สี/พื้นผิว** ใช้ token (`bg-surface text-fg border-line bg-brand-600 ...`) ปรับ dark/light อัตโนมัติ
- ราคา/ตัวเลข ใส่ class `nums` (tabular)

## คำสั่ง
```bash
npm run dev      # dev server
npm run build    # production build -> dist/
npm run preview  # preview build
```
`.env.local` (dev) / `.env.production` (commit ได้ เพราะ anon key เปิดเผยได้) มี `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

---

## สถานะปัจจุบัน (อัปเดตเมื่อแก้)
- ✅ ออนไลน์ + ต่อ Supabase จริง (สินค้า/หมวด/แบรนด์/สไลด์จาก DB)
- ✅ หน้าแรก dynamic: Hero carousel, Flash Sale (countdown), Brand bar (โลโก้จริง Simple Icons + เฉพาะแบรนด์ที่มีสินค้า), ProductRow (carousel ลากได้ 6/แถว)
- ✅ ตะกร้าจริง + checkout สร้างออเดอร์จริง + ติดตาม/ประวัติจาก DB (login-gated)
- ✅ ค้นหา fuzzy (พิมพ์ผิดก็เจอ) + กรอง cat/brand จริง
- ✅ Auth ทั้งแอป (session/role) + เมนูบัญชี/logout · Dark/Light · 2 ภาษา · แกลเลอรีซูม
- ✅ ลบ em-dash หมด · login-gate ตะกร้า/สั่งซื้อ · ลบ admin ออกจาก footer · placeholder มาตรฐาน
- ✅ **Admin CMS** (role-guarded): ภาพรวม + สินค้า CRUD (รูปแบบลิงก์+สเปค) + สไลด์/แบนเนอร์ CRUD (คุม carousel) + ออเดอร์ (อัปเดตสถานะ) - เขียน DB จริงผ่าน admin RLS. เข้าผ่านเมนูบัญชี (isAdmin) ที่ /admin
- ✅ **Turnstile** ต่อ login/register แล้ว (ส่ง captchaToken ให้ Supabase) - ต้องเปิด Captcha + ใส่ secret ใน Supabase Auth เพื่อบังคับใช้จริง
- 🟡 **ยังต้องทำ:** EasySlip verify (Pages Function `functions/api/verify-slip.js` + token ใน Cloudflare env), หน้า Profile settings (ที่อยู่ - ต้องแก้ schema เพิ่มตาราง addresses), footer redesign เต็ม, ย้าย auth session ไป HttpOnly cookie (ต้อง SSR/Pages Functions), categories ใน nav ให้ดึง DB, brands/categories CRUD ในหลังบ้าน

## แผนทำให้ "ใช้งานได้จริงทั้งหมด" (ทำทีละชิ้นให้สมบูรณ์ ไม่ stub)
1. **Auth state ทั้งแอป** (session/user/role) + ปุ่ม logout + การ์ดบัญชี + กั้นหน้า /admin
2. **ตะกร้าจริง** (CartContext + persist) → เพิ่ม/ลบ/แก้จำนวน + ตัวเลขบน navbar จริง
3. **Checkout จริง** → สร้าง `orders` + `order_items` ใน DB (ต้องล็อกอิน) → เคลียร์ตะกร้า → ติดตามได้
4. **ค้นหา/ฟิลเตอร์/เรียงลำดับ** ทำงานจริง (query Supabase)
5. **ติดตาม/ประวัติออเดอร์** ดึงจาก DB จริง
6. **Admin CMS (CRUD)** - จัดการสินค้า/หมวด/แบรนด์/สไลด์/เนื้อหา/ออเดอร์ จากหลังบ้าน (เพิ่มแล้วขึ้นเว็บทันที)
7. catalog ที่ยัง hardcode (categories/brands ใน mock.js) → ย้ายไป DB ให้หมด
8. SEO: dynamic `<title>`/meta ต่อหน้า

---
> เป้าหมาย: เว็บที่ **ใช้งานได้จริง 100% · คุมจากหลังบ้านได้ทั้งหมด · เร็ว · ปลอดภัย · ลูกค้าใช้ง่าย**
