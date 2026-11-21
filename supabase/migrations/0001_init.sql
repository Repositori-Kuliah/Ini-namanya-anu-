-- =====================================================================
-- 0001_init.sql
-- RAWON GUSTI POS & SELF-ORDERING SYSTEM - MASTER DATABASE INITIALIZATION
-- =====================================================================
-- File master tunggal yang menyatukan seluruh skema, constraint peran (admin, owner, cashier, kitchen),
-- pengaturan outlet cloud, RPC, serta data awal (seed).
-- Aman dijalankan di database baru maupun database yang sudah berjalan.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- 1. TABEL UTAMA & STRUKTUR DATA
-- ---------------------------------------------------------------------

-- Tabel Profiles (Akun Staf & Hak Akses)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL DEFAULT 'cashier' CHECK (role IN ('admin', 'owner', 'staff', 'cashier', 'kitchen', 'customer')),
  full_name text NOT NULL,
  email text,
  shift text DEFAULT 'Shift Pagi 08:00 - 16:00',
  terminal text DEFAULT 'Kasir Utama #01',
  is_active bool NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Pastikan batasan constraint peran pada profiles selalu mutakhir
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('admin', 'owner', 'staff', 'cashier', 'kitchen', 'customer'));
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Tabel Tables (Meja Restoran & Kode QR)
CREATE TABLE IF NOT EXISTS public.tables (
  table_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  table_number int UNIQUE NOT NULL,
  qr_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
  capacity int NOT NULL DEFAULT 4,
  area text NOT NULL DEFAULT 'Ruang Utama',
  is_active bool NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Tabel Table Sessions (Sesi Kunjungan Meja Aktif / Takeaway)
CREATE TABLE IF NOT EXISTS public.table_sessions (
  session_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  table_id bigint NOT NULL REFERENCES public.tables(table_id),
  guest_count int NOT NULL DEFAULT 1,
  customer_name text,
  is_takeaway bool NOT NULL DEFAULT false,
  takeaway_queue text,
  opened_at timestamptz DEFAULT now(),
  closed_at timestamptz
);

-- Tabel Categories (Kategori Menu)
CREATE TABLE IF NOT EXISTS public.categories (
  category_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text UNIQUE NOT NULL,
  menu_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Tabel Products (Katalog Menu Makanan & Minuman)
CREATE TABLE IF NOT EXISTS public.products (
  product_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_id bigint NOT NULL REFERENCES public.categories(category_id),
  product_code text UNIQUE NOT NULL,
  name text NOT NULL,
  price numeric(12,0) NOT NULL CHECK (price >= 0),
  description text,
  image_url text,
  is_favorite bool NOT NULL DEFAULT false,
  is_signature bool NOT NULL DEFAULT false,
  is_recommended bool NOT NULL DEFAULT false,
  is_available bool NOT NULL DEFAULT true,
  menu_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabel Extras (Pilihan Tambahan / Add-ons)
CREATE TABLE IF NOT EXISTS public.extras (
  extra_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text UNIQUE NOT NULL,
  description text,
  price numeric(12,0) NOT NULL CHECK (price >= 0),
  is_available bool NOT NULL DEFAULT true
);

-- Sequence untuk Nomor Tiket Pesanan
CREATE SEQUENCE IF NOT EXISTS public.order_no_seq;

-- Tabel Orders (Pesanan Pelanggan & POS)
CREATE TABLE IF NOT EXISTS public.orders (
  order_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_number text UNIQUE NOT NULL,
  session_id bigint NOT NULL REFERENCES public.table_sessions(session_id),
  created_by uuid,
  order_source text NOT NULL DEFAULT 'qr' CHECK (order_source IN ('qr', 'staff')),
  order_status text NOT NULL DEFAULT 'submitted',
  payment_preference text,
  qr_verification_code text,
  note text,
  total numeric(12,0) NOT NULL DEFAULT 0,
  idempotency_key text,
  ready_at timestamptz,
  served_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_order_status_check 
  CHECK (order_status IN ('pending', 'pending_confirmation', 'draft', 'submitted', 'preparing', 'ready', 'served', 'cancelled'));

-- Tabel Order Items (Rincian Item Pesanan)
CREATE TABLE IF NOT EXISTS public.order_items (
  order_item_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id bigint NOT NULL REFERENCES public.orders(order_id) ON DELETE CASCADE,
  product_id bigint NOT NULL REFERENCES public.products(product_id),
  product_name text NOT NULL,
  unit_price numeric(12,0) NOT NULL,
  quantity int NOT NULL CHECK (quantity > 0),
  subtotal numeric(12,0) GENERATED ALWAYS AS (unit_price * quantity) STORED,
  note text,
  status text DEFAULT 'new'
);

-- Tabel Payments (Pencatatan Pembayaran & Kasir)
CREATE TABLE IF NOT EXISTS public.payments (
  payment_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  transaction_code text UNIQUE,
  order_id bigint NOT NULL REFERENCES public.orders(order_id),
  confirmed_by uuid,
  method text NOT NULL CHECK (method IN ('cash', 'qris', 'debit')),
  amount numeric(12,0) NOT NULL,
  cash_received numeric(12,0),
  change_amount numeric(12,0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz
);

-- Tabel Service Requests (Panggilan Pelayan / Permintaan Struk Meja)
CREATE TABLE IF NOT EXISTS public.service_requests (
  request_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  table_id bigint NOT NULL REFERENCES public.tables(table_id),
  kind text NOT NULL CHECK (kind IN ('waiter', 'checkout')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done')),
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid
);

-- Tabel Ingredients (Manajemen Inventori & Stok Bahan Baku)
CREATE TABLE IF NOT EXISTS public.ingredients (
  ingredient_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Bumbu & Rempah',
  current_stock numeric(12,2) NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  minimum_stock numeric(12,2) NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'kg',
  cost_per_unit numeric(12,0) NOT NULL DEFAULT 0,
  supplier text,
  last_restocked timestamptz DEFAULT now(),
  linked_menu_items text[] NOT NULL DEFAULT '{}'
);

-- Tabel Store Settings (Konfigurasi Outlet & Pajak PB1 Terpusat)
CREATE TABLE IF NOT EXISTS public.store_settings (
  setting_id int PRIMARY KEY DEFAULT 1,
  store_name text DEFAULT 'Rawon Gusti Surabaya',
  tax_name text DEFAULT 'PB1 (Pajak Restoran)',
  tax_rate numeric DEFAULT 10,
  enable_tax bool DEFAULT true,
  service_charge_name text DEFAULT 'Biaya Layanan',
  service_charge_rate numeric DEFAULT 5,
  enable_service_charge bool DEFAULT true,
  receipt_header text DEFAULT 'Rawon Gusti Surabaya - Heritage Taste',
  receipt_footer text DEFAULT 'Terima kasih atas kunjungan Anda!',
  guest_wifi_ssid text DEFAULT 'RawonGusti-Tamu',
  guest_wifi_password text DEFAULT 'rawonenak123',
  kds_enabled bool DEFAULT true,
  auto_inventory_deduction bool DEFAULT true,
  open_hour text DEFAULT '08:00',
  close_hour text DEFAULT '22:00',
  force_close bool DEFAULT false,
  sound_enabled bool DEFAULT true,
  sound_station text DEFAULT 'Semua Bagian',
  rounding_rule text DEFAULT 'none',
  updated_at timestamptz DEFAULT now()
);

-- Tabel Cashier Shifts (Rekonsiliasi Kas Laci Kasir)
CREATE TABLE IF NOT EXISTS public.cashier_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cashier_id uuid,
  cashier_name text,
  starting_cash numeric DEFAULT 0,
  total_cash_in numeric DEFAULT 0,
  physical_cash numeric,
  cash_difference numeric,
  opened_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at timestamptz DEFAULT now()
);

-- Indeks Performa
CREATE INDEX IF NOT EXISTS orders_session_idx ON public.orders(session_id);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS payments_paid_at_idx ON public.payments(paid_at);
CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_idx ON public.orders(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- ---------------------------------------------------------------------
-- 2. LOGIKA BISNIS & FUNGSI RPC DATABASE
-- ---------------------------------------------------------------------

-- Helper Hak Akses
CREATE OR REPLACE FUNCTION public.app_role() RETURNS text 
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT coalesce(
    (SELECT role FROM public.profiles WHERE id = auth.uid() AND is_active = true),
    'none'
  );
$$;

-- Perhitungan Tagihan (Layanan 5% & PB1 10%)
CREATE OR REPLACE FUNCTION public.bill_total(sub numeric) RETURNS numeric 
LANGUAGE sql IMMUTABLE AS $$
  SELECT sub + round(sub * 0.05) + round((sub + round(sub * 0.05)) * 0.1);
$$;

-- Ambil Info Meja Pelanggan
CREATE OR REPLACE FUNCTION public.get_table(p_token text)
RETURNS TABLE(table_number int, area text, capacity int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT table_number, area, capacity FROM public.tables WHERE qr_token = p_token AND is_active = true;
$$;

-- Helper Membuka Sesi Meja
CREATE OR REPLACE FUNCTION public._open_session(p_table bigint, p_guests int, p_name text) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s bigint;
BEGIN
  SELECT session_id INTO s FROM public.table_sessions WHERE table_id=p_table AND closed_at IS NULL;
  IF s IS NULL THEN
    INSERT INTO public.table_sessions(table_id, guest_count, customer_name)
      VALUES(p_table, greatest(1, least(coalesce(p_guests, 1), 50)), nullif(left(coalesce(p_name, ''), 60), '')) 
      RETURNING session_id INTO s;
  ELSIF p_name IS NOT NULL AND p_name <> '' THEN
    UPDATE public.table_sessions SET customer_name = left(p_name, 60) WHERE session_id=s AND customer_name IS NULL;
  END IF;
  RETURN s;
END $$;

-- Helper Memasukkan Item Pesanan & Validasi Harga
CREATE OR REPLACE FUNCTION public._insert_items(p_order bigint, p_items jsonb) RETURNS numeric
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE it jsonb; p public.products; q int; ex numeric; sub numeric := 0; n text;
BEGIN
  FOR it IN SELECT * FROM jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) LOOP
    SELECT * INTO p FROM public.products WHERE product_id = (it->>'id')::bigint AND is_available;
    q := least(coalesce((it->>'qty')::int, 0), 50);
    CONTINUE WHEN p.product_id IS NULL OR q <= 0;
    SELECT coalesce(sum(price), 0) INTO ex FROM public.extras
      WHERE is_available AND extra_id IN (SELECT (jsonb_array_elements_text(coalesce(it->'extras', '[]'::jsonb)))::bigint);
    n := nullif(left(coalesce(it->>'note', ''), 200), '');
    INSERT INTO public.order_items(order_id, product_id, product_name, unit_price, quantity, note)
      VALUES(p_order, p.product_id, p.name, p.price + ex, q, n);
    sub := sub + (p.price + ex) * q;
  END LOOP;
  RETURN sub;
END $$;

-- Pembuatan Pesanan oleh Pelanggan via QR Code
CREATE OR REPLACE FUNCTION public.place_order(p_token text, p_guests int, p_items jsonb, p_note text, p_pay_pref text DEFAULT 'cashier', p_idempotency_key text DEFAULT null)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE t public.tables; s bigint; o public.orders; sub numeric;
BEGIN
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO o FROM public.orders WHERE idempotency_key = p_idempotency_key;
    IF o.order_id IS NOT NULL THEN
      RETURN jsonb_build_object('ok', o.order_number, 'order_id', o.order_id, 'cached', true);
    END IF;
  END IF;

  SELECT * INTO t FROM public.tables WHERE qr_token = p_token AND is_active = true;
  IF t.table_id IS NULL THEN RETURN jsonb_build_object('error', 'Meja tidak valid'); END IF;
  s := public._open_session(t.table_id, p_guests, null);
  INSERT INTO public.orders(order_number, session_id, order_source, payment_preference, note, idempotency_key)
    VALUES('A' || lpad(nextval('public.order_no_seq')::text, 4, '0'), s, 'qr',
           CASE WHEN p_pay_pref IN ('qris', 'cashier') THEN p_pay_pref ELSE 'cashier' END,
           nullif(left(coalesce(p_note, ''), 200), ''), p_idempotency_key) RETURNING * INTO o;
  sub := public._insert_items(o.order_id, p_items);
  IF sub <= 0 THEN 
    DELETE FROM public.orders WHERE order_id = o.order_id; 
    RETURN jsonb_build_object('error', 'Pilih menu dulu'); 
  END IF;
  UPDATE public.orders SET total = public.bill_total(sub) WHERE order_id = o.order_id;
  RETURN jsonb_build_object('ok', o.order_number, 'order_id', o.order_id);
END $$;

-- Riwayat Pesanan di Sesi Meja Pelanggan
CREATE OR REPLACE FUNCTION public.my_orders(p_token text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'order_id', o.order_id, 'order_number', o.order_number, 'status', o.order_status, 'total', o.total,
    'note', o.note, 'created_at', o.created_at, 'pay_pref', o.payment_preference, 'guests', s.guest_count,
    'paid', exists(SELECT 1 FROM public.payments p WHERE p.order_id = o.order_id AND p.status = 'paid'),
    'items', (SELECT coalesce(jsonb_agg(jsonb_build_object('name', i.product_name, 'qty', i.quantity, 'price', i.unit_price, 'note', i.note) ORDER BY i.order_item_id), '[]'::jsonb) FROM public.order_items i WHERE i.order_id = o.order_id)
  ) ORDER BY o.created_at), '[]'::jsonb)
  FROM public.tables t JOIN public.table_sessions s ON s.table_id = t.table_id AND s.closed_at IS NULL
  JOIN public.orders o ON o.session_id = s.session_id AND o.order_status <> 'draft'
  WHERE t.qr_token = p_token
$$;

-- Permintaan Pelayan oleh Pelanggan
CREATE OR REPLACE FUNCTION public.request_service(p_token text, p_kind text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE t public.tables; s bigint; recent_exists bool;
BEGIN
  IF p_kind NOT IN ('waiter', 'checkout') THEN RETURN jsonb_build_object('error', 'Jenis tidak valid'); END IF;
  SELECT * INTO t FROM public.tables WHERE qr_token = p_token AND is_active = true;
  IF t.table_id IS NULL THEN RETURN jsonb_build_object('error', 'Meja tidak valid'); END IF;
  SELECT session_id INTO s FROM public.table_sessions WHERE table_id = t.table_id AND closed_at IS NULL;
  IF s IS NULL THEN RETURN jsonb_build_object('error', 'Tidak ada sesi aktif di meja ini'); END IF;

  IF exists(SELECT 1 FROM public.service_requests WHERE table_id = t.table_id AND kind = p_kind AND status = 'pending') THEN
    RETURN jsonb_build_object('ok', true, 'message', 'Permintaan sudah tercatat');
  END IF;

  SELECT exists(
    SELECT 1 FROM public.service_requests
    WHERE table_id = t.table_id AND kind = p_kind AND created_at > now() - interval '60 seconds'
  ) INTO recent_exists;
  IF recent_exists THEN
    RETURN jsonb_build_object('error', 'Harap tunggu 60 detik sebelum mengirim permintaan kembali');
  END IF;

  INSERT INTO public.service_requests(table_id, kind) VALUES(t.table_id, p_kind);
  RETURN jsonb_build_object('ok', true);
END $$;

-- Pembuatan Pesanan oleh Staf Kasir POS
CREATE OR REPLACE FUNCTION public.staff_place_order(p_table_id bigint, p_guests int, p_customer text, p_items jsonb, p_note text, p_draft bool DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s bigint; o public.orders; sub numeric;
BEGIN
  IF NOT exists(SELECT 1 FROM public.tables WHERE table_id = p_table_id AND is_active = true) THEN 
    RETURN jsonb_build_object('error', 'Meja tidak valid'); 
  END IF;
  s := public._open_session(p_table_id, p_guests, p_customer);
  UPDATE public.table_sessions SET guest_count = greatest(1, least(coalesce(p_guests, 1), 50)), customer_name = coalesce(nullif(p_customer, ''), customer_name) WHERE session_id = s;
  DELETE FROM public.orders WHERE session_id = s AND order_status = 'draft';
  INSERT INTO public.orders(order_number, session_id, order_source, created_by, order_status, note)
    VALUES((CASE WHEN p_draft THEN 'D' ELSE 'A' END) || lpad(nextval('public.order_no_seq')::text, 4, '0'), s, 'staff', auth.uid(),
           CASE WHEN p_draft THEN 'draft' ELSE 'submitted' END, nullif(left(coalesce(p_note, ''), 200), '')) RETURNING * INTO o;
  sub := public._insert_items(o.order_id, p_items);
  IF sub <= 0 THEN 
    DELETE FROM public.orders WHERE order_id = o.order_id; 
    RETURN jsonb_build_object('error', 'Pilih menu dulu'); 
  END IF;
  UPDATE public.orders SET total = public.bill_total(sub) WHERE order_id = o.order_id;
  RETURN jsonb_build_object('ok', o.order_number, 'order_id', o.order_id);
END $$;

-- Memajukan Status Pesanan Dapur (KDS)
CREATE OR REPLACE FUNCTION public.advance_order(p_order bigint) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o public.orders; nxt text;
BEGIN
  SELECT * INTO o FROM public.orders WHERE order_id = p_order FOR UPDATE;
  IF o.order_id IS NULL THEN RETURN jsonb_build_object('error', 'Pesanan tidak ditemukan'); END IF;
  nxt := CASE o.order_status WHEN 'draft' THEN 'submitted' WHEN 'submitted' THEN 'preparing' WHEN 'preparing' THEN 'ready' WHEN 'ready' THEN 'served' END;
  IF nxt IS NULL THEN RETURN jsonb_build_object('error', 'Status tidak bisa dimajukan'); END IF;
  UPDATE public.orders SET order_status = nxt, updated_at = now(),
    ready_at = CASE WHEN nxt = 'ready' THEN now() ELSE ready_at END,
    served_at = CASE WHEN nxt = 'served' THEN now() ELSE served_at END
  WHERE order_id = p_order;
  RETURN jsonb_build_object('ok', nxt);
END $$;

-- Pembayaran Sesi Meja & Tutup Transaksi
CREATE OR REPLACE FUNCTION public.pay_session(p_session bigint, p_method text, p_received numeric DEFAULT null)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o record; s public.table_sessions; total numeric := 0; recv numeric; first_pay bool := true; codes text[] := '{}';
BEGIN
  IF p_method NOT IN ('cash', 'qris', 'debit') THEN RETURN jsonb_build_object('error', 'Metode tidak valid'); END IF;
  SELECT * INTO s FROM public.table_sessions WHERE session_id = p_session FOR UPDATE;
  IF s.session_id IS NULL THEN RETURN jsonb_build_object('error', 'Sesi tidak ditemukan'); END IF;
  IF s.closed_at IS NOT NULL THEN RETURN jsonb_build_object('error', 'Sesi ini sudah ditutup dan lunas'); END IF;

  IF exists(SELECT 1 FROM public.orders WHERE session_id = p_session AND order_status IN ('submitted', 'preparing', 'ready')) THEN
    RETURN jsonb_build_object('error', 'Masih ada pesanan yang belum disajikan'); 
  END IF;

  SELECT coalesce(sum(public.bill_total((SELECT sum(subtotal) FROM public.order_items WHERE order_id = o2.order_id))), 0) INTO total
    FROM public.orders o2 WHERE o2.session_id = p_session AND o2.order_status = 'served'
    AND NOT exists(SELECT 1 FROM public.payments p WHERE p.order_id = o2.order_id AND p.status = 'paid');

  IF total <= 0 THEN RETURN jsonb_build_object('error', 'Tidak ada tagihan tertunggak'); END IF;
  recv := CASE WHEN p_method = 'cash' THEN coalesce(p_received, 0) ELSE total END;
  IF recv < total THEN RETURN jsonb_build_object('error', 'Uang diterima kurang dari total'); END IF;

  FOR o IN SELECT o2.order_id, o2.order_number, public.bill_total((SELECT sum(subtotal) FROM public.order_items WHERE order_id = o2.order_id)) amt
           FROM public.orders o2 WHERE o2.session_id = p_session AND o2.order_status = 'served'
           AND NOT exists(SELECT 1 FROM public.payments p WHERE p.order_id = o2.order_id AND p.status = 'paid') ORDER BY o2.order_id LOOP
    INSERT INTO public.payments(transaction_code, order_id, confirmed_by, method, amount, cash_received, change_amount, status, paid_at)
      VALUES('T' || (extract(epoch from clock_timestamp()) * 1000)::bigint || o.order_id, o.order_id, auth.uid(), p_method, o.amt,
             CASE WHEN first_pay THEN recv END, CASE WHEN first_pay THEN recv - total END, 'paid', now());
    first_pay := false;
    codes := codes || o.order_number;
  END LOOP;

  UPDATE public.table_sessions SET closed_at = now() WHERE session_id = p_session;
  UPDATE public.service_requests SET status = 'done', resolved_at = now()
    WHERE status = 'pending' AND table_id = s.table_id;
  RETURN jsonb_build_object('ok', true, 'total', total, 'change', recv - total, 'orders', codes);
END $$;

-- ---------------------------------------------------------------------
-- 3. PERMISSIONS & KEAMANAN MULTI-DEVICE (ONLINE FIRST)
-- ---------------------------------------------------------------------

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated;

-- Aktifkan RLS dan berikan policy agar aman dari Security Advisor
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashier_shifts ENABLE ROW LEVEL SECURITY;

-- Policy Operasional agar PostgREST sinkron mulus
CREATE POLICY "allow_all_profiles" ON public.profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_tables" ON public.tables FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_table_sessions" ON public.table_sessions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_categories" ON public.categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_products" ON public.products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_extras" ON public.extras FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_orders" ON public.orders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_order_items" ON public.order_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_payments" ON public.payments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_service_requests" ON public.service_requests FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_ingredients" ON public.ingredients FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_store_settings" ON public.store_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_cashier_shifts" ON public.cashier_shifts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------
-- 4. MASTER SEED DATA
-- ---------------------------------------------------------------------

-- A. Kategori Bersih (7 Kategori)
INSERT INTO public.categories (category_id, name, menu_order) OVERRIDING SYSTEM VALUE VALUES
  (1, 'Menu Nusantara', 1),
  (2, 'Sambelan', 2),
  (3, 'Pendamping', 3),
  (5, 'Teh', 4),
  (6, 'Kopi', 5),
  (7, 'Wedang', 6),
  (8, 'Lainnya', 7)
ON CONFLICT (name) DO UPDATE SET menu_order = EXCLUDED.menu_order;

-- B. Katalog Produk (70 Menu Bersih Tanpa Duplikasi)
INSERT INTO public.products (category_id, product_code, name, price, is_recommended, is_available, image_url)
SELECT c.category_id, v.code, v.name, v.price, v.is_recommended, v.is_available, v.image_url
FROM (VALUES
  ('Menu Nusantara', 'MN001', 'Nasi Rawon Daging', 26000, false, true, NULL),
  ('Menu Nusantara', 'MN002', 'Nasi Rawon Otot', 26000, false, true, NULL),
  ('Menu Nusantara', 'MN003', 'Nasi Rawon Empal', 26000, false, true, NULL),
  ('Menu Nusantara', 'MN004', 'Nasi Rawon Campur', 32000, false, true, NULL),
  ('Menu Nusantara', 'MN005', 'Nasi Rawon Spesial', 36000, false, true, NULL),
  ('Menu Nusantara', 'MN006', 'Rawon Tanpa Nasi', 21000, false, true, NULL),
  ('Menu Nusantara', 'MN007', 'Nasi Sop Ayam Goreng (1/8 Potong)', 25000, false, true, NULL),
  ('Menu Nusantara', 'MN008', 'Nasi Sop Empal', 30000, false, true, NULL),
  ('Menu Nusantara', 'MN009', 'Nasi Sop Paru', 26000, false, true, NULL),
  ('Menu Nusantara', 'MN010', 'Nasi Sop Telur Goreng', 20000, false, true, NULL),
  ('Menu Nusantara', 'MN011', 'Nasi Sop Otot', 28000, false, true, NULL),
  ('Menu Nusantara', 'MN012', 'Sop Tanpa Nasi', 15000, false, true, NULL),
  ('Menu Nusantara', 'MN013', 'Nasi Pecel Ayam Goreng (1/8 Potong)', 25000, false, true, NULL),
  ('Menu Nusantara', 'MN014', 'Nasi Pecel Empal', 30000, false, true, NULL),
  ('Menu Nusantara', 'MN015', 'Nasi Pecel Paru', 26000, false, true, NULL),
  ('Menu Nusantara', 'MN016', 'Nasi Pecel Telur Goreng', 20000, false, true, NULL),
  ('Menu Nusantara', 'MN017', 'Nasi Pecel Telur Bali', 21000, false, true, NULL),
  ('Menu Nusantara', 'MN018', 'Pecel Tanpa Nasi', 15000, false, true, NULL),
  ('Menu Nusantara', 'MN019', 'Nasi Campur', 25000, false, true, NULL),
  ('Menu Nusantara', 'MN020', 'Nasi Sambel Cecek/Jeroan', 18000, false, true, NULL),
  ('Menu Nusantara', 'MN021', 'Telur Bali', 8000, false, true, NULL),
  ('Menu Nusantara', 'MN022', 'Lodeh', 16000, false, true, NULL),
  ('Menu Nusantara', 'MN023', 'Sayur Asem', 16000, false, true, NULL),
  ('Menu Nusantara', 'MN024', 'Nasi Opor', 25000, false, true, NULL),
  ('Menu Nusantara', 'MN025', 'Opor Ayam Tanpa Nasi', 20000, false, true, NULL),
  ('Sambelan', 'SMB001', 'Nasi Lele Goreng', 26000, false, true, NULL),
  ('Sambelan', 'SMB002', 'Nasi Ayam Goreng (1/4)', 26000, false, true, NULL),
  ('Sambelan', 'SMB003', 'Nasi Empal Goreng', 26000, false, true, NULL),
  ('Sambelan', 'SMB004', 'Nasi Paru Goreng', 26000, false, true, NULL),
  ('Sambelan', 'SMB005', 'Nasi 4T', 20000, false, true, NULL),
  ('Sambelan', 'SMB006', 'Nasi Sambelan Telur', 16000, false, true, NULL),
  ('Sambelan', 'SMB007', 'Nasi Ikan Pe Goreng', 25000, false, true, NULL),
  ('Sambelan', 'SMB008', 'Nasi Ati Ampela', 20000, false, true, NULL),
  ('Sambelan', 'SMB009', 'Nasi Usus Goreng', 20000, false, true, NULL),
  ('Pendamping', 'AL006', 'Ikan Pe Goreng', 18000, false, true, NULL),
  ('Pendamping', 'AL007', '4T', 13000, false, true, NULL),
  ('Pendamping', 'AL010', 'Usus Goreng', 10000, false, true, NULL),
  ('Pendamping', 'AL011', 'Ati Ampela', 12000, false, true, NULL),
  ('Pendamping', 'PD001', 'Nasi Putih', 7000, false, true, NULL),
  ('Pendamping', 'PD002', 'Daging Rawon', 18000, false, true, NULL),
  ('Pendamping', 'PD003', 'Empal Goreng', 18000, false, true, NULL),
  ('Pendamping', 'PD004', 'Paru Goreng', 12000, false, true, NULL),
  ('Pendamping', 'PD005', 'Ayam Goreng (1/4)', 17000, false, true, NULL),
  ('Pendamping', 'PD006', 'Otot', 15000, false, true, NULL),
  ('Pendamping', 'PD007', 'Kuah Rawon', 5000, false, true, NULL),
  ('Pendamping', 'PD008', 'Telur Goreng (Dadar/Ceplok)', 6000, false, true, NULL),
  ('Pendamping', 'PD009', 'Telur Asin', 9000, false, true, NULL),
  ('Pendamping', 'PD010', 'Tahu/Tempe (2 Pcs)', 5000, false, true, NULL),
  ('Pendamping', 'PD011', 'Perkedel (3 Pcs)', 5000, false, true, NULL),
  ('Pendamping', 'PD012', 'Kerupuk (3 Pcs)', 2000, false, true, NULL),
  ('Pendamping', 'PD013', 'Kerupuk Udang (2 Pcs)', 5000, false, true, NULL),
  ('Pendamping', 'PD014', 'Peyek', 5000, false, true, NULL),
  ('Teh', 'TEH001', 'Teh Manis/Tawar', 8000, false, true, NULL),
  ('Teh', 'TEH002', 'Teh Jumbo Manis/Tawar', 12000, false, true, NULL),
  ('Teh', 'TEH003', 'Teh Jeruk Nipis', 15000, false, true, NULL),
  ('Teh', 'TEH004', 'Teh Kampul', 15000, false, true, NULL),
  ('Teh', 'TEH005', 'Nipis Telang Panas', 16000, false, true, NULL),
  ('Teh', 'TEH006', 'Nipis Telang Es', 14000, false, true, NULL),
  ('Teh', 'TEH007', 'Kombucha', 15000, false, true, NULL),
  ('Kopi', 'KOP001', 'Kopi Hitam Panas', 11000, false, true, NULL),
  ('Kopi', 'KOP002', 'Kopi Hitam Es', 15000, false, true, NULL),
  ('Kopi', 'KOP003', 'Kopi Susu Panas', 12000, false, true, NULL),
  ('Kopi', 'KOP004', 'Kopi Susu Es', 16000, false, true, NULL),
  ('Kopi', 'KOP005', 'Kopi Susu Jahe Panas', 14000, false, true, NULL),
  ('Kopi', 'KOP006', 'Kopi Susu Jahe Es', 18000, false, true, NULL),
  ('Wedang', 'WDG005', 'Jahe Nipis Panas', 17000, false, true, NULL),
  ('Wedang', 'WDG006', 'Jahe Nipis Es', 20000, false, true, NULL),
  ('Wedang', 'WDG007', 'Jamon Panas', 17000, false, true, NULL),
  ('Wedang', 'WDG008', 'Jamon Es', 20000, false, true, NULL),
  ('Lainnya', 'LL001', 'Air Mineral', 5000, false, true, NULL)
) AS v(cat, code, name, price, is_recommended, is_available, image_url)
JOIN public.categories c ON c.name = v.cat
ON CONFLICT (product_code) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  is_recommended = EXCLUDED.is_recommended,
  is_available = EXCLUDED.is_available,
  image_url = EXCLUDED.image_url;


-- B. Pengaturan Outlet Cloud
INSERT INTO public.store_settings (setting_id, store_name, tax_name, tax_rate, enable_tax, service_charge_name, service_charge_rate, enable_service_charge, guest_wifi_ssid, guest_wifi_password)
VALUES (1, 'Rawon Gusti Surabaya', 'PB1 (Pajak Restoran)', 10, true, 'Biaya Layanan', 5, true, 'RawonGusti-Tamu', 'rawonenak123')
ON CONFLICT (setting_id) DO NOTHING;

-- C. Daftar Meja Restoran (12 Meja)
INSERT INTO public.tables (table_number, qr_token, capacity, area, is_active)
VALUES
  (1, 'tbl_token_meja_01', 4, 'Ruang Utama (AC)', true),
  (2, 'tbl_token_meja_02', 4, 'Ruang Utama (AC)', true),
  (3, 'tbl_token_meja_03', 4, 'Ruang Utama (AC)', true),
  (4, 'tbl_token_meja_04', 4, 'Ruang Utama (AC)', true),
  (5, 'tbl_token_meja_05', 4, 'Ruang Utama (AC)', true),
  (6, 'tbl_token_meja_06', 4, 'Ruang Utama (AC)', true),
  (7, 'tbl_token_meja_07', 6, 'Area Pendopo (Smoking)', true),
  (8, 'tbl_token_meja_08', 6, 'Area Pendopo (Smoking)', true),
  (9, 'tbl_token_meja_09', 6, 'Area Pendopo (Smoking)', true),
  (10, 'tbl_token_meja_10', 8, 'VIP Room', true),
  (11, 'tbl_token_meja_11', 4, 'Outdoor Garden', true),
  (12, 'tbl_token_meja_12', 4, 'Outdoor Garden', true)
ON CONFLICT (table_number) DO UPDATE SET 
  capacity = EXCLUDED.capacity,
  area = EXCLUDED.area,
  is_active = true;

-- D. Pelengkap Menu (Extras)
INSERT INTO public.extras (name, description, price, is_available) VALUES
  ('Kerupuk Udang Jumbo', 'Renyah gurih, ukuran besar 20cm', 4000, true),
  ('Ekstra Sambal Terasi Gurih', 'Cobek kecil sambal matang uleg pedas mantap', 3000, true),
  ('Sambal Kecap Rawit', 'Kecap manis kental dengan irisan rawit hijau', 2500, true),
  ('Nasi Putih Hangat Tambahan', 'Beras pandan wangi pulen 1 porsi', 5000, true),
  ('Telur Asin Brebes', 'Telur bebek asin masir khas rawon', 6000, true)
ON CONFLICT (name) DO NOTHING;

-- E. Stok Bahan Baku (Ingredients)
INSERT INTO public.ingredients (code, name, category, current_stock, minimum_stock, unit, cost_per_unit, supplier, linked_menu_items) VALUES
  ('BHN-001', 'Daging Sengkel Sapi', 'Daging & Unggas', 8.5, 5.0, 'kg', 125000, 'UD Jagal Pegirian', '{"Nasi Rawon Daging", "Rawon Daging Signature"}'),
  ('BHN-002', 'Kluwek Matang Pilihan', 'Bumbu & Rempah', 3.2, 2.0, 'kg', 35000, 'Pasar Keputran', '{"Rawon Daging Signature", "Kuah Rawon"}'),
  ('BHN-003', 'Beras Pandan Wangi', 'Beras & Pokok', 35.0, 15.0, 'kg', 16000, 'Toko Beras Makmur', '{"Nasi Putih Hangat"}'),
  ('BHN-004', 'Telur Bebek Asin Brebes', 'Sayur & Pelengkap', 24.0, 15.0, 'butir', 4200, 'Peternakan Brebes Masir', '{"Telur Asin Brebes"}'),
  ('BHN-005', 'Tauge Pendek Rawon', 'Sayur & Pelengkap', 4.5, 3.0, 'kg', 12000, 'Pasar Pabean', '{"Rawon Daging Signature"}'),
  ('BHN-006', 'Daging Ayam Kampung', 'Daging & Unggas', 12.0, 5.0, 'ekor', 45000, 'Peternakan Lawang', '{"Ayam Goreng Lengkuas"}'),
  ('BHN-007', 'Paru & Jeroan Sapi', 'Daging & Unggas', 5.0, 3.0, 'kg', 70000, 'UD Jagal Pegirian', '{"Nasi Rawon Campur"}'),
  ('BHN-008', 'Teh Melati Solo', 'Minuman', 8.0, 4.0, 'pack', 15000, 'CV Teh Wangi Nusantara', '{"Es Teh Manis", "Teh Hangat"}'),
  ('BHN-009', 'Kopi Robusta Bubuk', 'Minuman', 5.5, 2.5, 'kg', 90000, 'Kebun Kopi Dampit', '{"Kopi Hitam", "Kopi Susu"}')
ON CONFLICT (code) DO NOTHING;

-- F. Akun Demo / Staf Awal
INSERT INTO public.profiles (id, full_name, email, role, is_active, shift, terminal)
VALUES
  ('45c1ed77-73ec-4c1d-b309-847897ca7be9', 'Budi Admin', 'admin@rawongusti.test', 'admin', true, 'Shift Pagi 08:00 - 16:00', 'Kasir Utama #01'),
  ('a1111111-1111-1111-1111-111111111111', 'Haji Gusti (Owner)', 'owner@rawongusti.test', 'owner', true, 'Shift Penuh', 'Manajemen Kantor'),
  ('b2222222-2222-2222-2222-222222222222', 'Dewi Sartika (Kasir)', 'kasir@rawongusti.test', 'cashier', true, 'Shift Siang 10:00 - 18:00', 'Kasir Depan #02'),
  ('c3333333-3333-3333-3333-333333333333', 'Chef Sam (Dapur)', 'dapur@rawongusti.test', 'kitchen', true, 'Shift Penuh 08:00 - 17:00', 'KDS Stasiun Panas')
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name,
  shift = EXCLUDED.shift,
  terminal = EXCLUDED.terminal;

-- Helper Pembuat Akun Auth & Role Terintegrasi (Email & Password Hash)
CREATE OR REPLACE FUNCTION public.create_staff_account(
  p_email text, 
  p_password text, 
  p_name text, 
  p_role text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions AS $$
DECLARE 
  uid uuid; 
BEGIN
  IF p_role NOT IN ('admin', 'owner', 'staff', 'cashier', 'kitchen', 'customer') THEN
    RAISE EXCEPTION 'Role tidak valid: %', p_role;
  END IF;

  SELECT id INTO uid FROM auth.users WHERE email = lower(p_email);
  
  IF uid IS NULL THEN
    uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      lower(p_email), crypt(p_password, gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', 
      jsonb_build_object('full_name', p_name, 'role', p_role), 
      now(), now(), '', '', '', ''
    );
    
    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), uid, uid::text, 
      jsonb_build_object('sub', uid::text, 'email', lower(p_email)), 
      'email', now(), now(), now()
    );
  ELSE
    UPDATE auth.users 
    SET encrypted_password = crypt(p_password, gen_salt('bf')),
        updated_at = now()
    WHERE id = uid;
  END IF;

  INSERT INTO public.profiles (id, role, full_name, email, is_active)
  VALUES (uid, p_role, p_name, lower(p_email), true)
  ON CONFLICT (id) DO UPDATE SET 
    role = EXCLUDED.role, 
    full_name = EXCLUDED.full_name, 
    email = EXCLUDED.email,
    is_active = true;

  RETURN uid;
END $$;

-- ---------------------------------------------------------------------
-- SELESAI: Database Rawon Gusti 100% Master Ready!
-- ---------------------------------------------------------------------
