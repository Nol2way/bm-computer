-- =====================================================================
-- ระบบเคลมประกันสินค้า (Warranty claims)
-- รันใน Supabase Dashboard → SQL Editor → New query → วางทั้งหมด → Run
-- =====================================================================

-- ---------- 1) ข้อมูลประกันบนสินค้า ----------
alter table public.products
  add column if not exists warranty_period_months int default 0,
  add column if not exists warranty_conditions text,
  add column if not exists warranty_service_center text,
  add column if not exists warranty_service_phone text;

-- ---------- 2) ตารางเคลมประกัน ----------
create table if not exists public.warranty_claims (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  order_item_id uuid references public.order_items(id) on delete set null,
  product_id    uuid references public.products(id) on delete set null,
  -- อ้างอิง profiles (ไม่ใช่ auth.users ตรงๆ) เพื่อให้ PostgREST embed profiles(...) ใน select ได้
  user_id       uuid not null references public.profiles(id) on delete cascade,
  reason        text not null check (char_length(reason) between 10 and 500),
  evidence_url  text,
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'processed')),
  admin_notes   text check (char_length(admin_notes) <= 500),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
drop trigger if exists trg_warranty_claims_updated on public.warranty_claims;
create trigger trg_warranty_claims_updated before update on public.warranty_claims
  for each row execute function public.set_updated_at();

create index if not exists idx_warranty_claims_user on public.warranty_claims(user_id);
create index if not exists idx_warranty_claims_order on public.warranty_claims(order_id);
create index if not exists idx_warranty_claims_status on public.warranty_claims(status);
-- กันเคลมซ้ำต่อสินค้าเดิมในออเดอร์เดิม (order_item เดียวเคลมได้ครั้งเดียว)
create unique index if not exists uq_warranty_claims_order_item on public.warranty_claims(order_item_id) where order_item_id is not null;

alter table public.warranty_claims enable row level security;

drop policy if exists "own warranty claims" on public.warranty_claims;
create policy "own warranty claims" on public.warranty_claims for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "create own warranty claims" on public.warranty_claims;
create policy "create own warranty claims" on public.warranty_claims for insert
  with check (auth.uid() = user_id and exists (
    select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()
  ));

drop policy if exists "admin manage warranty claims" on public.warranty_claims;
create policy "admin manage warranty claims" on public.warranty_claims for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------- 3) Storage bucket สำหรับรูปหลักฐานเคลม ----------
insert into storage.buckets (id, name, public)
values ('warranty-evidence', 'warranty-evidence', true)
on conflict (id) do nothing;

-- ผู้ใช้ที่ล็อกอินอัปโหลดได้เฉพาะใน folder ของตัวเอง ({user_id}/...) - อ่านสาธารณะเพราะ bucket public
drop policy if exists "upload own warranty evidence" on storage.objects;
create policy "upload own warranty evidence" on storage.objects for insert to authenticated
  with check (bucket_id = 'warranty-evidence' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "public read warranty evidence" on storage.objects;
create policy "public read warranty evidence" on storage.objects for select
  using (bucket_id = 'warranty-evidence');

-- =====================================================================
-- เสร็จแล้ว
-- =====================================================================
