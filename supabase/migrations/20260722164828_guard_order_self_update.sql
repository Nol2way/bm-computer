-- =====================================================================
-- ช่องโหว่: ลูกค้าตั้งออเดอร์ตัวเองเป็น "ชำระแล้ว" ได้ (ได้ของฟรี)
--
-- policy "own orders update" อนุญาต UPDATE ทั้งแถวถ้าเป็นออเดอร์ของตัวเอง
-- ผู้ใช้ที่ล็อกอินแล้วยิง PostgREST ตรงด้วย anon key + token ตัวเอง จึงทำได้:
--    PATCH /rest/v1/orders?id=eq.<ออเดอร์ตัวเอง>  {"status":"paid","total":1}
-- ข้ามทั้งการจ่ายเงินและการตรวจสลิป
--
-- ยังต้องคง policy ไว้ เพราะ POST /api/orders/{id}/cancel และการยืนยันที่อยู่
-- ใบกำกับภาษี ทำงานในนามผู้ใช้ -> จึงคุมด้วย trigger ว่าแก้อะไรได้บ้าง
-- =====================================================================
create or replace function public.guard_order_update()
returns trigger language plpgsql security definer set search_path to 'public'
as $$
begin
  -- แอดมินและ worker (service_role) แก้ได้ตามปกติ
  if coalesce(auth.role(), '') = 'service_role' or public.is_admin() then
    return new;
  end if;

  -- ลูกค้าห้ามแตะข้อมูลเงิน/สถานะการจ่าย/การจัดส่ง/ตัวตนเจ้าของ
  if new.total          is distinct from old.total
  or new.user_id        is distinct from old.user_id
  or new.code           is distinct from old.code
  or new.paid_at        is distinct from old.paid_at
  or new.payment_method is distinct from old.payment_method
  or new.tracking_no    is distinct from old.tracking_no
  or new.courier        is distinct from old.courier
  or new.ship_name      is distinct from old.ship_name
  or new.ship_phone     is distinct from old.ship_phone
  or new.ship_address   is distinct from old.ship_address
  or coalesce(new.stock_deducted, false) is distinct from coalesce(old.stock_deducted, false)
  then
    raise exception 'ไม่มีสิทธิ์แก้ไขข้อมูลคำสั่งซื้อส่วนนี้' using errcode = '42501';
  end if;

  -- เปลี่ยนสถานะเองได้เฉพาะเส้นทาง "ยกเลิก" ตามที่หน้าเว็บรองรับเท่านั้น
  if new.status is distinct from old.status
     and not (
       (old.status = 'pending' and new.status = 'cancel')
       or (old.status in ('paid', 'packing') and new.status = 'cancel_requested')
     ) then
    raise exception 'เปลี่ยนสถานะคำสั่งซื้อเองไม่ได้' using errcode = '42501';
  end if;

  return new;
end $$;

drop trigger if exists trg_orders_guard_update on public.orders;
create trigger trg_orders_guard_update
  before update on public.orders
  for each row execute function public.guard_order_update();

revoke all on function public.guard_order_update() from public, anon, authenticated;
