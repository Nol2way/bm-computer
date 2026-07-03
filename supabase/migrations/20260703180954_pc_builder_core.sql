-- =====================================================================
-- PC Builder core: attribute_defs + products.attrs + builds + หมวดใหม่
-- =====================================================================

-- 1) attribute_defs - นิยามสเปคเครื่องอ่านต่อหมวด (admin จัดการได้ ไม่ hardcode ในโค้ด)
create table if not exists public.attribute_defs (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references public.categories(id) on delete cascade,
  key          text not null,
  label_th     text not null,
  label_en     text not null,
  type         text not null default 'text' check (type in ('text','number','boolean','enum','enum_multi')),
  unit         text,
  options      jsonb,
  required_for_compat boolean not null default false,
  show_in_specs boolean not null default false,
  sort         int default 0,
  created_at   timestamptz default now(),
  unique (category_id, key)
);
alter table public.attribute_defs enable row level security;
drop policy if exists "public read attribute_defs" on public.attribute_defs;
create policy "public read attribute_defs" on public.attribute_defs for select using (true);
drop policy if exists "admin write attribute_defs" on public.attribute_defs;
create policy "admin write attribute_defs" on public.attribute_defs for all using (public.is_admin()) with check (public.is_admin());

-- 2) products.attrs - ค่าสเปคเครื่องอ่าน (typed) แยกจาก specs (ข้อความโชว์หน้าเว็บ)
alter table public.products add column if not exists attrs jsonb not null default '{}'::jsonb;
create index if not exists idx_products_attrs on public.products using gin (attrs);

-- 3) หมวดที่ยังไม่มีในร้าน (จำเป็นต่อการจัดสเปคครบเครื่อง)
insert into public.categories (slug, name_th, name_en, icon, sort) values
  ('psu',    'พาวเวอร์ซัพพลาย',  'Power Supply', 'psu',    9),
  ('case',   'เคส',              'Case',         'case',   10),
  ('cooler', 'ชุดระบายความร้อน', 'CPU Cooler',   'cooler', 11)
on conflict (slug) do nothing;

-- แบรนด์คูลเลอร์ (โลโก้จริงมีใน Simple Icons)
insert into public.brands (slug, name, sort) values ('coolermaster', 'Cooler Master', 15)
on conflict (slug) do nothing;

