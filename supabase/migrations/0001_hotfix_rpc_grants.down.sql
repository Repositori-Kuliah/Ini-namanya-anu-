-- Rollback for 0001_hotfix_rpc_grants.sql
create or replace function public.app_role() returns text language sql stable security definer set search_path=public as
$$ select role from public.profiles where id = auth.uid() and is_active $$;

grant execute on function public.staff_place_order(bigint,int,text,jsonb,text,bool) to authenticated;
grant execute on function public.advance_order(bigint) to authenticated;
grant execute on function public.pay_session(bigint,text,numeric) to authenticated;
grant execute on function public.admin_create_staff(text,text,text,text) to authenticated;
grant execute on function public.resolve_requests(bigint) to authenticated;

