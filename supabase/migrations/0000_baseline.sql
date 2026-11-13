-- =====================================================================
-- Rawon Gusti POS - skema Supabase (prototype/testing)
-- Urutan jalan: 1) schema.sql  2) seed.sql  3) seed_demo.sql (opsional)
-- Aman dijalankan ulang: pakai "if not exists" / "create or replace".
-- =====================================================================
create extension if not exists pgcrypto;

-- ---------- TABEL ----------
create table if not exists profiles(
  id uuid primary key references auth.users on delete cascade,
  role text not null default 'staff' check(role in('admin','staff','kitchen','customer')),
  full_name text not null,
  email text,
  shift text default 'Shift Siang 10.00 - 18.00',
  terminal text default 'Terminal #01',
  is_active bool not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists tables(
  table_id bigint generated always as identity primary key,
  table_number int unique not null,
  qr_token text unique not null default encode(gen_random_bytes(8),'hex'),
  capacity int not null default 4,
  area text not null default 'Ruang utama',
  is_active bool not null default true,
  created_at timestamptz default now()
);

create table if not exists table_sessions(
  session_id bigint generated always as identity primary key,
  table_id bigint not null references tables,
  guest_count int not null default 1,
  customer_name text,
  opened_at timestamptz default now(),
  closed_at timestamptz
);
create unique index if not exists one_open_session_per_table on table_sessions(table_id) where closed_at is null;

create table if not exists categories(
  category_id bigint generated always as identity primary key,
  name text unique not null,
  created_at timestamptz default now()
);

create table if not exists products(
  product_id bigint generated always as identity primary key,
  category_id bigint not null references categories,
  product_code text unique not null,
  name text not null,
  price numeric(12,0) not null check(price>=0),
  description text,
  image_url text,
  is_favorite bool not null default false,
  is_signature bool not null default false,
  is_available bool not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tambahan opsional pelanggan (kerupuk, sambal, dst). Harga dihitung server.
create table if not exists extras(
  extra_id bigint generated always as identity primary key,
  name text unique not null,
  description text,
  price numeric(12,0) not null check(price>=0),
  is_available bool not null default true
);

create table if not exists orders(
  order_id bigint generated always as identity primary key,
  order_number text unique not null,
  session_id bigint not null references table_sessions,
  created_by uuid references profiles,
  order_source text not null default 'qr' check(order_source in('qr','staff')),
  order_status text not null default 'submitted' check(order_status in('draft','submitted','preparing','ready','served')),
  payment_preference text check(payment_preference in('qris','cashier')),
  note text,
  total numeric(12,0) not null default 0,
  ready_at timestamptz,
  served_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists order_items(
  order_item_id bigint generated always as identity primary key,
  order_id bigint not null references orders on delete cascade,
  product_id bigint not null references products,
  product_name text not null,
  unit_price numeric(12,0) not null,
  quantity int not null check(quantity>0),
  subtotal numeric(12,0) generated always as (unit_price*quantity) stored,
  note text
);

create table if not exists payments(
  payment_id bigint generated always as identity primary key,
  transaction_code text unique,
  order_id bigint not null references orders,
  confirmed_by uuid references profiles,
  method text not null check(method in('cash','qris','debit')),
  amount numeric(12,0) not null,
  cash_received numeric(12,0),
  change_amount numeric(12,0),
  status text not null default 'pending' check(status in('pending','paid')),
  created_at timestamptz default now(),
  paid_at timestamptz
);

-- Panggil pelayan / minta tagihan dari meja pelanggan
create table if not exists service_requests(
  request_id bigint generated always as identity primary key,
  table_id bigint not null references tables,
  kind text not null check(kind in('waiter','checkout')),
  status text not null default 'pending' check(status in('pending','done')),
  created_at timestamptz default now(),
  resolved_at timestamptz
);

-- Stok bahan baku
create table if not exists ingredients(
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

create index if not exists orders_session_idx on orders(session_id);
create index if not exists order_items_order_idx on order_items(order_id);
create index if not exists payments_paid_at_idx on payments(paid_at);
create sequence if not exists order_no_seq;

-- ---------- HELPER ----------
create or replace function app_role() returns text language sql stable security definer set search_path=public as
$$ select role from profiles where id = auth.uid() and is_active $$;

-- Aturan tagihan (sama dengan lib/domain.ts): layanan 5%, PB1 10% dari (subtotal+layanan)
create or replace function bill_total(sub numeric) returns numeric language sql immutable as
$$ select sub + round(sub*0.05) + round((sub + round(sub*0.05))*0.1) $$;

-- ---------- RLS ----------
alter table profiles enable row level security;
alter table tables enable row level security;
alter table table_sessions enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table extras enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table service_requests enable row level security;
alter table ingredients enable row level security;

do $$ declare r record; begin
  for r in select policyname, tablename from pg_policies where schemaname='public' and policyname like 'rg\_%' loop
    execute format('drop policy %I on %I', r.policyname, r.tablename);
  end loop;
end $$;

-- Menu: publik boleh baca (untuk pelanggan QR); tulis hanya admin
create policy rg_cat_read on categories for select using (true);
create policy rg_cat_write on categories for all using (app_role()='admin') with check (app_role()='admin');
create policy rg_prod_read on products for select using (true);
create policy rg_prod_write on products for all using (app_role()='admin') with check (app_role()='admin');
create policy rg_extra_read on extras for select using (true);
create policy rg_extra_write on extras for all using (app_role()='admin') with check (app_role()='admin');

-- Data operasional: hanya staf login. Pelanggan lewat RPC di bawah.
create policy rg_tables_read on tables for select using (app_role() in ('admin','staff','kitchen'));
create policy rg_tables_write on tables for all using (app_role()='admin') with check (app_role()='admin');
create policy rg_sessions_read on table_sessions for select using (app_role() in ('admin','staff','kitchen'));
create policy rg_orders_read on orders for select using (app_role() in ('admin','staff','kitchen'));
create policy rg_items_read on order_items for select using (app_role() in ('admin','staff','kitchen'));
create policy rg_pay_read on payments for select using (app_role() in ('admin','staff'));
create policy rg_req_read on service_requests for select using (app_role() in ('admin','staff','kitchen'));
create policy rg_ing_read on ingredients for select using (app_role() in ('admin','staff','kitchen'));
create policy rg_ing_write on ingredients for all using (app_role()='admin') with check (app_role()='admin');
create policy rg_prof_self on profiles for select using (id = auth.uid() or app_role()='admin');
create policy rg_prof_admin on profiles for update using (app_role()='admin') with check (app_role()='admin');

-- ---------- RPC PELANGGAN (anon, tanpa akun; meja dikenali dari qr_token) ----------
create or replace function get_table(p_token text)
returns table(table_number int, area text, capacity int)
language sql stable security definer set search_path=public as
$$ select table_number, area, capacity from tables where qr_token = p_token and is_active $$;

-- Hitung item dari JSON [{id, qty, note, extras:[extra_id,..]}]; harga SELALU dari DB.
create or replace function _insert_items(p_order bigint, p_items jsonb) returns numeric
language plpgsql security definer set search_path=public as $$
declare it jsonb; p products; q int; ex numeric; sub numeric := 0; n text;
begin
  for it in select * from jsonb_array_elements(coalesce(p_items,'[]'::jsonb)) loop
    select * into p from products where product_id = (it->>'id')::bigint and is_available;
    q := least(coalesce((it->>'qty')::int,0), 50);
    continue when p.product_id is null or q <= 0;
    select coalesce(sum(price),0) into ex from extras
      where is_available and extra_id in (select (jsonb_array_elements_text(coalesce(it->'extras','[]'::jsonb)))::bigint);
    n := nullif(left(coalesce(it->>'note',''),200),'');
    insert into order_items(order_id,product_id,product_name,unit_price,quantity,note)
      values(p_order,p.product_id,p.name,p.price+ex,q,n);
    sub := sub + (p.price+ex)*q;
  end loop;
  return sub;
end $$;

create or replace function _open_session(p_table bigint, p_guests int, p_name text) returns bigint
language plpgsql security definer set search_path=public as $$
declare s bigint;
begin
  select session_id into s from table_sessions where table_id=p_table and closed_at is null;
  if s is null then
    insert into table_sessions(table_id,guest_count,customer_name)
      values(p_table,greatest(1,least(coalesce(p_guests,1),50)),nullif(left(coalesce(p_name,''),60),'')) returning session_id into s;
  elsif p_name is not null and p_name <> '' then
    update table_sessions set customer_name = left(p_name,60) where session_id=s and customer_name is null;
  end if;
  return s;
end $$;

create or replace function place_order(p_token text, p_guests int, p_items jsonb, p_note text, p_pay_pref text default 'cashier')
returns jsonb language plpgsql security definer set search_path=public as $$
declare t tables; s bigint; o orders; sub numeric;
begin
  select * into t from tables where qr_token=p_token and is_active;
  if t.table_id is null then return jsonb_build_object('error','Meja tidak valid'); end if;
  s := _open_session(t.table_id, p_guests, null);
  insert into orders(order_number,session_id,order_source,payment_preference,note)
    values('A'||lpad(nextval('order_no_seq')::text,4,'0'),s,'qr',
           case when p_pay_pref in('qris','cashier') then p_pay_pref else 'cashier' end,
           nullif(left(coalesce(p_note,''),200),'')) returning * into o;
  sub := _insert_items(o.order_id, p_items);
  if sub <= 0 then delete from orders where order_id=o.order_id; return jsonb_build_object('error','Pilih menu dulu'); end if;
  update orders set total = bill_total(sub) where order_id=o.order_id;
  return jsonb_build_object('ok',o.order_number,'order_id',o.order_id);
end $$;

-- Status pesanan di sesi meja yang sedang terbuka
create or replace function my_orders(p_token text) returns jsonb
language sql stable security definer set search_path=public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'order_id',o.order_id,'order_number',o.order_number,'status',o.order_status,'total',o.total,
    'note',o.note,'created_at',o.created_at,'pay_pref',o.payment_preference,'guests',s.guest_count,
    'paid', exists(select 1 from payments p where p.order_id=o.order_id and p.status='paid'),
    'items',(select coalesce(jsonb_agg(jsonb_build_object('name',i.product_name,'qty',i.quantity,'price',i.unit_price,'note',i.note) order by i.order_item_id),'[]'::jsonb) from order_items i where i.order_id=o.order_id)
  ) order by o.created_at), '[]'::jsonb)
  from tables t join table_sessions s on s.table_id=t.table_id and s.closed_at is null
  join orders o on o.session_id=s.session_id and o.order_status<>'draft'
  where t.qr_token=p_token
$$;

create or replace function request_service(p_token text, p_kind text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare t tables;
begin
  if p_kind not in('waiter','checkout') then return jsonb_build_object('error','Jenis tidak valid'); end if;
  select * into t from tables where qr_token=p_token and is_active;
  if t.table_id is null then return jsonb_build_object('error','Meja tidak valid'); end if;
  if not exists(select 1 from service_requests where table_id=t.table_id and kind=p_kind and status='pending') then
    insert into service_requests(table_id,kind) values(t.table_id,p_kind);
  end if;
  return jsonb_build_object('ok',true);
end $$;

-- ---------- RPC STAF ----------
create or replace function staff_place_order(p_table_id bigint, p_guests int, p_customer text, p_items jsonb, p_note text, p_draft bool default false)
returns jsonb language plpgsql security definer set search_path=public as $$
declare s bigint; o orders; sub numeric;
begin
  if app_role() not in('admin','staff') then return jsonb_build_object('error','Tidak punya akses'); end if;
  if not exists(select 1 from tables where table_id=p_table_id and is_active) then return jsonb_build_object('error','Meja tidak valid'); end if;
  s := _open_session(p_table_id, p_guests, p_customer);
  update table_sessions set guest_count=greatest(1,least(coalesce(p_guests,1),50)), customer_name=coalesce(nullif(p_customer,''),customer_name) where session_id=s;
  delete from orders where session_id=s and order_status='draft';  -- draf lama diganti
  insert into orders(order_number,session_id,order_source,created_by,order_status,note)
    values((case when p_draft then 'D' else 'A' end)||lpad(nextval('order_no_seq')::text,4,'0'),s,'staff',auth.uid(),
           case when p_draft then 'draft' else 'submitted' end, nullif(left(coalesce(p_note,''),200),'')) returning * into o;
  sub := _insert_items(o.order_id, p_items);
  if sub <= 0 then delete from orders where order_id=o.order_id; return jsonb_build_object('error','Pilih menu dulu'); end if;
  update orders set total = bill_total(sub) where order_id=o.order_id;
  return jsonb_build_object('ok',o.order_number,'order_id',o.order_id);
end $$;

create or replace function advance_order(p_order bigint) returns jsonb
language plpgsql security definer set search_path=public as $$
declare o orders; nxt text;
begin
  if app_role() not in('admin','staff','kitchen') then return jsonb_build_object('error','Tidak punya akses'); end if;
  select * into o from orders where order_id=p_order;
  nxt := case o.order_status when 'draft' then 'submitted' when 'submitted' then 'preparing' when 'preparing' then 'ready' when 'ready' then 'served' end;
  if nxt is null then return jsonb_build_object('error','Status tidak bisa dimajukan'); end if;
  update orders set order_status=nxt, updated_at=now(),
    ready_at = case when nxt='ready' then now() else ready_at end,
    served_at = case when nxt='served' then now() else served_at end
  where order_id=p_order;
  return jsonb_build_object('ok',nxt);
end $$;

-- Bayar seluruh pesanan di satu sesi meja (harus sudah disajikan semua). Satu baris payments per pesanan.
create or replace function pay_session(p_session bigint, p_method text, p_received numeric default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare o record; total numeric := 0; recv numeric; first_pay bool := true; codes text[] := '{}';
begin
  if app_role() not in('admin','staff') then return jsonb_build_object('error','Tidak punya akses'); end if;
  if p_method not in('cash','qris','debit') then return jsonb_build_object('error','Metode tidak valid'); end if;
  if exists(select 1 from orders where session_id=p_session and order_status in('submitted','preparing','ready')) then
    return jsonb_build_object('error','Masih ada pesanan yang belum disajikan'); end if;
  select coalesce(sum(bill_total((select sum(subtotal) from order_items where order_id=o2.order_id))),0) into total
    from orders o2 where o2.session_id=p_session and o2.order_status='served'
    and not exists(select 1 from payments p where p.order_id=o2.order_id and p.status='paid');
  if total <= 0 then return jsonb_build_object('error','Tidak ada tagihan'); end if;
  recv := case when p_method='cash' then coalesce(p_received,0) else total end;
  if recv < total then return jsonb_build_object('error','Uang diterima kurang dari total'); end if;
  for o in select o2.order_id, o2.order_number, bill_total((select sum(subtotal) from order_items where order_id=o2.order_id)) amt
           from orders o2 where o2.session_id=p_session and o2.order_status='served'
           and not exists(select 1 from payments p where p.order_id=o2.order_id and p.status='paid') order by o2.order_id loop
    insert into payments(transaction_code,order_id,confirmed_by,method,amount,cash_received,change_amount,status,paid_at)
      values('T'||(extract(epoch from clock_timestamp())*1000)::bigint||o.order_id,o.order_id,auth.uid(),p_method,o.amt,
             case when first_pay then recv end, case when first_pay then recv-total end,'paid',now());
    first_pay := false;
    codes := codes || o.order_number;
  end loop;
  update table_sessions set closed_at=now() where session_id=p_session;
  update service_requests set status='done', resolved_at=now()
    where status='pending' and table_id=(select table_id from table_sessions where session_id=p_session);
  return jsonb_build_object('ok',true,'total',total,'change',recv-total,'orders',codes);
end $$;

create or replace function resolve_requests(p_table bigint) returns void
language sql security definer set search_path=public as $$
  update service_requests set status='done', resolved_at=now() where table_id=p_table and status='pending' and app_role() in('admin','staff')
$$;

-- ---------- RPC ADMIN ----------
-- Pembuat user internal (tanpa cek role; hanya dipakai wrapper + seed_demo)
create or replace function _create_user(p_email text, p_password text, p_name text, p_role text)
returns uuid language plpgsql security definer set search_path=public, auth, extensions as $$
declare uid uuid; begin
  select id into uid from auth.users where email = lower(p_email);
  if uid is null then
    uid := gen_random_uuid();
    insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,
      created_at,updated_at,confirmation_token,recovery_token,email_change,email_change_token_new)
    values('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated',lower(p_email),crypt(p_password,gen_salt('bf')),now(),
      '{"provider":"email","providers":["email"]}','{}',now(),now(),'','','','');
    insert into auth.identities(id,user_id,provider_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    values(gen_random_uuid(),uid,uid::text,jsonb_build_object('sub',uid::text,'email',lower(p_email)),'email',now(),now(),now());
  end if;
  insert into profiles(id,role,full_name,email) values(uid,p_role,p_name,lower(p_email))
    on conflict(id) do update set role=excluded.role, full_name=excluded.full_name, email=excluded.email;
  return uid;
end $$;
revoke all on function _create_user(text,text,text,text) from public, anon, authenticated;

create or replace function admin_create_staff(p_email text, p_password text, p_name text, p_role text)
returns jsonb language plpgsql security definer set search_path=public as $$
begin
  if app_role() <> 'admin' then return jsonb_build_object('error','Hanya admin'); end if;
  if p_role not in('admin','staff','kitchen') then return jsonb_build_object('error','Role tidak valid'); end if;
  if length(coalesce(p_password,'')) < 6 then return jsonb_build_object('error','Kata sandi minimal 6 karakter'); end if;
  return jsonb_build_object('ok',_create_user(p_email,p_password,p_name,p_role));
end $$;

-- ---------- HAK EKSEKUSI ----------
revoke execute on function _insert_items(bigint,jsonb), _open_session(bigint,int,text) from public, anon, authenticated;
grant execute on function get_table(text), place_order(text,int,jsonb,text,text), my_orders(text), request_service(text,text) to anon, authenticated;
grant execute on function staff_place_order(bigint,int,text,jsonb,text,bool), advance_order(bigint), pay_session(bigint,text,numeric),
  resolve_requests(bigint), admin_create_staff(text,text,text,text), app_role(), bill_total(numeric) to authenticated;
grant execute on function bill_total(numeric) to anon;

-- ---------- REALTIME ----------
do $$ declare t text; begin
  foreach t in array array['orders','order_items','payments','table_sessions','service_requests','products','tables','ingredients'] loop
    begin execute format('alter publication supabase_realtime add table %I', t);
    exception when duplicate_object then null; when undefined_object then null; end;
  end loop;
end $$;
