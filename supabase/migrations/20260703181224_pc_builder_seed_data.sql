-- =====================================================================
-- PC Builder seed data: เติม attrs สินค้าเดิม + สินค้าใหม่หมวด psu/case/cooler
-- =====================================================================

-- 1) attrs สินค้าเดิม (เครื่องอ่าน - สเปคจริงของรุ่นนั้นๆ)
update public.products set attrs = v.attrs::jsonb
from (values
  ('cpu-7800x3d', '{"socket":"AM5","tdp_w":120,"boxed_cooler":false,"igpu":true,"cpu_score":125}'),
  ('cpu-7600',    '{"socket":"AM5","tdp_w":65,"boxed_cooler":true,"igpu":true,"cpu_score":95}'),
  ('cpu-14600k',  '{"socket":"LGA1700","tdp_w":125,"boxed_cooler":false,"igpu":true,"cpu_score":100}'),
  ('cpu-14700k',  '{"socket":"LGA1700","tdp_w":125,"boxed_cooler":false,"igpu":true,"cpu_score":112}'),
  ('mb-b650',  '{"socket":"AM5","chipset":"B650","mem_type":"DDR5","form_factor":"ATX","ram_slots":4,"ram_max_gb":192,"ram_max_mhz":7200,"m2_slots":3,"sata_ports":6,"pcie_ver":4}'),
  ('mb-b760',  '{"socket":"LGA1700","chipset":"B760","mem_type":"DDR5","form_factor":"ATX","ram_slots":4,"ram_max_gb":128,"ram_max_mhz":7200,"m2_slots":3,"sata_ports":4,"pcie_ver":5}'),
  ('mb-x670',  '{"socket":"AM5","chipset":"X670","mem_type":"DDR5","form_factor":"ATX","ram_slots":4,"ram_max_gb":128,"ram_max_mhz":6600,"m2_slots":4,"sata_ports":4,"pcie_ver":4}'),
  ('ram-32-6000', '{"mem_type":"DDR5","capacity_gb":32,"modules":2,"speed_mhz":6000,"height_mm":35}'),
  ('ram-16-5600', '{"mem_type":"DDR5","capacity_gb":16,"modules":1,"speed_mhz":5600,"height_mm":34}'),
  ('gpu-4070s',  '{"length_mm":301,"power_w":220,"slots":3,"pcie_ver":4,"power_conn":"16pin","rec_psu_w":700,"gpu_score":105}'),
  ('gpu-4060ti', '{"length_mm":235,"power_w":160,"slots":2,"pcie_ver":4,"power_conn":"8pin","rec_psu_w":550,"gpu_score":78}'),
  ('gpu-7800xt', '{"length_mm":302,"power_w":263,"slots":3,"pcie_ver":4,"power_conn":"2x8pin","rec_psu_w":700,"gpu_score":98}'),
  ('gpu-4080s',  '{"length_mm":358,"power_w":320,"slots":3,"pcie_ver":4,"power_conn":"16pin","rec_psu_w":850,"gpu_score":135}'),
  ('ssd-nv2-2tb',    '{"interface":"m2_nvme","capacity_gb":2000,"pcie_ver":4}'),
  ('ssd-990pro-1tb', '{"interface":"m2_nvme","capacity_gb":1000,"pcie_ver":4}'),
  ('ssd-sn770-1tb',  '{"interface":"m2_nvme","capacity_gb":1000,"pcie_ver":4}')
) as v(slug, attrs)
where products.slug = v.slug;

-- 2) สินค้าใหม่: PSU / Case / Cooler (รุ่นจริง ราคาตลาดไทยโดยประมาณ)
insert into public.products (slug,name,category_id,brand_id,price,old_price,stock,rating,reviews_count,images,specs,attrs)
select v.slug, v.name, cat.id, br.id, v.price, v.old_price, v.stock, v.rating, v.reviews,
       v.images::jsonb, v.specs::jsonb, v.attrs::jsonb
