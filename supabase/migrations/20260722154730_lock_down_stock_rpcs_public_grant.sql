-- ฟังก์ชันที่สร้างใหม่ได้สิทธิ์ EXECUTE ให้ PUBLIC มาโดยอัตโนมัติ
-- การ revoke จาก anon/authenticated เฉยๆ จึงไม่พอ ต้องถอนจาก PUBLIC ด้วย
revoke all on function public.mark_order_paid(uuid) from public;
revoke all on function public.mark_order_paid(uuid) from anon, authenticated;
grant execute on function public.mark_order_paid(uuid) to service_role;

revoke all on function public.adjust_order_stock(uuid, integer) from public;
revoke all on function public.adjust_order_stock(uuid, integer) from anon;
-- แอดมินเรียกด้วย token ตัวเอง (authenticated) ผ่าน PATCH /api/admin/orders/{id}
grant execute on function public.adjust_order_stock(uuid, integer) to authenticated, service_role;
