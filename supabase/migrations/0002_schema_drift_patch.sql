-- =====================================================================
-- 0002_schema_drift_patch.sql
-- Penyelarasan kolom skema riil & instalasi seluruh fungsi RPC
-- =====================================================================

-- 1. Tambah kolom pada tables
alter table public.tables add column if not exists capacity int not null default 4;
alter table public.tables add column if not exists area text not null default 'Ruang utama';

-- 2. Tambah kolom pada table_sessions
alter table public.table_sessions add column if not exists customer_name text;

-- 3. Tambah kolom pada orders (payment_preference & idempotency_key)
alter table public.orders add column if not exists payment_preference text;
alter table public.orders add column if not exists idempotency_key text;
create unique index if not exists orders_idempotency_idx on public.orders(idempotency_key) where idempotency_key is not null;

-- 4. Tambah kolom pada profiles
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists shift text default 'Shift Siang 10.00 - 18.00';
alter table public.profiles add column if not exists terminal text default 'Terminal #01';

-- 5. Buat tabel ingredients jika belum ada
create table if not exists public.ingredients(
  ingredient_id bigint generated always as identity primary key,
  code text unique not null,
  name text not null,
  category text not null default 'Bumbu & Rempah',
  current_stock numeric(12,2) not null default 0 check(current_stock>=0),
  minimum_stock numeric(12,2) not null default 0,
  unit text not null default 'kg',
  cost_per_unit numeric(12,0) not null default 0,
  supplier text,
  last_restocked timestamptz default now(),
  linked_menu_items text[] not null default '{}'
);
alter table public.ingredients enable row level security;

-- Policy ingredients
drop policy if exists rg_ing_read on public.ingredients;
drop policy if exists rg_ing_write on public.ingredients;
create policy rg_ing_read on public.ingredients for select using (public.app_role() in ('admin','staff','kitchen','cashier'));
create policy rg_ing_write on public.ingredients for all using (public.app_role()='admin') with check (public.app_role()='admin');

-- Sequence order number jika belum ada
create sequence if not exists public.order_no_seq;

-- 6. RPC: get_table
create or replace function public.get_table(p_token text)
returns table(table_number int, area text, capacity int)
language sql stable security definer set search_path=public as
$$ select table_number, area, capacity from public.tables where qr_token = p_token and is_active $$;

-- 7. RPC Helper: _insert_items
create or replace function public._insert_items(p_order bigint, p_items jsonb) returns numeric
language plpgsql security definer set search_path=public as $$
declare it jsonb; p products; q int; ex numeric; sub numeric := 0; n text;
begin
  for it in select * from jsonb_array_elements(coalesce(p_items,'[]'::jsonb)) loop
    select * into p from public.products where product_id = (it->>'id')::bigint and is_available;
    q := least(coalesce((it->>'qty')::int,0), 50);
    continue when p.product_id is null or q <= 0;
    select coalesce(sum(price),0) into ex from public.extras
      where is_available and extra_id in (select (jsonb_array_elements_text(coalesce(it->'extras','[]'::jsonb)))::bigint);
    n := nullif(left(coalesce(it->>'note',''),200),'');
    insert into public.order_items(order_id,product_id,product_name,unit_price,quantity,note)
      values(p_order,p.product_id,p.name,p.price+ex,q,n);
    sub := sub + (p.price+ex)*q;
  end loop;
  return sub;
end $$;

-- 8. RPC Helper: _open_session
create or replace function public._open_session(p_table bigint, p_guests int, p_name text) returns bigint
language plpgsql security definer set search_path=public as $$
declare s bigint;
begin
  select session_id into s from public.table_sessions where table_id=p_table and closed_at is null;
  if s is null then
    insert into public.table_sessions(table_id,guest_count,customer_name)
      values(p_table,greatest(1,least(coalesce(p_guests,1),50)),nullif(left(coalesce(p_name,''),60),'')) returning session_id into s;
  elsif p_name is not null and p_name <> '' then
    update public.table_sessions set customer_name = left(p_name,60) where session_id=s and customer_name is null;
  end if;
  return s;
end $$;