-- 4) builds - สเปคที่ลูกค้าบันทึก/แชร์
create table if not exists public.builds (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null default 'สเปคของฉัน' check (char_length(name) <= 60),
  share_code text unique not null default encode(gen_random_bytes(8), 'hex'),
  items      jsonb not null default '[]'::jsonb,
  budget     int,
  is_public  boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_builds_user on public.builds(user_id);
drop trigger if exists trg_builds_updated on public.builds;
create trigger trg_builds_updated before update on public.builds
  for each row execute function public.set_updated_at();

alter table public.builds enable row level security;
drop policy if exists "read own or public builds" on public.builds;
create policy "read own or public builds" on public.builds for select using (auth.uid() = user_id or is_public);
drop policy if exists "insert own builds" on public.builds;
create policy "insert own builds" on public.builds for insert with check (auth.uid() = user_id);
drop policy if exists "update own builds" on public.builds;
create policy "update own builds" on public.builds for update using (auth.uid() = user_id);
drop policy if exists "delete own builds" on public.builds;
create policy "delete own builds" on public.builds for delete using (auth.uid() = user_id);

-- 5) seed นิยามแอตทริบิวต์มาตรฐานต่อหมวด (admin แก้/เพิ่มได้ทีหลัง)
with c as (select id, slug from public.categories)
insert into public.attribute_defs (category_id, key, label_th, label_en, type, unit, options, required_for_compat, show_in_specs, sort)
select c.id, d.key, d.label_th, d.label_en, d.type, d.unit::text, d.options::jsonb, d.req, d.show, d.sort
from (values
  -- CPU
  ('cpu','socket','ซ็อกเก็ต','Socket','enum',null,'["AM4","AM5","LGA1700","LGA1851"]',true,true,1),
  ('cpu','tdp_w','TDP','TDP','number','W',null,true,true,2),
  ('cpu','boxed_cooler','มีคูลเลอร์ในกล่อง','Boxed cooler','boolean',null,null,false,true,3),
  ('cpu','igpu','มีการ์ดจอในตัว','Integrated GPU','boolean',null,null,false,true,4),
  ('cpu','cpu_score','คะแนนประสิทธิภาพ (0-200)','Performance score (0-200)','number',null,null,false,false,5),
  -- MAINBOARD
  ('mainboard','socket','ซ็อกเก็ต','Socket','enum',null,'["AM4","AM5","LGA1700","LGA1851"]',true,true,1),
  ('mainboard','chipset','ชิปเซ็ต','Chipset','text',null,null,false,true,2),
  ('mainboard','mem_type','ชนิดแรม','Memory type','enum',null,'["DDR4","DDR5"]',true,true,3),
  ('mainboard','form_factor','ขนาดบอร์ด','Form factor','enum',null,'["ITX","mATX","ATX","E-ATX"]',true,true,4),
  ('mainboard','ram_slots','ช่องแรม','RAM slots','number',null,null,true,true,5),
  ('mainboard','ram_max_gb','แรมสูงสุด','Max RAM','number','GB',null,true,true,6),
  ('mainboard','ram_max_mhz','ความเร็วแรมสูงสุด','Max RAM speed','number','MHz',null,false,true,7),
  ('mainboard','m2_slots','ช่อง M.2','M.2 slots','number',null,null,true,true,8),
  ('mainboard','sata_ports','พอร์ต SATA','SATA ports','number',null,null,true,true,9),
  ('mainboard','pcie_ver','PCIe เวอร์ชัน','PCIe version','number',null,null,false,true,10),
  -- RAM
  ('ram','mem_type','ชนิดแรม','Memory type','enum',null,'["DDR4","DDR5"]',true,true,1),
  ('ram','capacity_gb','ความจุต่อชุด','Capacity per kit','number','GB',null,true,true,2),
  ('ram','modules','จำนวนแถวต่อชุด','Modules per kit','number',null,null,true,true,3),
  ('ram','speed_mhz','ความเร็ว','Speed','number','MHz',null,false,true,4),
  ('ram','height_mm','ความสูงแถวแรม','Module height','number','mm',null,false,false,5),
  -- GPU
  ('gpu','length_mm','ความยาวการ์ด','Card length','number','mm',null,true,true,1),
  ('gpu','power_w','กินไฟ','Power draw','number','W',null,true,true,2),
  ('gpu','slots','ความหนา (ช่องเสียบ)','Slot thickness','number',null,null,false,false,3),
  ('gpu','pcie_ver','PCIe เวอร์ชัน','PCIe version','number',null,null,false,true,4),
  ('gpu','power_conn','หัวจ่ายไฟ','Power connector','enum',null,'["8pin","2x8pin","3x8pin","16pin"]',false,true,5),
  ('gpu','rec_psu_w','PSU แนะนำจากผู้ผลิต','Recommended PSU','number','W',null,false,true,6),
  ('gpu','gpu_score','คะแนนประสิทธิภาพ (0-200)','Performance score (0-200)','number',null,null,false,false,7),
  -- COOLER
  ('cooler','sockets','ซ็อกเก็ตที่รองรับ','Supported sockets','enum_multi',null,'["AM4","AM5","LGA1700","LGA1851"]',true,true,1),
  ('cooler','cooler_type','ชนิด','Type','enum',null,'["air","aio"]',true,true,2),
  ('cooler','height_mm','ความสูง (ลม)','Height (air)','number','mm',null,false,true,3),
  ('cooler','radiator_mm','ขนาดหม้อน้ำ (AIO)','Radiator size (AIO)','enum',null,'["120","240","280","360"]',false,true,4),
  ('cooler','tdp_rating_w','ระบายความร้อนได้','TDP rating','number','W',null,false,true,5),
  -- STORAGE
  ('storage','interface','อินเทอร์เฟซ','Interface','enum',null,'["m2_nvme","sata_ssd","sata_hdd"]',true,true,1),
  ('storage','capacity_gb','ความจุ','Capacity','number','GB',null,false,true,2),
  ('storage','pcie_ver','PCIe เวอร์ชัน','PCIe version','number',null,null,false,true,3),
  -- PSU
  ('psu','wattage_w','กำลังวัตต์','Wattage','number','W',null,true,true,1),
  ('psu','psu_form','ขนาด','Form factor','enum',null,'["ATX","SFX","SFX-L"]',true,true,2),
  ('psu','efficiency','มาตรฐาน 80+','80+ rating','enum',null,'["White","Bronze","Silver","Gold","Platinum","Titanium"]',false,true,3),
  ('psu','pcie_16pin','มีหัว 16pin (12VHPWR)','16pin (12VHPWR)','boolean',null,null,false,true,4),
  ('psu','modular','ถอดสายได้','Modular','enum',null,'["full","semi","no"]',false,true,5),
  -- CASE
  ('case','mb_support','บอร์ดที่รองรับ','Motherboard support','enum_multi',null,'["ITX","mATX","ATX","E-ATX"]',true,true,1),
  ('case','max_gpu_mm','การ์ดจอยาวสุด','Max GPU length','number','mm',null,true,true,2),
  ('case','max_cooler_mm','คูลเลอร์สูงสุด','Max cooler height','number','mm',null,true,true,3),
  ('case','psu_form','PSU ที่รองรับ','PSU support','enum_multi',null,'["ATX","SFX","SFX-L"]',false,true,4),
  ('case','radiator_support','หม้อน้ำที่รองรับ','Radiator support','enum_multi',null,'["120","240","280","360"]',false,true,5)
) as d(cat, key, label_th, label_en, type, unit, options, req, show, sort)
join c on c.slug = d.cat
on conflict (category_id, key) do nothing;
