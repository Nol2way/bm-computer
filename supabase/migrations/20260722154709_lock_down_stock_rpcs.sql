-- =====================================================================
-- ปิดไม่ให้เรียกฟังก์ชันตัดสต็อก/ยืนยันจ่ายเงินผ่าน PostgREST โดยตรง
-- (ในฟังก์ชันมีด่าน is_admin()/service_role อยู่แล้ว - นี่คือชั้นที่สองแบบ defense-in-depth
--  ให้ endpoint หายไปจาก REST API เลย ไม่ใช่แค่ตอบ forbidden)
-- หมายเหตุ: migration ตัวถัดไป (lock_down_stock_rpcs_public_grant) ถอนสิทธิ์จาก PUBLIC เพิ่ม
--           เพราะการ revoke จาก anon/authenticated เฉยๆ ยังไม่พอ
-- =====================================================================

-- mark_order_paid: มีแต่ worker (service_role) เท่านั้นที่เรียก -> ไม่ต้องเปิดให้ role ฝั่ง client เลย
revoke all on function public.mark_order_paid(uuid) from anon, authenticated;

-- adjust_order_stock: แอดมินเรียกผ่าน PATCH /api/admin/orders/{id} ด้วย token ของตัวเอง (role = authenticated)
-- จึงต้องคง execute ของ authenticated ไว้ (ในฟังก์ชันเช็ค is_admin() ซ้ำอีกชั้น) แต่ปิด anon ทิ้ง
revoke all on function public.adjust_order_stock(uuid, integer) from anon;