-- 9. RPC: place_order (dengan perlindungan idempotency key opsional)
create or replace function public.place_order(p_token text, p_guests int, p_items jsonb, p_note text, p_pay_pref text default 'cashier', p_idempotency_key text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare t tables; s bigint; o orders; sub numeric;
begin
  if p_idempotency_key is not null then
    select * into o from public.orders where idempotency_key = p_idempotency_key;
    if o.order_id is not null then
      return jsonb_build_object('ok',o.order_number,'order_id',o.order_id,'cached',true);
    end if;
  end if;

  select * into t from public.tables where qr_token=p_token and is_active;
  if t.table_id is null then return jsonb_build_object('error','Meja tidak valid'); end if;
  s := public._open_session(t.table_id, p_guests, null);
  insert into public.orders(order_number,session_id,order_source,payment_preference,note,idempotency_key)
    values('A'||lpad(nextval('order_no_seq')::text,4,'0'),s,'qr',
           case when p_pay_pref in('qris','cashier') then p_pay_pref else 'cashier' end,
           nullif(left(coalesce(p_note,''),200),''), p_idempotency_key) returning * into o;
  sub := public._insert_items(o.order_id, p_items);
  if sub <= 0 then delete from public.orders where order_id=o.order_id; return jsonb_build_object('error','Pilih menu dulu'); end if;
  update public.orders set total = public.bill_total(sub) where order_id=o.order_id;
  return jsonb_build_object('ok',o.order_number,'order_id',o.order_id);
end $$;

-- 10. RPC: my_orders
create or replace function public.my_orders(p_token text) returns jsonb
language sql stable security definer set search_path=public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'order_id',o.order_id,'order_number',o.order_number,'status',o.order_status,'total',o.total,
    'note',o.note,'created_at',o.created_at,'pay_pref',o.payment_preference,'guests',s.guest_count,
    'paid', exists(select 1 from public.payments p where p.order_id=o.order_id and p.status='paid'),
    'items',(select coalesce(jsonb_agg(jsonb_build_object('name',i.product_name,'qty',i.quantity,'price',i.unit_price,'note',i.note) order by i.order_item_id),'[]'::jsonb) from public.order_items i where i.order_id=o.order_id)
  ) order by o.created_at), '[]'::jsonb)
  from public.tables t join public.table_sessions s on s.table_id=t.table_id and s.closed_at is null
  join public.orders o on o.session_id=s.session_id and o.order_status<>'draft'
  where t.qr_token=p_token
$$;

