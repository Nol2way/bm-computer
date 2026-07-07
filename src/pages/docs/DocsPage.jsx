import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/Icons'
import BrandLogo from '../../components/BrandLogo'
import { cx } from '../../lib/ui'
import { useLang } from '../../i18n/LanguageContext'
import { useTheme } from '../../theme/ThemeContext'
import { usePageMeta } from '../../lib/usePageMeta'

// ===== เนื้อหาเอกสาร 2 ภาษา (หน้านี้เป็นเอกสารยาว จึงรวม th/en ไว้ที่เดียวแทนการกระจายใน translations.js) =====
const C = {
  th: {
    kicker: 'Documentation', title: 'เอกสารประกอบระบบ BM Computer',
    sub: 'ทุกอย่างที่ต้องรู้เกี่ยวกับระบบร้านค้าออนไลน์นี้ ตั้งแต่วิธีใช้งาน เทคโนโลยีเบื้องหลัง ไปจนถึงคู่มือ API สำหรับนักพัฒนา ในภาษาที่อ่านเข้าใจง่าย',
    openSwagger: 'เปิดเอกสาร API (Swagger)', openSite: 'เปิดหน้าร้าน', toc: 'สารบัญ',
    nav: {
      overview: 'ภาพรวมระบบ', guide: 'วิธีใช้งาน', features: 'ฟีเจอร์ทั้งหมด', tech: 'เทคโนโลยีที่ใช้',
      architecture: 'สถาปัตยกรรมระบบ', api: 'API สำหรับนักพัฒนา', security: 'ความปลอดภัย', faq: 'คำถามพบบ่อย',
    },
    overviewP1: 'BM Computer (บ้านมีคอม) คือระบบร้านค้าออนไลน์จำหน่ายอุปกรณ์คอมพิวเตอร์แบบครบวงจร ลูกค้าเลือกซื้อสินค้า จ่ายเงินผ่าน PromptPay และติดตามพัสดุได้จริง ส่วนร้านค้าจัดการทุกอย่างผ่านหลังบ้านโดยไม่ต้องแก้โค้ด',
    overviewP2: 'ระบบออกแบบตามมาตรฐานเดียวกับเว็บร้านค้าจริงในตลาด: ข้อมูลทั้งหมดอยู่ในฐานข้อมูลกลาง อัปเดตแล้วเห็นผลทันที มีระบบสมาชิก ระบบสิทธิ์ และการตรวจสอบการชำระเงินอัตโนมัติ',
    stats: [
      ['150+', 'สินค้าจริงในระบบ'], ['39', 'แบรนด์ (โลโก้จริง)'], ['40+', 'คำสั่ง API'],
      ['20+', 'หน้าจอใช้งาน'], ['15+', 'ตารางข้อมูล'], ['2', 'ภาษา (ไทย/อังกฤษ)'],
    ],
    guideCustomer: 'ฝั่งลูกค้า: สั่งซื้อสินค้า 6 ขั้นตอน',
    guideSteps: [
      ['เลือกสินค้า', 'ค้นหาจากช่องค้นหา (พิมพ์ผิดก็เจอ) หรือกรองตามหมวด แบรนด์ ช่วงราคา จะจัดสเปคคอมทั้งเครื่องด้วย PC Builder ก็ได้'],
      ['หยิบใส่ตะกร้า', 'กด "หยิบใส่ตะกร้า" ได้จากทุกหน้า ระบบจะพาไปเข้าสู่ระบบก่อนถ้ายังไม่ได้ล็อกอิน (สมัครใหม่หรือใช้บัญชี Google ได้)'],
      ['ยืนยันคำสั่งซื้อ', 'เลือกที่อยู่จัดส่งที่บันทึกไว้ หรือกรอกใหม่ ระบบสรุปยอดรวมให้เห็นชัดก่อนจ่าย'],
      ['สแกนจ่ายด้วย PromptPay', 'ระบบสร้าง QR ที่ล็อกยอดเงินให้อัตโนมัติ สแกนด้วยแอปธนาคารไหนก็ได้'],
      ['อัปโหลดสลิป', 'แนบสลิปโอนเงิน ระบบตรวจสอบกับธนาคารให้ทันทีว่าโอนจริงและยอดถูกต้อง แล้วเปลี่ยนสถานะเป็น "ชำระแล้ว" อัตโนมัติ'],
      ['ติดตามจนได้รับของ', 'ดูสถานะได้ตลอดทาง แพ็คของ จัดส่ง (มีเลขพัสดุ) จนสำเร็จ และกลับมารีวิวสินค้าได้ (เฉพาะผู้ซื้อจริง)'],
    ],
    guideAdmin: 'ฝั่งร้านค้า: หลังบ้าน (Admin)',
    guideAdminP: 'ผู้ดูแลระบบเข้าที่เมนูบัญชี > หลังบ้าน (เห็นเฉพาะบัญชีที่เป็นแอดมิน) ทำได้ทั้งหมดนี้โดยไม่ต้องแตะโค้ด:',
    guideAdminList: [
      'ภาพรวม: กราฟยอดขายรายวัน ออเดอร์ตามสถานะ สินค้าขายดี และแจ้งเตือนสต็อกใกล้หมด',
      'สินค้า: เพิ่ม/แก้/ลบ พร้อมค้นหาและตัวกรอง เพิ่มแล้วขึ้นหน้าเว็บทันที',
      'หมวดหมู่ / แบรนด์ / สไลด์โปรโมชัน: จัดการได้อิสระ หน้าเว็บเปลี่ยนตาม',
      'ออเดอร์: อัปเดตสถานะ ใส่เลขพัสดุ อนุมัติยกเลิก/คืนเงิน (สต็อกตัด-คืนอัตโนมัติ)',
      'การชำระเงิน: ประวัติทั้งหมด พร้อมค้นหา กรองช่วงวันที่ และยอดสรุป',
      'ลูกค้า: รายชื่อสมาชิกพร้อมยอดซื้อสะสม · ตั้งค่า: บัญชีรับเงิน PromptPay ของร้าน',
    ],
    featuresTitle: 'ฟีเจอร์ทั้งหมดในระบบ',
    features: [
      ['search', 'ค้นหาอัจฉริยะ', 'Autocomplete + fuzzy search พิมพ์ผิดก็หาเจอ พร้อมตัวกรองหมวด แบรนด์ ราคา สต็อก และการเรียงลำดับ'],
      ['cart', 'ตะกร้า & สั่งซื้อจริง', 'สร้างออเดอร์จริงในฐานข้อมูล ตัดสต็อกเมื่อจ่ายเงิน ยกเลิก/ขอคืนเงินได้ตามสถานะ'],
      ['qr', 'PromptPay + ตรวจสลิป', 'QR มาตรฐานธนาคาร (EMVCo) ล็อกยอดอัตโนมัติ ตรวจสลิปด้วยระบบ EasySlip ฝั่งเซิร์ฟเวอร์'],
      ['cpu', 'PC Builder', 'จัดสเปคคอมพร้อมเช็คความเข้ากันได้ 19 กฎ (ซ็อกเก็ต แรม ไฟ ขนาดเคส) คำนวณไฟ แนะนำ PSU และประเมินคะแนนเกม'],
      ['users', 'สเปคชุมชน', 'แชร์สเปคเป็นลิงก์/QR ให้คนอื่นเปิดดูและนำไปใช้ต่อได้'],
      ['user', 'บัญชีของฉัน', 'ข้อมูลส่วนตัว ที่อยู่จัดส่ง ใบกำกับภาษี ช่องทางชำระเงิน สินค้าที่ถูกใจ และสรุปออเดอร์'],
      ['star', 'รีวิวผู้ซื้อจริง', 'เขียนรีวิวได้เฉพาะผู้ที่ซื้อสินค้าแล้ว มีตรา "ซื้อแล้ว" คะแนนรวมคำนวณอัตโนมัติ'],
      ['grid', 'หลังบ้านครบวงจร', 'แดชบอร์ดกราฟยอดขาย จัดการสินค้า/ออเดอร์/ลูกค้า/การเงิน ทั้งหมดในที่เดียว'],
      ['truck', 'ติดตามพัสดุ', 'เช็คสถานะด้วยรหัสออเดอร์ เห็นทุกขั้นตอนพร้อมเลขพัสดุและขนส่ง'],
      ['moon', 'โหมดมืด + 2 ภาษา', 'สลับธีมสว่าง/มืด และไทย/อังกฤษได้ทันทีทุกหน้า'],
      ['shield', 'กันบอท', 'Cloudflare Turnstile ตรวจตอนสมัคร/เข้าสู่ระบบ'],
      ['bolt', 'โหลดเร็ว', 'เสิร์ฟจากเครือข่าย Edge ทั่วโลก พร้อม skeleton loading ทุกหน้า'],
    ],
    techTitle: 'เทคโนโลยีที่ใช้ (อธิบายง่ายๆ)',
    techHead: ['ส่วน', 'เทคโนโลยี', 'ทำหน้าที่อะไร'],
    tech: [
      ['หน้าเว็บ', 'React 18 + Vite', 'เครื่องมือสร้างหน้าเว็บที่บริษัทใหญ่ทั่วโลกใช้ ทำให้เว็บลื่นและพัฒนาเร็ว'],
      ['ดีไซน์', 'Tailwind CSS v4', 'คุมโทนสีและระยะห่างให้สม่ำเสมอทุกหน้า รองรับโหมดมืดในตัว'],
      ['ระบบกลาง (API)', 'Cloudflare Worker + Hono', 'โปรแกรม "พนักงานร้าน" ที่รับทุกคำสั่ง ตรวจสิทธิ์ก่อนทำงาน รันกระจายทั่วโลกจึงตอบเร็ว'],
      ['ฐานข้อมูล', 'Supabase (PostgreSQL)', 'ฐานข้อมูลมาตรฐานองค์กร พร้อมกฎความปลอดภัยระดับแถวข้อมูล (RLS)'],
      ['ระบบสมาชิก', 'Supabase Auth + Google OAuth', 'สมัคร/เข้าสู่ระบบปลอดภัย รหัสผ่านถูกเข้ารหัส รองรับบัญชี Google'],
      ['การชำระเงิน', 'PromptPay (EMVCo) + EasySlip', 'สร้าง QR จ่ายเงินมาตรฐานธนาคารไทย และตรวจสลิปอัตโนมัติ'],
      ['โฮสติ้ง', 'Cloudflare Pages', 'วางเว็บบนเครือข่ายทั่วโลก อัปเดตอัตโนมัติทุกครั้งที่ทีม push โค้ด (CI/CD)'],
      ['เวอร์ชันโค้ด', 'Git + GitHub', 'บันทึกประวัติการแก้โค้ดของทีมทั้งหมด ย้อนกลับได้ ตรวจสอบได้'],
    ],
    archTitle: 'สถาปัตยกรรมระบบ',
    archP: 'ระบบแบ่งเป็น 3 ชั้นชัดเจน หน้าเว็บไม่เคยคุยกับฐานข้อมูลตรงๆ ทุกคำสั่งต้องผ่านระบบกลางที่ตรวจสิทธิ์ก่อนเสมอ และฐานข้อมูลยังมีกฎของตัวเองซ้ำอีกชั้น (Row Level Security) เผื่อกรณีมีใครพยายามข้ามระบบกลางเข้ามา',
    archBoxes: [
      ['หน้าเว็บ (Frontend)', 'React SPA บน Cloudflare Pages', 'หน้าจอทั้งหมดที่ลูกค้าและแอดมินใช้งาน สลับภาษา/ธีมได้ โหลดเร็วจาก CDN ทั่วโลก'],
      ['ระบบกลาง (Backend API)', 'Cloudflare Worker · Hono + OpenAPI', 'รับทุกคำขอผ่าน HTTPS ตรวจตัวตนจากคุกกี้ HttpOnly ตรวจสลิป จัดการสต็อก แล้วจึงอ่าน/เขียนฐานข้อมูลในนามผู้ใช้คนนั้น'],
      ['ฐานข้อมูล (Database)', 'Supabase · PostgreSQL + RLS', 'เก็บสินค้า ออเดอร์ สมาชิก รีวิว สเปคคอม ทุกตารางมีกฎสิทธิ์ของตัวเอง ลูกค้าเห็นเฉพาะข้อมูลตนเอง'],
    ],
    archSession: 'การยืนยันตัวตน: เมื่อเข้าสู่ระบบ ระบบกลางจะฝาก"บัตรผ่าน" ไว้ในคุกกี้ชนิด HttpOnly (สคริปต์อ่านไม่ได้) อายุ 15 นาที และต่ออายุอัตโนมัติระหว่างใช้งาน ถ้าทิ้งไว้เฉยๆ เกิน 1 ชั่วโมงจะหลุดเอง (ติ๊ก "จดจำฉัน" = อยู่ได้ 7 วัน)',
    apiTitle: 'API สำหรับนักพัฒนา',
    apiP1: 'ระบบกลางเปิดเป็น REST API มาตรฐาน ทุกเส้นทางมีเอกสารอัตโนมัติแบบ OpenAPI 3 พร้อมหน้า Swagger UI ที่กดทดลองยิงได้จริงจากเบราว์เซอร์',
    apiP2: 'กลุ่มคำสั่งหลักทั้งหมด (ดูรายละเอียด พารามิเตอร์ และตัวอย่างการตอบกลับครบทุกเส้นใน Swagger):',
    apiAuthUser: 'ต้องเข้าสู่ระบบ (แนบคุกกี้ session)', apiAuthAdmin: 'ต้องเป็นแอดมินเท่านั้น',
    swaggerTitle: 'ทดลองใช้ API ได้เลยจากหน้านี้',
    faq: [
      ['ต้องสมัครสมาชิกก่อนไหมถึงจะดูสินค้าได้', 'ไม่ต้อง เปิดดูสินค้า ค้นหา และจัดสเปคคอมได้เลย จะต้องเข้าสู่ระบบเฉพาะตอนหยิบใส่ตะกร้า สั่งซื้อ หรือบันทึกสเปค'],
      ['จ่ายเงินด้วยอะไรได้บ้าง', 'PromptPay QR สแกนด้วยแอปธนาคารใดก็ได้ ยอดเงินถูกล็อกใน QR อัตโนมัติ และระบบตรวจสลิปให้ทันทีหลังอัปโหลด'],
      ['ยกเลิกคำสั่งซื้อได้ไหม', 'ได้ ถ้ายังไม่จ่ายเงินจะยกเลิกทันที ถ้าจ่ายแล้วจะเป็นคำขอยกเลิกให้ร้านตรวจสอบและคืนเงิน สต็อกคืนอัตโนมัติ'],
      ['ข้อมูลส่วนตัวปลอดภัยแค่ไหน', 'รหัสผ่านถูกเข้ารหัสที่ระบบสมาชิกของ Supabase ข้อมูลส่วนตัวถูกกั้นด้วยกฎระดับฐานข้อมูล (RLS) แต่ละคนเห็นเฉพาะของตัวเอง และเว็บทั้งหมดวิ่งบน HTTPS'],
      ['ร้านเพิ่มสินค้าใหม่ต้องรอโปรแกรมเมอร์ไหม', 'ไม่ต้อง แอดมินเพิ่มเองในหลังบ้านได้ทันที รูป ราคา สเปค โปรโมชัน ทุกอย่างขึ้นหน้าเว็บอัตโนมัติ'],
      ['ระบบรองรับมือถือไหม', 'รองรับทุกขนาดจอ ตั้งแต่มือถือ แท็บเล็ต ถึงจอใหญ่ และมีโหมดมืดกับ 2 ภาษาให้เลือก'],
    ],
    faqTitle: 'คำถามพบบ่อย',
    secTitle: 'ความปลอดภัยของระบบ',
    security: [
      ['shield', 'Row Level Security (RLS)', 'กฎสิทธิ์ฝังในฐานข้อมูลทุกตาราง ต่อให้ข้ามหน้าเว็บมาได้ ฐานข้อมูลก็ปฏิเสธเองว่าใครเห็น/แก้อะไรได้'],
      ['lock', 'เซสชันปลอดภัย', 'บัตรผ่านเก็บในคุกกี้ HttpOnly อายุ 15 นาที + ต่ออายุแบบหมุนเวียน (rotation) 7 วัน สคริปต์แปลกปลอมขโมยไม่ได้'],
      ['qr', 'ตรวจสลิปฝั่งเซิร์ฟเวอร์', 'การยืนยันเงินโอนเกิดที่ระบบกลางเท่านั้น กุญแจลับไม่เคยอยู่ในหน้าเว็บ ลูกค้าปลอมสลิปไม่ได้'],
      ['check', 'กันบอทและอีเมลปลอม', 'Turnstile ตรวจว่าเป็นคนจริง + ระบบเช็คโดเมนอีเมลก่อนสมัคร กันอีเมลพิมพ์ผิด/อีเมลชั่วคราว'],
    ],
  },
  en: {
    kicker: 'Documentation', title: 'BM Computer System Documentation',
    sub: 'Everything about this e-commerce system: how to use it, the technology behind it, and the developer API reference, all in plain language.',
    openSwagger: 'Open API docs (Swagger)', openSite: 'Open storefront', toc: 'Contents',
    nav: {
      overview: 'System overview', guide: 'How to use', features: 'All features', tech: 'Tech stack',
      architecture: 'Architecture', api: 'Developer API', security: 'Security', faq: 'FAQ',
    },
    overviewP1: 'BM Computer is a complete online store for computer hardware. Customers browse, pay via PromptPay, and track parcels for real, while the shop manages everything from an admin panel without touching code.',
    overviewP2: 'The system follows the same standards as production e-commerce sites: all data lives in a central database, updates appear instantly, with memberships, role-based permissions, and automatic payment verification.',
    stats: [
      ['150+', 'real products'], ['39', 'brands (real logos)'], ['40+', 'API endpoints'],
      ['20+', 'screens'], ['15+', 'database tables'], ['2', 'languages (TH/EN)'],
    ],
    guideCustomer: 'For customers: order in 6 steps',
    guideSteps: [
      ['Browse products', 'Search (typos still match) or filter by category, brand and price, or build a full PC with the PC Builder.'],
      ['Add to cart', 'Add from any page. The system asks you to sign in first if needed (register or use a Google account).'],
      ['Confirm the order', 'Pick a saved shipping address or enter a new one, with a clear total before paying.'],
      ['Scan PromptPay QR', 'The QR locks the exact amount automatically. Scan with any Thai banking app.'],
      ['Upload the slip', 'The system verifies the transfer with the bank instantly and marks the order as paid.'],
      ['Track until delivered', 'Follow every step: packing, shipping (with tracking number), delivered. Verified buyers can review products.'],
    ],
    guideAdmin: 'For the shop: admin panel',
    guideAdminP: 'Admins open Account menu > Admin (visible to admin accounts only) and can do all of this without code:',
    guideAdminList: [
      'Overview: daily sales chart, orders by status, top sellers, and low-stock alerts',
      'Products: add/edit/delete with search and filters, live on the storefront instantly',
      'Categories / brands / promo slides: fully manageable, the site follows',
      'Orders: update status, add tracking numbers, approve cancellations/refunds (stock adjusts automatically)',
      'Payments: full history with search, date-range filter and totals',
      'Customers: member list with lifetime spend · Settings: shop PromptPay account',
    ],
    featuresTitle: 'All features',
    features: [
      ['search', 'Smart search', 'Autocomplete + fuzzy matching that survives typos, with category/brand/price/stock filters and sorting'],
      ['cart', 'Real cart & checkout', 'Creates real orders in the database, deducts stock on payment, supports cancel/refund flows'],
      ['qr', 'PromptPay + slip verification', 'Bank-standard (EMVCo) QR with locked amount, slips verified server-side via EasySlip'],
      ['cpu', 'PC Builder', 'Build a PC with 19 compatibility rules (socket, RAM, wattage, case fit), power estimates, PSU suggestions and game scores'],
      ['users', 'Community builds', 'Share builds as links/QR for others to view and reuse'],
      ['user', 'My account', 'Profile, shipping addresses, tax invoices, payment methods, wishlist and order summary'],
      ['star', 'Verified reviews', 'Only real buyers can review, with a "Purchased" badge and auto-computed ratings'],
      ['grid', 'Full admin panel', 'Sales dashboard with charts, products/orders/customers/payments in one place'],
      ['truck', 'Order tracking', 'Check status by order code with courier and tracking number'],
      ['moon', 'Dark mode + 2 languages', 'Switch theme and Thai/English instantly on every page'],
      ['shield', 'Bot protection', 'Cloudflare Turnstile guards sign-up and sign-in'],
      ['bolt', 'Fast loading', 'Served from a global edge network with skeleton loading everywhere'],
    ],
    techTitle: 'Tech stack (in plain words)',
    techHead: ['Layer', 'Technology', 'What it does'],
    tech: [
      ['Frontend', 'React 18 + Vite', 'The web framework used by major companies worldwide; keeps the site smooth and development fast'],
      ['Design', 'Tailwind CSS v4', 'Keeps colors and spacing consistent across pages, with built-in dark mode'],
      ['Backend API', 'Cloudflare Worker + Hono', 'The "shop staff" program that receives every request, checks permissions first, and runs globally for fast responses'],
      ['Database', 'Supabase (PostgreSQL)', 'Enterprise-grade database with row-level security rules built in'],
      ['Auth', 'Supabase Auth + Google OAuth', 'Secure sign-up/sign-in with encrypted passwords and Google accounts'],
      ['Payments', 'PromptPay (EMVCo) + EasySlip', 'Generates Thai bank-standard QR codes and verifies slips automatically'],
      ['Hosting', 'Cloudflare Pages', 'Global hosting that redeploys automatically on every code push (CI/CD)'],
      ['Version control', 'Git + GitHub', 'Full history of every code change, reviewable and reversible'],
    ],
    archTitle: 'System architecture',
    archP: 'The system has 3 clear layers. The web page never talks to the database directly: every command goes through the backend which verifies permissions first, and the database enforces its own rules again (Row Level Security) in case anything bypasses the backend.',
    archBoxes: [
      ['Frontend', 'React SPA on Cloudflare Pages', 'Every screen customers and admins use, with themes and languages, served fast from a global CDN'],
      ['Backend API', 'Cloudflare Worker · Hono + OpenAPI', 'Receives all requests over HTTPS, authenticates via HttpOnly cookies, verifies slips, manages stock, then reads/writes the database as that user'],
      ['Database', 'Supabase · PostgreSQL + RLS', 'Stores products, orders, members, reviews and builds; every table carries its own permission rules'],
    ],
    archSession: 'Authentication: after sign-in the backend stores a "pass" in an HttpOnly cookie (unreadable by scripts), valid 15 minutes and auto-renewed while you are active. Idle for over an hour and you are signed out (check "Remember me" to stay signed in for 7 days).',
    apiTitle: 'Developer API',
    apiP1: 'The backend exposes a standard REST API. Every route is documented automatically with OpenAPI 3, and the Swagger UI lets you try real calls from the browser.',
    apiP2: 'Main endpoint groups (see full parameters and response examples in Swagger):',
    apiAuthUser: 'requires sign-in (session cookie)', apiAuthAdmin: 'requires an admin account',
    swaggerTitle: 'Try the API right here',
    faqTitle: 'FAQ',
    faq: [
      ['Do I need an account to browse?', 'No. Browse, search and build PCs freely. Sign-in is only needed for the cart, checkout, and saving builds.'],
      ['What payment methods are supported?', 'PromptPay QR, scannable with any Thai banking app. The amount is locked in the QR and slips are verified instantly after upload.'],
      ['Can I cancel an order?', 'Yes. Unpaid orders cancel instantly; paid orders become a cancellation request for the shop to review and refund. Stock is returned automatically.'],
      ['How safe is my data?', 'Passwords are encrypted by Supabase Auth, personal data is fenced by database-level rules (RLS) so each person only sees their own, and the whole site runs on HTTPS.'],
      ['Does the shop need a programmer to add products?', 'No. Admins add products in the panel and they appear on the storefront immediately: images, prices, specs and promotions.'],
      ['Does it work on mobile?', 'Yes, every screen is responsive from phones to large monitors, with dark mode and two languages.'],
    ],
    secTitle: 'Security',
    security: [
      ['shield', 'Row Level Security (RLS)', 'Permission rules live inside every database table; even if the frontend is bypassed, the database itself refuses unauthorized access'],
      ['lock', 'Secure sessions', 'Session passes live in HttpOnly cookies, 15-minute lifetime with 7-day rotating renewal; foreign scripts cannot steal them'],
      ['qr', 'Server-side slip verification', 'Money verification happens only on the backend; secret keys never reach the browser, so slips cannot be faked'],
      ['check', 'Bot & fake-email protection', 'Turnstile verifies humans, and email domains are checked before registration to block typos and disposable addresses'],
    ],
  },
}

