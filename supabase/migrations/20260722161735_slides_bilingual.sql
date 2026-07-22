-- =====================================================================
-- แบนเนอร์ต้องมี 2 ภาษาเหมือนส่วนอื่นของเว็บ
-- เดิมสไลด์เก็บข้อความภาษาเดียว -> สลับ UI เป็นอังกฤษแล้วแบนเนอร์ยังเป็นไทย
-- (categories มี name_th/name_en อยู่แล้ว ทำให้ slides สอดคล้องกัน)
-- คอลัมน์เดิม (title/subtitle/...) = ภาษาไทย · *_en = อังกฤษ เว้นว่าง = ใช้ไทยแทน
-- =====================================================================
alter table public.slides
  add column if not exists title_en     text,
  add column if not exists subtitle_en  text,
  add column if not exists cta_label_en text,
  add column if not exists badge_en     text;

comment on column public.slides.title_en is 'ข้อความภาษาอังกฤษ เว้นว่าง = ใช้ข้อความไทยแทน';

update public.slides set
  title_en = 'Graphics cards for every build',
  subtitle_en = 'Latest-generation GPUs with specs to match any budget',
  badge_en = 'New arrivals', cta_label_en = 'Shop graphics cards',
  title = 'การ์ดจอครบทุกระดับงบ'
 where placement = 'hero' and sort = 1;

update public.slides set
  title_en = 'Build your dream PC, all in one place',
  subtitle_en = 'Automatic compatibility checks for socket, RAM, GPU clearance and wattage',
  badge_en = 'Free to use', cta_label_en = 'Start building'
 where placement = 'hero' and sort = 2;

update public.slides set
  title_en = 'Gaming notebooks, up to 20% off',
  subtitle_en = 'Gaming and creator laptops, shipped nationwide',
  badge_en = 'On sale', cta_label_en = 'Shop notebooks'
 where placement = 'hero' and sort = 3;

update public.slides set
  title_en = 'Free shipping over ฿1,500',
  subtitle_en = 'Below that, flat ฿80 nationwide',
  cta_label_en = 'Shop now'
 where placement = 'promo' and sort = 1;

update public.slides set
  title_en = 'Online PC builder',
  subtitle_en = '19 compatibility rules checked, with power draw calculated for you',
  cta_label_en = 'Start building'
 where placement = 'promo' and sort = 2;

update public.slides set
  title_en = 'Online warranty claims',
  subtitle_en = 'Submit with photos and track the status from your account',
  cta_label_en = 'See claimable items'
 where placement = 'promo' and sort = 3;
