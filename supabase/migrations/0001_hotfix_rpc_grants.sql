-- =====================================================================
-- 0001_hotfix_rpc_grants.sql
-- Fix P0: NULL-safe app_role() and REVOKE EXECUTE from PUBLIC/anon
-- =====================================================================

-- 1. Helper app_role() yang NULL-safe:
-- Mengembalikan 'none' (bukan NULL) jika auth.uid() bernilai NULL atau akun tidak aktif.
-- Dengan demikian 'none' NOT IN ('admin', 'staff') bernilai TRUE, sehingga blok error dieksekusi.
create or replace function public.app_role() returns text language sql stable security definer set search_path=public as
$$
  select coalesce(
    (select role from public.profiles where id = auth.uid() and is_active = true),
    'none'
  );
$$;

-- 2. Revoke execute dari PUBLIC dan anon pada semua fungsi sensitif
revoke execute on function public.staff_place_order(bigint,int,text,jsonb,text,bool) from public, anon;
revoke execute on function public.advance_order(bigint) from public, anon;
revoke execute on function public.pay_session(bigint,text,numeric) from public, anon;
revoke execute on function public.admin_create_staff(text,text,text,text) from public, anon;
revoke execute on function public.resolve_requests(bigint) from public, anon;

-- 3. Pastikan hanya authenticated yang dapat memanggil fungsi staf
grant execute on function public.staff_place_order(bigint,int,text,jsonb,text,bool) to authenticated;
grant execute on function public.advance_order(bigint) to authenticated;
grant execute on function public.pay_session(bigint,text,numeric) to authenticated;
grant execute on function public.admin_create_staff(text,text,text,text) to authenticated;
grant execute on function public.resolve_requests(bigint) to authenticated;
grant execute on function public.app_role() to authenticated;

-- Fungsi pelanggan tetap dapat diakses anon & authenticated
grant execute on function public.get_table(text) to anon, authenticated;
grant execute on function public.my_orders(text) to anon, authenticated;
grant execute on function public.place_order(text,int,jsonb,text,text) to anon, authenticated;
grant execute on function public.request_service(text,text) to anon, authenticated;
grant execute on function public.bill_total(numeric) to anon, authenticated;