// ===== รายการ API (ภาษากลาง path/method + คำอธิบาย 2 ภาษา) =====
const API_GROUPS = [
  {
    name: { th: 'ระบบสมาชิก (Auth)', en: 'Auth' },
    eps: [
      ['POST', '/api/auth/register', { th: 'สมัครสมาชิก (สมัครเสร็จเข้าสู่ระบบให้ทันที)', en: 'Register (auto sign-in)' }],
      ['POST', '/api/auth/login', { th: 'เข้าสู่ระบบ ออกคุกกี้ session', en: 'Sign in, issues session cookies' }],
      ['POST', '/api/auth/session', { th: 'แลก token จาก Google OAuth เป็น session', en: 'Exchange Google OAuth token for a session' }],
      ['POST', '/api/auth/refresh', { th: 'ต่ออายุ session อัตโนมัติ', en: 'Renew the session' }],
      ['POST', '/api/auth/logout', { th: 'ออกจากระบบ', en: 'Sign out' }],
      ['GET', '/api/auth/me', { th: 'ผู้ใช้ปัจจุบัน', en: 'Current user' }],
    ],
  },
  {
    name: { th: 'สินค้า (Catalog)', en: 'Catalog' },
    eps: [
      ['GET', '/api/catalog/products', { th: 'รายการสินค้า (กรองหมวด/แบรนด์/แนะนำ)', en: 'Product list (filter by category/brand/featured)' }],
      ['GET', '/api/catalog/products/{slug}', { th: 'รายละเอียดสินค้า', en: 'Product detail' }],
      ['GET', '/api/catalog/products/{slug}/reviews', { th: 'รีวิวของสินค้า (เขียน/ลบ ใช้ POST/DELETE ต้องเข้าสู่ระบบ)', en: 'Product reviews (write/delete via POST/DELETE, sign-in required)' }],
      ['GET', '/api/catalog/search-index', { th: 'ดัชนีค้นหาสำหรับ autocomplete', en: 'Search index for autocomplete' }],
      ['GET', '/api/catalog/categories', { th: 'หมวดหมู่ทั้งหมด', en: 'All categories' }],
      ['GET', '/api/catalog/brands', { th: 'แบรนด์ทั้งหมด', en: 'All brands' }],
      ['GET', '/api/catalog/slides', { th: 'สไลด์/แบนเนอร์หน้าแรก', en: 'Homepage slides/banners' }],
      ['GET', '/api/catalog/attribute-defs', { th: 'นิยามสเปคต่อหมวด (PC Builder)', en: 'Per-category spec definitions (PC Builder)' }],
    ],
  },
  {
    name: { th: 'คำสั่งซื้อและชำระเงิน (Orders & Payments)', en: 'Orders & Payments' },
    eps: [
      ['POST', '/api/orders', { th: 'สร้างคำสั่งซื้อ', en: 'Create an order' }, 'user'],
      ['GET', '/api/orders', { th: 'ประวัติคำสั่งซื้อของฉัน', en: 'My order history' }, 'user'],
      ['POST', '/api/orders/{id}/cancel', { th: 'ยกเลิก/ขอยกเลิกคำสั่งซื้อ', en: 'Cancel / request cancellation' }, 'user'],
      ['GET', '/api/orders/track/{code}', { th: 'ติดตามคำสั่งซื้อด้วยรหัส', en: 'Track an order by code' }],
      ['POST', '/api/payments/verify-slip', { th: 'ตรวจสลิปโอนเงินและตั้งเป็นชำระแล้ว', en: 'Verify a transfer slip and mark paid' }, 'user'],
    ],
  },
  {
    name: { th: 'บัญชีของฉัน (Account)', en: 'Account' },
    eps: [
      ['GET', '/api/account/profile', { th: 'อ่าน/แก้ข้อมูลส่วนตัว (แก้ใช้ PATCH)', en: 'Read/update profile (PATCH to update)' }, 'user'],
      ['GET', '/api/account/summary', { th: 'สรุปออเดอร์ตามสถานะ', en: 'Order summary by status' }, 'user'],
      ['GET', '/api/account/wishlist', { th: 'สินค้าที่ถูกใจ (เพิ่ม/ลบ ใช้ POST/DELETE)', en: 'Wishlist (add/remove via POST/DELETE)' }, 'user'],
      ['GET', '/api/account/addresses', { th: 'ที่อยู่จัดส่ง (CRUD ครบ: POST/PATCH/DELETE)', en: 'Shipping addresses (full CRUD)' }, 'user'],
      ['GET', '/api/account/tax-profiles', { th: 'ที่อยู่ใบกำกับภาษี (CRUD ครบ)', en: 'Tax invoice profiles (full CRUD)' }, 'user'],
      ['GET', '/api/account/payment-methods', { th: 'ช่องทางชำระเงินที่บันทึกไว้ (CRUD ครบ)', en: 'Saved payment methods (full CRUD)' }, 'user'],
    ],
  },
  {
    name: { th: 'จัดสเปคคอม (PC Builder)', en: 'PC Builder' },
    eps: [
      ['GET', '/api/builder/builds', { th: 'สเปคที่บันทึกไว้ (สร้าง/แก้/ลบ/ทำสำเนา ใช้ POST/PATCH/DELETE)', en: 'Saved builds (create/edit/delete/duplicate)' }, 'user'],
      ['GET', '/api/builder/community', { th: 'สเปคสาธารณะจากชุมชน', en: 'Public community builds' }],
      ['GET', '/api/builder/shared/{code}', { th: 'เปิดสเปคจากลิงก์แชร์', en: 'Open a build from a share link' }],
    ],
  },
  {
    name: { th: 'หลังบ้าน (Admin)', en: 'Admin' },
    eps: [
      ['GET', '/api/admin/products', { th: 'จัดการสินค้า (เพิ่ม/แก้/ลบ ใช้ POST/DELETE)', en: 'Manage products (add/edit/delete)' }, 'admin'],
      ['POST', '/api/admin/brands', { th: 'จัดการแบรนด์และหมวดหมู่ (/api/admin/categories)', en: 'Manage brands and categories' }, 'admin'],
      ['GET', '/api/admin/slides', { th: 'จัดการสไลด์โปรโมชัน', en: 'Manage promo slides' }, 'admin'],
      ['GET', '/api/admin/orders', { th: 'ออเดอร์ทั้งหมด (อัปเดตสถานะ/จัดส่ง ใช้ PATCH)', en: 'All orders (PATCH to update status/shipping)' }, 'admin'],
      ['GET', '/api/admin/customers', { th: 'รายชื่อลูกค้า + ยอดซื้อสะสม', en: 'Customers with lifetime spend' }, 'admin'],
      ['GET', '/api/admin/stats', { th: 'สถิติภาพรวมร้าน', en: 'Store statistics' }, 'admin'],
      ['PUT', '/api/admin/settings/{key}', { th: 'ตั้งค่าเว็บ (เช่น บัญชีรับเงิน)', en: 'Site settings (e.g. payment account)' }, 'admin'],
    ],
  },
]

