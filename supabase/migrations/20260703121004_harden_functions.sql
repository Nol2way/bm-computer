-- =====================================================================
-- Security hardening (จาก Supabase security advisor)
-- - ปิดไม่ให้เรียก trigger functions ผ่าน REST RPC (/rest/v1/rpc/...)
--   (trigger ยังทำงานปกติ - permission เช็คกับ owner ตอนสร้าง trigger ไม่ใช่ผู้ยิง DML)
-- - is_admin() คงไว้ เพราะ RLS policy ต้องเรียกในนาม role ผู้ query
-- - ตั้ง search_path ให้ set_updated_at กัน search_path hijack
-- =====================================================================

alter function public.set_updated_at() set search_path = public;

revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.refresh_product_rating() from public, anon, authenticated;
do $$ begin
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'rls_auto_enable') then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
