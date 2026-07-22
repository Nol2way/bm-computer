-- =====================================================================
-- ตารางเก็บข้อมูลใบกำกับภาษีที่ลูกค้ากรอกตอน checkout (แยกจาก orders)
-- เก็บเป็น snapshot ต่อออเดอร์ 1 แถว เพื่อให้ใบกำกับภาษีถูกต้องตามช่วงเวลาที่สั่งซื้อ
-- แม้ผู้ใช้จะแก้ไข/ลบโปรไฟล์ภาษีในบัญชีภายหลังก็ตาม
-- (ก่อนหน้านี้ฟอร์มใบกำกับภาษีตอน checkout ถูกทิ้งไม่บันทึกที่ไหนเลย)
-- idempotent: รันซ้ำได้ปลอดภัย
-- =====================================================================

create table if not exists public.order_tax_invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  invoice_no text,
  book_no text,
  addr_no text,
  lane text,
  building text,
  street_no text,
  village text,
  village_name text,
  soi text,
  street text not null,
  sub_district text not null,
  district text not null,
  province text not null,
  postal_code text not null,
  created_at timestamptz not null default now()
);

-- ออเดอร์หนึ่งมีใบกำกับภาษีได้แค่ชุดเดียว
create unique index if not exists order_tax_invoices_order_id_key on public.order_tax_invoices (order_id);

alter table public.order_tax_invoices enable row level security;

-- เจ้าของออเดอร์ดูใบกำกับภาษีของตัวเองได้
drop policy if exists "own order tax invoice select" on public.order_tax_invoices;
create policy "own order tax invoice select" on public.order_tax_invoices for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- เจ้าของออเดอร์สร้างใบกำกับภาษีให้ออเดอร์ตัวเองได้ (ตอน checkout)
drop policy if exists "own order tax invoice insert" on public.order_tax_invoices;
create policy "own order tax invoice insert" on public.order_tax_invoices for insert
  with check (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- แอดมินดู/จัดการได้ทั้งหมด
drop policy if exists "admin order tax invoice all" on public.order_tax_invoices;
create policy "admin order tax invoice all" on public.order_tax_invoices for all
  using (public.is_admin()) with check (public.is_admin());
