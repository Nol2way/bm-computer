-- =====================================================================
-- BM Computer - Seed Data  (รันหลัง schema.sql)
-- ภาพสินค้าเป็นแบบ "ลิงก์ URL" (placehold.co) - เปลี่ยนเป็นรูปจริงได้ที่หลังบ้าน
-- =====================================================================

-- ---------- CATEGORIES ----------
insert into public.categories (slug,name_th,name_en,icon,sort) values
  ('cpu','ซีพียู','CPU','cpu',1),
  ('gpu','การ์ดจอ','Graphics Card','gpu',2),
  ('mainboard','เมนบอร์ด','Mainboard','mainboard',3),
  ('ram','แรม','RAM','ram',4),
  ('storage','SSD / HDD','SSD / HDD','storage',5),
  ('monitor','จอมอนิเตอร์','Monitor','monitor',6),
  ('notebook','โน้ตบุ๊ก','Notebook','notebook',7),
  ('gear','เกมมิ่งเกียร์','Gaming Gear','gear',8)
on conflict (slug) do nothing;

-- ---------- BRANDS ----------
insert into public.brands (slug,name,logo_url,sort) values
  ('amd','AMD','https://placehold.co/120x48/ffffff/000000?text=AMD',1),
  ('intel','Intel','https://placehold.co/120x48/ffffff/0071c5?text=Intel',2),
  ('nvidia','NVIDIA','https://placehold.co/120x48/ffffff/76b900?text=NVIDIA',3),
  ('asus','ASUS','https://placehold.co/120x48/ffffff/000000?text=ASUS',4),
  ('msi','MSI','https://placehold.co/120x48/ffffff/cc0000?text=MSI',5),
  ('gigabyte','Gigabyte','https://placehold.co/120x48/ffffff/e87d0d?text=GIGABYTE',6),
  ('corsair','Corsair','https://placehold.co/120x48/ffffff/000000?text=CORSAIR',7),
  ('kingston','Kingston','https://placehold.co/120x48/ffffff/cc0000?text=Kingston',8),
  ('samsung','Samsung','https://placehold.co/120x48/ffffff/1428a0?text=SAMSUNG',9),
  ('wd','WD','https://placehold.co/120x48/ffffff/000000?text=WD',10),
  ('logitech','Logitech','https://placehold.co/120x48/ffffff/00b8fc?text=Logitech',11),
  ('lg','LG','https://placehold.co/120x48/ffffff/a50034?text=LG',12),
  ('acer','Acer','https://placehold.co/120x48/ffffff/83b81a?text=acer',13),
  ('lenovo','Lenovo','https://placehold.co/120x48/ffffff/e2231a?text=Lenovo',14),
  ('razer','Razer','https://placehold.co/120x48/ffffff/44d62c?text=RAZER',15)
on conflict (slug) do nothing;

