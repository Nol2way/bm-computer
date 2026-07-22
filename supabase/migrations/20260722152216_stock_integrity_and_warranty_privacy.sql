-- =====================================================================
-- 1) ความถูกต้องของสต็อก: ห้ามขายเกินจำนวนที่มีจริง
-- 2) ความเป็นส่วนตัวของหลักฐานเคลมประกัน: ปิด bucket สาธารณะ
-- =====================================================================

-- ---------- 1) สต็อกห้ามติดลบ (บังคับที่ระดับฐานข้อมูล = กันได้แม้โค้ดพลาด) ----------
update public.products set stock = 0 where stock < 0;
alter table public.products drop constraint if exists products_stock_nonneg;
alter table public.products add constraint products_stock_nonneg check (stock >= 0);

-- ---------- 2) ตัด/คืนสต็อก: ไม่กลืน error อีกต่อไป ----------
-- เดิมใช้ greatest(0, ...) -> ตัดสต็อกที่ไม่มีของจริงได้แบบ "เงียบ" (ขายเกิน)
-- ใหม่: ของไม่พอ = raise ให้ทั้งธุรกรรม rollback + ส่งชื่อสินค้าที่ขาดกลับไปให้ผู้ใช้เห็น
create or replace function public.adjust_order_stock(p_order uuid, p_dir integer)
returns void language plpgsql security definer set search_path to 'public'
as $$
declare v_short text;
begin
  if coalesce(auth.role(), '') <> 'service_role' and not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  -- ตัดสต็อก: ตรวจก่อนว่าพอทุกรายการ (เพื่อได้ข้อความบอกชื่อสินค้าที่ขาด)
  if p_dir < 0 then
    select string_agg(p.name || ' (เหลือ ' || p.stock || ' · สั่ง ' || oi.qty || ')', ', ')
      into v_short
      from public.order_items oi
      join public.products p on p.id = oi.product_id
     where oi.order_id = p_order and p.stock < oi.qty;
    if v_short is not null then
      raise exception 'insufficient_stock: %', v_short using errcode = 'P0001';
    end if;
  end if;

  -- ถ้ามีคนแย่งตัดพร้อมกันจนติดลบ constraint products_stock_nonneg จะโยน 23514 เอง (กัน race)
  update public.products p
     set stock = p.stock + p_dir * oi.qty
    from public.order_items oi
   where oi.order_id = p_order and oi.product_id = p.id;
end $$;

-- ---------- 3) ยืนยันชำระเงินแบบ atomic (ล็อกออเดอร์ + ตัดสต็อก + ตั้งสถานะ ในธุรกรรมเดียว) ----------
-- เดิม payments.ts ตัดสต็อกแล้วค่อย update สถานะเป็นคนละคำสั่ง: ถ้าคำสั่งหลังพลาด สต็อกหายแต่ออเดอร์ยังไม่จ่าย
create or replace function public.mark_order_paid(p_order uuid)
returns jsonb language plpgsql security definer set search_path to 'public'
as $$
declare v_status text; v_deducted boolean;
begin
  if coalesce(auth.role(), '') <> 'service_role' and not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  -- ล็อกแถวออเดอร์: กันยิงยืนยันสลิปซ้อนกันสองครั้งพร้อมกันแล้วตัดสต็อกสองรอบ
  select status, coalesce(stock_deducted, false) into v_status, v_deducted
    from public.orders where id = p_order for update;
  if not found then raise exception 'order_not_found' using errcode = 'P0002'; end if;

  if v_status in ('paid', 'packing', 'shipping', 'done') then
    return jsonb_build_object('already', true, 'status', v_status);
  end if;
  if v_status in ('cancel', 'cancel_requested', 'refunded') then
    raise exception 'order_not_payable: %', v_status using errcode = 'P0001';
  end if;

  if not v_deducted then
    perform public.adjust_order_stock(p_order, -1);
  end if;

  update public.orders
     set status = 'paid', stock_deducted = true, paid_at = now()
   where id = p_order;

  return jsonb_build_object('already', false, 'status', 'paid');
end $$;

-- ---------- 4) หลักฐานเคลมประกัน = ข้อมูลส่วนบุคคล ห้ามเปิดสาธารณะ ----------
-- เดิม bucket public: ใครได้ลิงก์ไปก็เปิดดูรูปหลักฐานของลูกค้าคนอื่นได้
-- ใหม่: bucket ปิด + เก็บ path ไว้ แล้วให้ backend ออก signed URL อายุสั้นเฉพาะเจ้าของ/แอดมิน
alter table public.warranty_claims add column if not exists evidence_path text;

update public.warranty_claims
   set evidence_path = split_part(evidence_url, '/warranty-evidence/', 2)
 where evidence_path is null and evidence_url like '%/warranty-evidence/%';

update storage.buckets set public = false where id = 'warranty-evidence';

drop policy if exists "public read warranty evidence" on storage.objects;
drop policy if exists "read own warranty evidence" on storage.objects;
create policy "read own warranty evidence" on storage.objects for select to authenticated
  using (
    bucket_id = 'warranty-evidence'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
