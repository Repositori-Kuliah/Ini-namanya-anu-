-- Rollback for 0002_schema_drift_patch.sql
drop function if exists public.get_table(text);
drop function if exists public.place_order(text,int,jsonb,text,text,text);
drop function if exists public.my_orders(text);
drop function if exists public.request_service(text,text);
drop function if exists public.staff_place_order(bigint,int,text,jsonb,text,bool);
drop function if exists public.advance_order(bigint);
drop function if exists public.pay_session(bigint,text,numeric);
drop function if exists public.resolve_requests(bigint);

