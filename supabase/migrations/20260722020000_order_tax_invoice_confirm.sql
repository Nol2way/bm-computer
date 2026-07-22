-- =====================================================================
-- ล็อกการเลือกที่อยู่ใบกำกับภาษี (จากหน้า /account/invoice) ต่อออเดอร์
-- เดิมเก็บสถานะ "ยืนยันแล้ว" ไว้แค่ใน localStorage ของเบราว์เซอร์ (หายเมื่อเปลี่ยนเครื่อง/ล้างแคช)
-- ย้ายมาเก็บที่ orders โดยตรง เพื่อให้ยืนยันได้ครั้งเดียวจริงๆ ไม่ว่าจะเข้าจากเครื่อง/เบราว์เซอร์ไหน
-- idempotent: รันซ้ำได้ปลอดภัย
-- =====================================================================

alter table public.orders
  add column if not exists tax_invoice_confirmed_profile_id uuid references public.tax_profiles(id) on delete set null,
  add column if not exists tax_invoice_confirmed_at timestamptz;
