-- =====================================================================
-- แบนเนอร์หน้าแรกแบบร้านค้าจริง: ล้างสไลด์ซ้ำ + กันซ้ำถาวร + เพิ่มฟิลด์ที่แบนเนอร์ต้องใช้
-- (TODO เดิมใน CLAUDE.md: "ตาราง slides ยังไม่มี unique key (กัน seed ซ้ำ)")
-- อาการเดิม: seed ถูกรันสองรอบ -> hero มี 3 สไลด์แต่วนโชว์ 6 (ซ้ำอันละ 2 ครั้ง)
-- =====================================================================

-- ---------- 1) ลบสไลด์ซ้ำ เก็บอันที่สร้างก่อนไว้ ----------
delete from public.slides s
 where exists (
   select 1 from public.slides k
    where k.placement = s.placement
      and k.title is not distinct from s.title
      and k.sort is not distinct from s.sort
      and (k.created_at, k.id) < (s.created_at, s.id)
 );

-- ---------- 2) กันซ้ำถาวร ----------
create unique index if not exists uq_slides_placement_sort on public.slides(placement, sort);

-- ---------- 3) ฟิลด์สำหรับแบนเนอร์แบบข้อความ (ไม่มีรูปก็สวยและคมทุกจอ) ----------
alter table public.slides
  add column if not exists subtitle   text,
  add column if not exists cta_label  text,
  add column if not exists badge      text,
  add column if not exists theme      text not null default 'brand'
    check (theme in ('brand', 'dark', 'amber', 'emerald', 'violet'));

comment on column public.slides.badge     is 'ป้ายมุมบน เช่น ลดสูงสุด 20%';
comment on column public.slides.cta_label is 'ข้อความบนปุ่ม ถ้าเว้นว่างจะไม่แสดงปุ่ม';
comment on column public.slides.theme     is 'ชุดสีของแบนเนอร์แบบข้อความ (ใช้เมื่อไม่ใส่รูป)';
