-- =====================================================================
-- ช่องโหว่: ยกระดับสิทธิ์ตัวเองเป็นแอดมิน (privilege escalation)
--
-- policy "own profile update" เป็น FOR UPDATE USING (auth.uid() = id) เฉยๆ
-- Postgres จะใช้ USING เป็น WITH CHECK ให้เอง = แถวใหม่ต้องยังเป็นของตัวเอง
-- แต่ "ไม่ได้ห้ามแก้คอลัมน์ role" -> ผู้ใช้ที่ล็อกอินแล้วยิง PostgREST ตรง
--    PATCH /rest/v1/profiles?id=eq.<ตัวเอง>  body {"role":"admin"}
-- ด้วย anon key (เป็น public key) + access token ของตัวเอง ก็กลายเป็นแอดมินได้ทันที
-- (backend API ไม่เปิดช่องนี้ แต่ Supabase REST เข้าถึงได้ตรงจากอินเทอร์เน็ต)
--
-- แก้ด้วย trigger: เปลี่ยน role ได้เฉพาะแอดมินหรือ service_role เท่านั้น
-- (ใช้ trigger แทน column grant เพราะยังต้องให้แอดมินแก้ role คนอื่นได้อยู่)
-- =====================================================================
create or replace function public.prevent_role_escalation()
returns trigger language plpgsql security definer set search_path to 'public'
as $$
begin
  if new.role is distinct from old.role
     and coalesce(auth.role(), '') <> 'service_role'
     and not public.is_admin() then
    raise exception 'ไม่มีสิทธิ์เปลี่ยนระดับผู้ใช้' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists trg_profiles_no_role_escalation on public.profiles;
create trigger trg_profiles_no_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- ฟังก์ชันนี้ไม่ควรถูกเรียกตรงจาก REST
revoke all on function public.prevent_role_escalation() from public, anon, authenticated;