-- 11. RPC: request_service (dengan perlindungan sesi aktif dan cooldown)
create or replace function public.request_service(p_token text, p_kind text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare t tables; s bigint; recent_exists bool;
begin
  if p_kind not in('waiter','checkout') then return jsonb_build_object('error','Jenis tidak valid'); end if;
  select * into t from public.tables where qr_token=p_token and is_active;
  if t.table_id is null then return jsonb_build_object('error','Meja tidak valid'); end if;
  
  -- Pastikan ada sesi aktif di meja
  select session_id into s from public.table_sessions where table_id=t.table_id and closed_at is null;
  if s is null then return jsonb_build_object('error','Tidak ada sesi aktif di meja ini'); end if;

  -- Cek apakah sudah ada request pending serupa
  if exists(select 1 from public.service_requests where table_id=t.table_id and kind=p_kind and status='pending') then
    return jsonb_build_object('ok',true,'message','Permintaan sudah tercatat');
  end if;

  -- Cooldown backend 60 detik
  select exists(
    select 1 from public.service_requests
    where table_id=t.table_id and kind=p_kind and created_at > now() - interval '60 seconds'
  ) into recent_exists;
  if recent_exists then
    return jsonb_build_object('error','Harap tunggu 60 detik sebelum mengirim permintaan kembali');
  end if;

  insert into public.service_requests(table_id,kind) values(t.table_id,p_kind);
  return jsonb_build_object('ok',true);
end $$;

-- 12. RPC Staf: staff_place_order
create or replace function public.staff_place_order(p_table_id bigint, p_guests int, p_customer text, p_items jsonb, p_note text, p_draft bool default false)
returns jsonb language plpgsql security definer set search_path=public as $$
declare s bigint; o orders; sub numeric;
begin
  if public.app_role() not in('admin','staff','cashier') then return jsonb_build_object('error','Tidak punya akses'); end if;
  if not exists(select 1 from public.tables where table_id=p_table_id and is_active) then return jsonb_build_object('error','Meja tidak valid'); end if;
  s := public._open_session(p_table_id, p_guests, p_customer);
  update public.table_sessions set guest_count=greatest(1,least(coalesce(p_guests,1),50)), customer_name=coalesce(nullif(p_customer,''),customer_name) where session_id=s;
  delete from public.orders where session_id=s and order_status='draft';
  insert into public.orders(order_number,session_id,order_source,created_by,order_status,note)
    values((case when p_draft then 'D' else 'A' end)||lpad(nextval('order_no_seq')::text,4,'0'),s,'staff',auth.uid(),
           case when p_draft then 'draft' else 'submitted' end, nullif(left(coalesce(p_note,''),200),'')) returning * into o;
  sub := public._insert_items(o.order_id, p_items);
  if sub <= 0 then delete from public.orders where order_id=o.order_id; return jsonb_build_object('error','Pilih menu dulu'); end if;
  update public.orders set total = public.bill_total(sub) where order_id=o.order_id;
  return jsonb_build_object('ok',o.order_number,'order_id',o.order_id);
end $$;

-- 13. RPC Staf: advance_order (dengan FOR UPDATE untuk concurrency safety)
create or replace function public.advance_order(p_order bigint) returns jsonb
language plpgsql security definer set search_path=public as $$
declare o orders; nxt text;
begin
  if public.app_role() not in('admin','staff','kitchen','cashier') then return jsonb_build_object('error','Tidak punya akses'); end if;
  select * into o from public.orders where order_id=p_order for update;
  if o.order_id is null then return jsonb_build_object('error','Pesanan tidak ditemukan'); end if;
  nxt := case o.order_status when 'draft' then 'submitted' when 'submitted' then 'preparing' when 'preparing' then 'ready' when 'ready' then 'served' end;
  if nxt is null then return jsonb_build_object('error','Status tidak bisa dimajukan'); end if;
  update public.orders set order_status=nxt, updated_at=now(),
    ready_at = case when nxt='ready' then now() else ready_at end,
    served_at = case when nxt='served' then now() else served_at end
  where order_id=p_order;
  return jsonb_build_object('ok',nxt);
end $$;

-- 14. RPC Staf: pay_session (dengan session lock dan atomic payment)
create or replace function public.pay_session(p_session bigint, p_method text, p_received numeric default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare o record; s table_sessions; total numeric := 0; recv numeric; first_pay bool := true; codes text[] := '{}';
begin
  if public.app_role() not in('admin','staff','cashier') then return jsonb_build_object('error','Tidak punya akses'); end if;
  if p_method not in('cash','qris','debit') then return jsonb_build_object('error','Metode tidak valid'); end if;
  
  -- Kunci row sesi meja untuk mencegah race condition / double payment
  select * into s from public.table_sessions where session_id=p_session for update;
  if s.session_id is null then return jsonb_build_object('error','Sesi tidak ditemukan'); end if;
  if s.closed_at is not null then return jsonb_build_object('error','Sesi ini sudah ditutup dan lunas'); end if;

  if exists(select 1 from public.orders where session_id=p_session and order_status in('submitted','preparing','ready')) then
    return jsonb_build_object('error','Masih ada pesanan yang belum disajikan'); end if;
  select coalesce(sum(public.bill_total((select sum(subtotal) from public.order_items where order_id=o2.order_id))),0) into total
    from public.orders o2 where o2.session_id=p_session and o2.order_status='served'
    and not exists(select 1 from public.payments p where p.order_id=o2.order_id and p.status='paid');
  if total <= 0 then return jsonb_build_object('error','Tidak ada tagihan tertunggak'); end if;
  recv := case when p_method='cash' then coalesce(p_received,0) else total end;
  if recv < total then return jsonb_build_object('error','Uang diterima kurang dari total'); end if;
  for o in select o2.order_id, o2.order_number, public.bill_total((select sum(subtotal) from public.order_items where order_id=o2.order_id)) amt
           from public.orders o2 where o2.session_id=p_session and o2.order_status='served'
           and not exists(select 1 from public.payments p where p.order_id=o2.order_id and p.status='paid') order by o2.order_id loop
    insert into public.payments(transaction_code,order_id,confirmed_by,method,amount,cash_received,change_amount,status,paid_at)
      values('T'||(extract(epoch from clock_timestamp())*1000)::bigint||o.order_id,o.order_id,auth.uid(),p_method,o.amt,
             case when first_pay then recv end, case when first_pay then recv-total end,'paid',now());
    first_pay := false;
    codes := codes || o.order_number;
  end loop;
  update public.table_sessions set closed_at=now() where session_id=p_session;
  update public.service_requests set status='done', resolved_at=now()
    where status='pending' and table_id=s.table_id;
  return jsonb_build_object('ok',true,'total',total,'change',recv-total,'orders',codes);
end $$;

-- 15. RPC Staf: resolve_requests
create or replace function public.resolve_requests(p_table bigint) returns void
language sql security definer set search_path=public as $$
  update public.service_requests set status='done', resolved_at=now()
  where table_id=p_table and status='pending' and public.app_role() in('admin','staff','cashier')
$$;

-- 16. Hak Eksekusi
revoke execute on function public._insert_items(bigint,jsonb), public._open_session(bigint,int,text) from public, anon, authenticated;
grant execute on function public.get_table(text), public.place_order(text,int,jsonb,text,text,text), public.my_orders(text), public.request_service(text,text) to anon, authenticated;
grant execute on function public.staff_place_order(bigint,int,text,jsonb,text,bool), public.advance_order(bigint), public.pay_session(bigint,text,numeric),
  public.resolve_requests(bigint), public.app_role(), public.bill_total(numeric) to authenticated;
grant execute on function public.bill_total(numeric) to anon;

