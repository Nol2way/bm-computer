-- =====================================================================
-- ระยะประกันเริ่มต้นตามหมวดสินค้า (อิงมาตรฐานร้านไอทีไทย)
-- ก่อนหน้านี้สินค้า 154/156 ชิ้นมี warranty_period_months = 0
-- => หน้าเว็บเขียนว่า "ของแท้ ประกันศูนย์ไทย" แต่ระบบเคลมใช้จริงไม่ได้เลยสักชิ้น
-- แอดมินแก้รายตัวได้ในหลังบ้าน (ฟอร์มสินค้ามีช่องประกันอยู่แล้ว) - นี่คือค่าตั้งต้นเท่านั้น
-- =====================================================================
update public.products p
   set warranty_period_months = v.months
  from (values
    ('cpu', 36),        -- ซีพียูกล่อง Intel/AMD ปกติ 3 ปี
    ('gpu', 36),
    ('mainboard', 36),
    ('ram', 60),        -- แรมส่วนใหญ่ประกัน limited lifetime - ตั้ง 5 ปีแบบระมัดระวัง
    ('storage', 60),    -- SSD NVMe ทั่วไป 5 ปี
    ('psu', 60),
    ('monitor', 36),
    ('notebook', 24),
    ('cooler', 24),
    ('gear', 24),       -- เกมมิ่งเกียร์ 1-2 ปี
    ('case', 12)
  ) as v(cat, months)
  join public.categories c on c.slug = v.cat
 where p.category_id = c.id
   and coalesce(p.warranty_period_months, 0) = 0;

-- ข้อมูลศูนย์บริการเริ่มต้น (แอดมินแก้ได้รายสินค้า)
update public.products
   set warranty_service_center = coalesce(warranty_service_center, 'BM Computer Service Center'),
       warranty_service_phone  = coalesce(warranty_service_phone, '02-000-0000')
 where coalesce(warranty_period_months, 0) > 0;