-- ---------- PRODUCTS ----------
with cat as (select slug,id from public.categories), br as (select slug,id from public.brands)
insert into public.products (slug,name,category_id,brand_id,price,old_price,sale_price,stock,rating,reviews_count,badge,is_featured,images,specs)
select v.slug, v.name, cat.id, br.id, v.price, v.old_price, v.sale_price, v.stock, v.rating, v.reviews, v.badge, v.featured, v.images, v.specs
from (values
  -- CPU
  ('cpu-7800x3d','AMD Ryzen 7 7800X3D 8-Core AM5','cpu','amd',13900,15500,12900,12,4.9,214,'best',true,
    '["https://placehold.co/800x800/f4f4f5/dc2626?text=Ryzen+7+7800X3D","https://placehold.co/800x800/ececef/dc2626?text=7800X3D+%232","https://placehold.co/800x800/e5e5ea/dc2626?text=7800X3D+%233"]'::jsonb,
    '{"Cores":"8C / 16T","Clock":"4.2 - 5.0 GHz","Socket":"AM5","TDP":"120W","Cache":"96MB 3D V-Cache"}'::jsonb),
  ('cpu-7600','AMD Ryzen 5 7600 6-Core AM5','cpu','amd',7290,7990,null,30,4.7,121,null,false,
    '["https://placehold.co/800x800/f4f4f5/dc2626?text=Ryzen+5+7600"]'::jsonb,
    '{"Cores":"6C / 12T","Clock":"3.8 - 5.1 GHz","Socket":"AM5","TDP":"65W"}'::jsonb),
  ('cpu-14600k','Intel Core i5-14600K','cpu','intel',10500,11900,null,18,4.6,98,null,false,
    '["https://placehold.co/800x800/f4f4f5/0071c5?text=Core+i5-14600K"]'::jsonb,
    '{"Cores":"14C (6P+8E)","Clock":"up to 5.3 GHz","Socket":"LGA1700","TDP":"125W"}'::jsonb),
  ('cpu-14700k','Intel Core i7-14700K','cpu','intel',14900,16500,null,9,4.8,76,null,true,
    '["https://placehold.co/800x800/f4f4f5/0071c5?text=Core+i7-14700K"]'::jsonb,
    '{"Cores":"20C (8P+12E)","Clock":"up to 5.6 GHz","Socket":"LGA1700","TDP":"125W"}'::jsonb),
  -- GPU
  ('gpu-4070s','ASUS TUF RTX 4070 SUPER OC 12GB','gpu','asus',22900,24900,null,6,4.8,156,'sale',true,
    '["https://dlcdnwebimgs.asus.com/gain/61d4f727-4456-41bf-b4a8-51bcf0c9eea5/w800","https://placehold.co/800x800/ececef/dc2626?text=TUF+4070S+%232"]'::jsonb,
    '{"Chipset":"RTX 4070 SUPER","Memory":"12GB GDDR6X","Ports":"3x DP, 1x HDMI","Length":"301mm"}'::jsonb),
  ('gpu-4060ti','MSI RTX 4060 Ti VENTUS 8GB','gpu','msi',13900,14900,null,15,4.5,143,null,false,
    '["https://placehold.co/800x800/f4f4f5/cc0000?text=RTX+4060+Ti"]'::jsonb,
    '{"Chipset":"RTX 4060 Ti","Memory":"8GB GDDR6","Ports":"3x DP, 1x HDMI"}'::jsonb),
  ('gpu-7800xt','Gigabyte RX 7800 XT Gaming OC 16GB','gpu','gigabyte',18900,20900,17900,7,4.7,88,'sale',true,
    '["https://placehold.co/800x800/f4f4f5/e87d0d?text=RX+7800+XT"]'::jsonb,
    '{"Chipset":"RX 7800 XT","Memory":"16GB GDDR6","Ports":"2x DP, 2x HDMI"}'::jsonb),
  ('gpu-4080s','ASUS ROG Strix RTX 4080 SUPER 16GB','gpu','asus',43900,46900,null,4,4.9,52,'best',true,
    '["https://placehold.co/800x800/f4f4f5/dc2626?text=RTX+4080+SUPER"]'::jsonb,
    '{"Chipset":"RTX 4080 SUPER","Memory":"16GB GDDR6X","Ports":"3x DP, 2x HDMI"}'::jsonb),
  -- MAINBOARD
  ('mb-b650','MSI MAG B650 TOMAHAWK WIFI','mainboard','msi',7490,null,null,20,4.7,88,null,false,
    '["https://placehold.co/800x800/f4f4f5/cc0000?text=B650+TOMAHAWK"]'::jsonb,
    '{"Socket":"AM5","Chipset":"B650","Form":"ATX","RAM":"DDR5 192GB"}'::jsonb),
  ('mb-b760','ASUS TUF B760-PLUS WIFI','mainboard','asus',6490,6990,null,16,4.6,71,null,false,
    '["https://placehold.co/800x800/f4f4f5/000000?text=TUF+B760"]'::jsonb,
    '{"Socket":"LGA1700","Chipset":"B760","Form":"ATX","RAM":"DDR5 128GB"}'::jsonb),
  ('mb-x670','Gigabyte X670 AORUS Elite AX','mainboard','gigabyte',11900,12900,null,8,4.8,40,null,true,
    '["https://placehold.co/800x800/f4f4f5/e87d0d?text=X670+AORUS"]'::jsonb,
    '{"Socket":"AM5","Chipset":"X670","Form":"ATX","RAM":"DDR5 128GB"}'::jsonb),
  -- RAM
  ('ram-32-6000','Corsair Vengeance DDR5 32GB (16x2) 6000MHz','ram','corsair',3690,4200,null,45,4.9,301,'best',true,
    '["https://assets.corsair.com/image/upload/c_pad,q_85,h_1100,w_1100,f_auto/products/Memory/vengeance-ddr5-blk-config/Gallery/VENGEANCE_DDR5_BLK_01_2up.webp"]'::jsonb,
    '{"Capacity":"32GB (16x2)","Type":"DDR5","Speed":"6000MHz","CL":"CL30"}'::jsonb),
  ('ram-16-5600','Kingston Fury Beast DDR5 16GB 5600MHz','ram','kingston',1790,1990,null,60,4.7,210,null,false,
    '["https://placehold.co/800x800/f4f4f5/cc0000?text=Fury+Beast+16GB"]'::jsonb,
    '{"Capacity":"16GB","Type":"DDR5","Speed":"5600MHz"}'::jsonb),
  -- STORAGE
  ('ssd-nv2-2tb','Kingston NV2 2TB NVMe PCIe 4.0 M.2','storage','kingston',4290,null,null,3,4.6,142,'low',false,
    '["https://placehold.co/800x800/f4f4f5/cc0000?text=Kingston+NV2+2TB"]'::jsonb,
    '{"Capacity":"2TB","Interface":"PCIe 4.0 x4","Read":"3500 MB/s","Write":"2800 MB/s"}'::jsonb),
  ('ssd-990pro-1tb','Samsung 990 Pro 1TB NVMe PCIe 4.0','storage','samsung',3990,4490,null,22,4.9,188,'best',true,
    '["https://placehold.co/800x800/f4f4f5/1428a0?text=990+Pro+1TB"]'::jsonb,
    '{"Capacity":"1TB","Interface":"PCIe 4.0 x4","Read":"7450 MB/s","Write":"6900 MB/s"}'::jsonb),
  ('ssd-sn770-1tb','WD Black SN770 1TB NVMe','storage','wd',2590,2990,null,28,4.7,99,null,false,
    '["https://placehold.co/800x800/f4f4f5/000000?text=WD+Black+SN770"]'::jsonb,
    '{"Capacity":"1TB","Interface":"PCIe 4.0 x4","Read":"5150 MB/s"}'::jsonb),
  -- MONITOR
  ('mon-m27q','Gigabyte M27Q 27" QHD 170Hz IPS','monitor','gigabyte',8990,10500,null,9,4.8,97,'sale',true,
    '["https://placehold.co/800x800/f4f4f5/e87d0d?text=Gigabyte+M27Q"]'::jsonb,
    '{"Size":"27\"","Res":"2560x1440","Refresh":"170Hz","Panel":"IPS"}'::jsonb),
  ('mon-vg27aq','ASUS TUF VG27AQ 27" QHD 165Hz','monitor','asus',9490,null,null,11,4.7,84,null,false,
    '["https://placehold.co/800x800/f4f4f5/000000?text=TUF+VG27AQ"]'::jsonb,
    '{"Size":"27\"","Res":"2560x1440","Refresh":"165Hz","Panel":"IPS"}'::jsonb),
  ('mon-lg27gp850','LG 27GP850 27" QHD 180Hz Nano IPS','monitor','lg',11900,12900,null,6,4.8,63,null,true,
    '["https://placehold.co/800x800/f4f4f5/a50034?text=LG+27GP850"]'::jsonb,
    '{"Size":"27\"","Res":"2560x1440","Refresh":"180Hz","Panel":"Nano IPS"}'::jsonb),
  -- NOTEBOOK
  ('nb-g14','ASUS ROG Zephyrus G14 Ryzen 9 / RTX 4060','notebook','asus',52900,56900,null,5,4.7,64,null,true,
    '["https://placehold.co/800x800/f4f4f5/dc2626?text=ROG+Zephyrus+G14"]'::jsonb,
    '{"CPU":"Ryzen 9 8945HS","GPU":"RTX 4060 8GB","Display":"14\" OLED 120Hz","RAM":"16GB"}'::jsonb),
  ('nb-nitro5','Acer Nitro 5 i7 / RTX 4050','notebook','acer',32900,35900,30900,8,4.5,120,'sale',false,
    '["https://placehold.co/800x800/f4f4f5/83b81a?text=Acer+Nitro+5"]'::jsonb,
    '{"CPU":"Core i7-13620H","GPU":"RTX 4050 6GB","Display":"15.6\" 144Hz"}'::jsonb),
  ('nb-legion5','Lenovo Legion 5 Ryzen 7 / RTX 4060','notebook','lenovo',42900,45900,null,7,4.7,90,null,false,
    '["https://placehold.co/800x800/f4f4f5/e2231a?text=Legion+5"]'::jsonb,
    '{"CPU":"Ryzen 7 7840HS","GPU":"RTX 4060 8GB","Display":"16\" 165Hz"}'::jsonb),
  -- GEAR
  ('kb-gprox','Logitech G Pro X TKL Mechanical','gear','logitech',4990,null,null,30,4.6,188,null,false,
    '["https://placehold.co/800x800/f4f4f5/00b8fc?text=G+Pro+X+TKL"]'::jsonb,
    '{"Layout":"TKL (87)","Switch":"GX Brown","Connect":"Lightspeed / USB-C"}'::jsonb),
  ('mouse-deathadder','Razer DeathAdder V3 Pro Wireless','gear','razer',5290,5990,4990,14,4.8,156,'sale',true,
    '["https://placehold.co/800x800/f4f4f5/44d62c?text=DeathAdder+V3"]'::jsonb,
    '{"Sensor":"Focus Pro 30K","Weight":"63g","Connect":"HyperSpeed Wireless"}'::jsonb)
) as v(slug,name,catslug,brslug,price,old_price,sale_price,stock,rating,reviews,badge,featured,images,specs)
join cat on cat.slug = v.catslug
join br on br.slug = v.brslug
on conflict (slug) do nothing;