const METHOD_CLS = {
  GET: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  POST: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  PATCH: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  PUT: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  DELETE: 'bg-red-500/15 text-red-600 dark:text-red-400',
}

const NAV_ITEMS = [
  ['overview', 'box'], ['guide', 'cart'], ['features', 'bolt'], ['tech', 'cpu'],
  ['architecture', 'grid'], ['api', 'doc'], ['security', 'shield'], ['faq', 'users'],
]

export default function DocsPage() {
  const { lang, toggle: toggleLang } = useLang()
  const { theme, toggle: toggleTheme } = useTheme()
  const c = C[lang] || C.th
  usePageMeta(c.title, c.sub)
  const [showSwagger, setShowSwagger] = useState(false)
  const [openNav, setOpenNav] = useState(false)
  const [active, setActive] = useState('overview')

  // scrollspy: ไฮไลต์เมนู sidebar ตาม section ที่กำลังอ่าน
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (vis[0]) setActive(vis[0].target.id)
    }, { rootMargin: '-15% 0px -70% 0px' })
    NAV_ITEMS.forEach(([id]) => { const el = document.getElementById(id); if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [])

  const Sidebar = (
    <nav className="flex h-full flex-col gap-5 p-4" aria-label={c.toc}>
      <Link to="/docs" className="flex items-center gap-2.5 px-2" onClick={() => setOpenNav(false)}>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white"><Icon name="doc" size={20} /></span>
        <span className="font-extrabold tracking-wide">{c.kicker}</span>
      </Link>
      <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
        <div className="mb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-muted">{c.toc}</div>
        {NAV_ITEMS.map(([id, icon]) => (
          <a key={id} href={`#${id}`} onClick={() => { setActive(id); setOpenNav(false) }}
            className={cx('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              active === id ? 'bg-brand-600 text-white shadow-sm' : 'text-fg hover:bg-surface2')}>
            <Icon name={icon} size={18} /> {c.nav[id]}
          </a>
        ))}
      </div>
      <a href="/api/docs" target="_blank" rel="noreferrer"
        className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2.5 text-sm font-semibold hover:bg-surface2">
        <Icon name="bolt" size={18} className="text-brand-600" /> Swagger UI
      </a>
      <Link to="/" className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2.5 text-sm font-semibold hover:bg-surface2">
        <Icon name="cart" size={18} /> {c.openSite}
      </Link>
    </nav>
  )

  return (
    <div className="min-h-dvh bg-bg text-fg lg:grid lg:grid-cols-[260px_1fr]">
      {/* Sidebar (จอใหญ่: ติดซ้าย · มือถือ: drawer) - เลย์เอาต์เต็มหน้าแบบเดียวกับ /admin */}
      <aside className="sticky top-0 hidden h-dvh border-r border-line bg-surface lg:block">{Sidebar}</aside>
      {openNav && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpenNav(false)} />
          <aside className="absolute left-0 top-0 h-full w-[260px] border-r border-line bg-surface">{Sidebar}</aside>
        </div>
      )}

      <div className="flex min-h-dvh flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur">
          <button className="grid h-10 w-10 place-items-center rounded-lg hover:bg-surface2 lg:hidden cursor-pointer" onClick={() => setOpenNav(true)} aria-label="menu"><Icon name="menu" /></button>
          <h1 className="line-clamp-1 text-lg font-bold">{c.title}</h1>
          <div className="ml-auto flex items-center gap-1.5">
            <button onClick={toggleLang} className="flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold hover:bg-surface2 cursor-pointer" aria-label="language">
              <Icon name="globe" size={17} /><span className="uppercase">{lang}</span>
            </button>
            <button onClick={toggleTheme} className="grid h-10 w-10 place-items-center rounded-lg hover:bg-surface2 cursor-pointer" aria-label="theme"><Icon name={theme === 'dark' ? 'sun' : 'moon'} /></button>
            <Link to="/" className="hidden items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 sm:flex">
              <Icon name="cart" size={15} /> {c.openSite}
            </Link>
          </div>
        </header>

        <main className="flex-1">
          <div className="mx-auto max-w-[960px] px-4 py-8 sm:px-6">
            {/* หัวเอกสาร */}
            <header className="mb-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold tracking-wide text-brand-700 dark:bg-brand-600/15 dark:text-brand-400">
                <Icon name="doc" size={13} /> {c.kicker}
              </span>
              <h2 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">{c.title}</h2>
              <p className="mt-2 max-w-[70ch] leading-relaxed text-muted">{c.sub}</p>
            </header>
          {/* OVERVIEW */}
          <DocSection id="overview" icon="box" title={c.nav.overview}>
            <p className="leading-relaxed">{c.overviewP1}</p>
            <p className="mt-3 leading-relaxed text-muted">{c.overviewP2}</p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {c.stats.map(([n, label]) => (
                <div key={label} className="rounded-xl border border-line bg-surface px-3 py-4 text-center">
                  <div className="nums text-xl font-extrabold text-brand-600">{n}</div>
                  <div className="mt-1 text-xs text-muted">{label}</div>
                </div>
              ))}
            </div>
          </DocSection>

          {/* GUIDE */}
          <DocSection id="guide" icon="cart" title={c.nav.guide}>
            <h3 className="font-bold">{c.guideCustomer}</h3>
            <ol className="mt-4 grid gap-3 sm:grid-cols-2">
              {c.guideSteps.map(([tt, d], i) => (
                <li key={tt} className="flex gap-3 rounded-xl border border-line bg-surface p-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">{i + 1}</span>
                  <div><b className="text-sm">{tt}</b><p className="mt-1 text-sm leading-relaxed text-muted">{d}</p></div>
                </li>
              ))}
            </ol>
            <h3 className="mt-8 font-bold">{c.guideAdmin}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{c.guideAdminP}</p>
            <ul className="mt-3 grid gap-2">
              {c.guideAdminList.map((x) => (
                <li key={x} className="flex items-start gap-2.5 text-sm leading-relaxed">
                  <Icon name="check" size={16} className="mt-0.5 shrink-0 text-emerald-500" /> {x}
                </li>
              ))}
            </ul>
          </DocSection>

          {/* FEATURES */}
          <DocSection id="features" icon="bolt" title={c.featuresTitle}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {c.features.map(([icon, tt, d]) => (
                <div key={tt} className="rounded-xl border border-line bg-surface p-4">
                  <div className="mb-2 grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-600/15"><Icon name={icon} size={18} /></div>
                  <b className="text-sm">{tt}</b>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{d}</p>
                </div>
              ))}
            </div>
          </DocSection>

          {/* TECH */}
          <DocSection id="tech" icon="cpu" title={c.techTitle}>
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-surface2 text-left text-xs uppercase text-muted">
                  <tr>{c.techHead.map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {c.tech.map(([part, tech, why]) => (
                    <tr key={part} className="border-t border-line">
                      <td className="whitespace-nowrap px-4 py-3 font-semibold">{part}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-brand-600">{tech}</td>
                      <td className="px-4 py-3 leading-relaxed text-muted">{why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DocSection>

          {/* ARCHITECTURE */}
          <DocSection id="architecture" icon="grid" title={c.archTitle}>
            <p className="leading-relaxed text-muted">{c.archP}</p>
            <div className="mt-5 grid items-stretch gap-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
              {c.archBoxes.map(([tt, tech, d], i) => (
                <div key={tt} className="contents">
                  {i > 0 && (
                    <div className="grid place-items-center text-brand-600" aria-hidden="true">
                      <Icon name="arrowRight" size={22} className="rotate-90 lg:rotate-0" />
                    </div>
                  )}
                  <div className="rounded-xl border-2 border-brand-600/30 bg-surface p-4">
                    <b className="text-sm">{tt}</b>
                    <div className="mt-0.5 text-xs font-semibold text-brand-600">{tech}</div>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-surface2/70 p-4 text-sm leading-relaxed">
              <Icon name="lock" size={16} className="mt-0.5 shrink-0 text-brand-600" /> {c.archSession}
            </p>
          </DocSection>

          {/* API */}
          <DocSection id="api" icon="doc" title={c.apiTitle}>
            <p className="leading-relaxed">{c.apiP1}</p>
            <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted">
              <Icon name="lock" size={13} className="shrink-0 text-brand-600" /> {c.apiAuthUser}
              <span aria-hidden="true">·</span>
              <Icon name="shield" size={13} className="shrink-0 text-brand-600" /> {c.apiAuthAdmin}
            </p>
            <p className="mt-4 font-semibold">{c.apiP2}</p>
            <div className="mt-3 flex flex-col gap-4">
              {API_GROUPS.map((g) => (
                <div key={g.name.en} className="overflow-hidden rounded-xl border border-line">
                  <div className="bg-surface2 px-4 py-2.5 text-sm font-bold">{g.name[lang] || g.name.th}</div>
                  <div className="divide-y divide-line">
                    {g.eps.map(([m, path, d, auth]) => (
                      <div key={m + path} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm">
                        <span className={cx('w-14 shrink-0 rounded-md px-1.5 py-0.5 text-center text-[11px] font-bold', METHOD_CLS[m])}>{m}</span>
                        <code className="nums shrink-0 font-mono text-[13px]">{path}</code>
                        <span className="flex min-w-[200px] flex-1 items-center gap-1.5 text-muted">
                          {auth && <Icon name={auth === 'admin' ? 'shield' : 'lock'} size={13} className="shrink-0 text-brand-600" aria-label={auth === 'admin' ? c.apiAuthAdmin : c.apiAuthUser} />}
                          {d[lang] || d.th}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Swagger ฝังในหน้า */}
            <div className="mt-6 overflow-hidden rounded-xl border border-line">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-surface2 px-4 py-3">
                <b className="text-sm">{c.swaggerTitle}</b>
                <div className="flex gap-2">
                  <button onClick={() => setShowSwagger((v) => !v)}
                    className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700 cursor-pointer">
                    {showSwagger ? '−' : '+'} Swagger UI
                  </button>
                  <a href="/api/docs" target="_blank" rel="noreferrer"
                    className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-surface2">
                    ↗ /api/docs
                  </a>
                </div>
              </div>
              {showSwagger && (
                <iframe src="/api/docs" title="Swagger UI" className="h-[640px] w-full bg-white" loading="lazy" />
              )}
            </div>
          </DocSection>

          {/* SECURITY */}
          <DocSection id="security" icon="shield" title={c.secTitle}>
            <div className="grid gap-3 sm:grid-cols-2">
              {c.security.map(([icon, tt, d]) => (
                <div key={tt} className="flex gap-3 rounded-xl border border-line bg-surface p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-600/15"><Icon name={icon} size={18} /></span>
                  <div><b className="text-sm">{tt}</b><p className="mt-1 text-sm leading-relaxed text-muted">{d}</p></div>
                </div>
              ))}
            </div>
          </DocSection>

          {/* FAQ */}
          <DocSection id="faq" icon="users" title={c.faqTitle}>
            <div className="flex flex-col gap-2">
              {c.faq.map(([q, a]) => (
                <details key={q} className="group rounded-xl border border-line bg-surface">
                  <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                    {q}
                    <Icon name="chevronDown" size={16} className="shrink-0 text-muted transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="px-4 pb-4 text-sm leading-relaxed text-muted">{a}</p>
                </details>
              ))}
            </div>
          </DocSection>
          </div>
        </main>
      </div>
    </div>
  )
}

function DocSection({ id, icon, title, children }) {
  return (
    <section id={id} className="mb-10 scroll-mt-[150px]">
      <h2 className="mb-4 flex items-center gap-2.5 text-lg font-bold sm:text-xl">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white"><Icon name={icon} size={18} /></span>
        {title}
      </h2>
      {children}
    </section>
  )
}