from (values
  -- PSU
  ('psu-rm750e','Corsair RM750e 750W 80+ Gold ATX 3.0','psu','corsair',3290,3590,15,4.8,96,
    '["https://placehold.co/800x800/f4f4f5/1d1d1f?text=RM750e"]',
    '{"Wattage":"750W","80 PLUS":"Gold","Modular":"Fully modular","ATX 3.0 / 12VHPWR":"Yes"}',
    '{"wattage_w":750,"psu_form":"ATX","efficiency":"Gold","pcie_16pin":true,"modular":"full"}'),
  ('psu-cx650','Corsair CX650 650W 80+ Bronze','psu','corsair',1890,null,22,4.6,204,
    '["https://placehold.co/800x800/f4f4f5/1d1d1f?text=CX650"]',
    '{"Wattage":"650W","80 PLUS":"Bronze","Modular":"Non-modular"}',
    '{"wattage_w":650,"psu_form":"ATX","efficiency":"Bronze","pcie_16pin":false,"modular":"no"}'),
  ('psu-tuf850g','ASUS TUF Gaming 850W 80+ Gold ATX 3.0','psu','asus',4590,4990,10,4.8,61,
    '["https://placehold.co/800x800/f4f4f5/dc2626?text=TUF+850G"]',
    '{"Wattage":"850W","80 PLUS":"Gold","Modular":"Fully modular","ATX 3.0 / 12VHPWR":"Yes"}',
    '{"wattage_w":850,"psu_form":"ATX","efficiency":"Gold","pcie_16pin":true,"modular":"full"}'),
  ('psu-a550bn','MSI MAG A550BN 550W 80+ Bronze','psu','msi',1390,null,18,4.5,133,
    '["https://placehold.co/800x800/f4f4f5/cc0000?text=A550BN"]',
    '{"Wattage":"550W","80 PLUS":"Bronze","Modular":"Non-modular"}',
    '{"wattage_w":550,"psu_form":"ATX","efficiency":"Bronze","pcie_16pin":false,"modular":"no"}'),
  -- CASE
  ('case-4000d','Corsair 4000D Airflow (ATX)','case','corsair',2990,3290,12,4.9,178,
    '["https://placehold.co/800x800/f4f4f5/1d1d1f?text=4000D+Airflow"]',
    '{"Form":"Mid Tower ATX","Max GPU":"360mm","Max cooler":"170mm","Radiator":"up to 360mm"}',
    '{"mb_support":["ITX","mATX","ATX"],"max_gpu_mm":360,"max_cooler_mm":170,"psu_form":["ATX"],"radiator_support":["120","240","280","360"]}'),
  ('case-forge100m','MSI MAG Forge 100M (ATX)','case','msi',1590,null,20,4.5,142,
    '["https://placehold.co/800x800/f4f4f5/cc0000?text=Forge+100M"]',
    '{"Form":"Mid Tower ATX","Max GPU":"330mm","Max cooler":"160mm","Radiator":"up to 240mm"}',
    '{"mb_support":["ITX","mATX","ATX"],"max_gpu_mm":330,"max_cooler_mm":160,"psu_form":["ATX"],"radiator_support":["120","240"]}'),
  ('case-ap201','ASUS Prime AP201 (mATX)','case','asus',2590,null,8,4.7,88,
    '["https://placehold.co/800x800/f4f4f5/dc2626?text=Prime+AP201"]',
    '{"Form":"MicroATX","Max GPU":"338mm","Max cooler":"170mm","Radiator":"up to 360mm"}',
    '{"mb_support":["ITX","mATX"],"max_gpu_mm":338,"max_cooler_mm":170,"psu_form":["ATX"],"radiator_support":["120","240","280","360"]}'),
  ('case-c200','Gigabyte C200 Glass (ATX)','case','gigabyte',1790,1990,14,4.6,95,
    '["https://placehold.co/800x800/f4f4f5/e87d0d?text=C200+Glass"]',
    '{"Form":"Mid Tower ATX","Max GPU":"384mm","Max cooler":"165mm","Radiator":"up to 360mm"}',
    '{"mb_support":["ITX","mATX","ATX"],"max_gpu_mm":384,"max_cooler_mm":165,"psu_form":["ATX"],"radiator_support":["120","240","360"]}'),
  -- COOLER
  ('cooler-hyper212','Cooler Master Hyper 212 Black Edition','cooler','coolermaster',1090,1290,25,4.7,412,
    '["https://placehold.co/800x800/f4f4f5/5c2d91?text=Hyper+212"]',
    '{"Type":"Air (Tower)","Height":"152mm","Sockets":"AM4/AM5, LGA1700/1851","TDP":"180W"}',
    '{"sockets":["AM4","AM5","LGA1700","LGA1851"],"cooler_type":"air","height_mm":152,"tdp_rating_w":180}'),
  ('cooler-ml240l','Cooler Master MasterLiquid 240L Core ARGB','cooler','coolermaster',2590,2890,12,4.6,167,
    '["https://placehold.co/800x800/f4f4f5/5c2d91?text=ML240L+Core"]',
    '{"Type":"AIO 240mm","Sockets":"AM4/AM5, LGA1700/1851","TDP":"250W"}',
    '{"sockets":["AM4","AM5","LGA1700","LGA1851"],"cooler_type":"aio","radiator_mm":"240","tdp_rating_w":250}'),
  ('cooler-h100i','Corsair iCUE H100i RGB Elite 240mm','cooler','corsair',4290,4590,7,4.8,203,
    '["https://placehold.co/800x800/f4f4f5/1d1d1f?text=H100i+RGB"]',
    '{"Type":"AIO 240mm","Sockets":"AM4/AM5, LGA1700/1851","TDP":"250W"}',
    '{"sockets":["AM4","AM5","LGA1700","LGA1851"],"cooler_type":"aio","radiator_mm":"240","tdp_rating_w":250}'),
  ('cooler-e360','MSI MAG CoreLiquid E360 AIO 360mm','cooler','msi',4990,5490,6,4.7,74,
    '["https://placehold.co/800x800/f4f4f5/cc0000?text=CoreLiquid+E360"]',
    '{"Type":"AIO 360mm","Sockets":"AM4/AM5, LGA1700/1851","TDP":"280W"}',
    '{"sockets":["AM4","AM5","LGA1700","LGA1851"],"cooler_type":"aio","radiator_mm":"360","tdp_rating_w":280}')
) as v(slug,name,cat_slug,brand_slug,price,old_price,stock,rating,reviews,images,specs,attrs)
join public.categories cat on cat.slug = v.cat_slug
join public.brands br on br.slug = v.brand_slug
on conflict (slug) do nothing;