-- ---------- SLIDES (carousel + flash sale + brand bar) ----------
insert into public.slides (placement,title,image_url,link,sort,is_active) values
  ('hero','NVIDIA Powers the World''s AI','https://placehold.co/1200x420/111827/dc2626?text=NVIDIA+RTX+%7C+BM+Computer','/products?cat=gpu',1,true),
  ('hero','จัดสเปคคอมในฝัน ครบ จบ ที่เดียว','https://placehold.co/1200x420/dc2626/ffffff?text=Build+Your+Dream+PC','/builder',2,true),
  ('hero','โน้ตบุ๊กเกมมิ่ง ลดสูงสุด 20%','https://placehold.co/1200x420/0b0b0f/dc2626?text=Gaming+Notebook+Sale','/products?cat=notebook',3,true),
  ('promo','ผ่อน 0% นาน 10 เดือน','https://placehold.co/600x300/111827/dc2626?text=0%25+Installment','/',1,true),
  ('promo','ส่งฟรีเมื่อครบ 1,500.-','https://placehold.co/600x300/dc2626/ffffff?text=Free+Shipping','/',2,true),
  ('flashsale','FLASH SALE ทุกวัน 20.00 น.','https://placehold.co/1200x160/7f1d1d/ffffff?text=%E2%9A%A1+FLASH+SALE','/products',1,true)
on conflict do nothing;

-- ---------- SITE SETTINGS ----------
insert into public.site_settings (key,value) values
  ('contact','{"line":"@bmcomputer","phone":"02-000-0000","facebook":"BMComputer"}'::jsonb),
  ('announcement','{"th":"🚚 ส่งฟรีทั่วไทยเมื่อช้อปครบ 1,500 บาท","en":"🚚 Free shipping nationwide over ฿1,500","active":true}'::jsonb)
on conflict (key) do nothing;

-- =====================================================================
-- เสร็จ! ตรวจ: select count(*) from public.products;  (ควรได้ 24)
-- =====================================================================
