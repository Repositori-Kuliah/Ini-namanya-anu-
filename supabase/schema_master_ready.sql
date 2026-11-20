-- =========================================================================
-- RAWON GUSTI POS & SELF-ORDERING - MASTER DATABASE OVERHAUL & SYNC
-- =========================================================================
-- Script ini menyesuaikan 100% database Supabase dengan UI Frontend & Backend API:
-- 1. Penambahan Meja 00 (Takeaway) dan perbaikan kolom tables (capacity, area)
-- 2. Penambahan customer_name, is_takeaway pada table_sessions
-- 3. Dukungan status 'pending' (QR order) dan 'cancelled' pada orders
-- 4. Pembuatan tabel ingredients (stok bahan baku) yang belum ada
-- 5. Pembukaan izin akses (GRANT & nonaktifkan RLS yang memblokir akses multi-device)
-- =========================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. PENYELARASAN TABEL TABLES
CREATE TABLE IF NOT EXISTS public.tables (
  table_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  table_number int UNIQUE NOT NULL,
  qr_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
  capacity int NOT NULL DEFAULT 4,
  area text NOT NULL DEFAULT 'Ruang utama',
  is_active bool NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS capacity int NOT NULL DEFAULT 4;
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS area text NOT NULL DEFAULT 'Ruang utama';
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS qr_token text;
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS is_active bool NOT NULL DEFAULT true;

-- 3. PENYELARASAN TABEL TABLE_SESSIONS
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

ALTER TABLE public.table_sessions ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.table_sessions ADD COLUMN IF NOT EXISTS is_takeaway bool NOT NULL DEFAULT false;
ALTER TABLE public.table_sessions ADD COLUMN IF NOT EXISTS takeaway_queue text;

-- 4. PENYELARASAN TABEL ORDERS & STATUS PESANAN
CREATE SEQUENCE IF NOT EXISTS public.order_no_seq;

CREATE TABLE IF NOT EXISTS public.orders (
  order_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_number text UNIQUE NOT NULL,
  session_id bigint NOT NULL REFERENCES public.table_sessions(session_id),
  created_by uuid,
  order_source text NOT NULL DEFAULT 'qr',
  order_status text NOT NULL DEFAULT 'submitted',
  payment_preference text,
  note text,
  total numeric(12,0) NOT NULL DEFAULT 0,
  idempotency_key text,
  ready_at timestamptz,
  served_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_preference text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key text;

-- Hapus check constraint lama pada order_status agar mendukung 'pending' (QR customer) dan 'cancelled'
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_order_status_check 
  CHECK (order_status IN ('pending', 'pending_confirmation', 'draft', 'submitted', 'preparing', 'ready', 'served', 'cancelled'));

-- 5. PENYELARASAN TABEL ORDER_ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
  order_item_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id bigint NOT NULL REFERENCES public.orders(order_id) ON DELETE CASCADE,
  product_id bigint NOT NULL REFERENCES public.products(product_id),
  product_name text NOT NULL,
  unit_price numeric(12,0) NOT NULL,
  quantity int NOT NULL CHECK (quantity > 0),
  subtotal numeric(12,0) GENERATED ALWAYS AS (unit_price * quantity) STORED,
  note text
);

-- 6. PENYELARASAN TABEL PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
  payment_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  transaction_code text UNIQUE,
  order_id bigint NOT NULL REFERENCES public.orders(order_id),
  confirmed_by uuid,
  method text NOT NULL DEFAULT 'cash',
  amount numeric(12,0) NOT NULL,
  cash_received numeric(12,0),
  change_amount numeric(12,0),
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz
);

-- 7. PENYELARASAN TABEL SERVICE_REQUESTS
CREATE TABLE IF NOT EXISTS public.service_requests (
  request_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  table_id bigint NOT NULL REFERENCES public.tables(table_id),
  kind text NOT NULL DEFAULT 'waiter',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- 8. PENYELARASAN TABEL EXTRAS (Pelengkap Menu)
CREATE TABLE IF NOT EXISTS public.extras (
  extra_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text UNIQUE NOT NULL,
  description text,
  price numeric(12,0) NOT NULL CHECK (price >= 0),
  is_available bool NOT NULL DEFAULT true
);

INSERT INTO public.extras (name, description, price, is_available) VALUES
  ('Kerupuk Udang Jumbo', 'Renyah gurih, ukuran besar 20cm', 4000, true),
  ('Ekstra Sambal Terasi Gurih', 'Cobek kecil sambal matang uleg pedas mantap', 3000, true),
  ('Sambal Kecap Rawit', 'Kecap manis kental dengan irisan rawit hijau', 2500, true),
  ('Nasi Putih Hangat Tambahan', 'Beras pandan wangi pulen 1 porsi', 5000, true),
  ('Telur Asin Brebes', 'Telur bebek asin masir khas rawon', 6000, true)
ON CONFLICT (name) DO NOTHING;

-- 9. PEMBUATAN TABEL INGREDIENTS (Bahan Baku Resto)
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

-- 10. PENYELARASAN TABEL PROFILES (Akun Staf & Role)
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS shift text DEFAULT 'Shift Pagi 08:00 - 16:00';
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS terminal text DEFAULT 'Kasir Utama #01';

-- 11. DATA SEED MEJA: MEJA 00 (TAKEAWAY) & MEJA 01 S/D 10
INSERT INTO public.tables (table_number, qr_token, capacity, area, is_active)
VALUES (0, 'tbl_token_meja_00', 0, 'Kasir / Bawa Pulang (Takeaway)', true)
ON CONFLICT (table_number) DO UPDATE SET 
  qr_token = EXCLUDED.qr_token,
  capacity = EXCLUDED.capacity,
  area = EXCLUDED.area,
  is_active = true;

INSERT INTO public.tables (table_number, qr_token, capacity, area, is_active)
SELECT 
  i, 'tbl_token_meja_' || LPAD(i::text, 2, '0'), 4, 
  CASE WHEN i <= 5 THEN 'Area Pendopo (Smoking)' ELSE 'Area Ruang Utama (AC Non-Smoking)' END, 
  true
FROM generate_series(1, 10) AS i
ON CONFLICT (table_number) DO UPDATE SET 
  qr_token = EXCLUDED.qr_token,
  capacity = EXCLUDED.capacity,
  area = EXCLUDED.area,
  is_active = true;

-- 12. PERMISSION & ROW LEVEL SECURITY (RLS) UNLOCK
-- Membuka permission agar Supabase tersambung secara riil antar-perangkat tanpa permission denied
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated;

ALTER TABLE public.tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.extras DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 13. FUNGSI RPC PENDUKUNG (get_table & bill_total)
CREATE OR REPLACE FUNCTION public.bill_total(sub numeric) RETURNS numeric 
LANGUAGE sql IMMUTABLE AS $$
  SELECT sub + round(sub * 0.05) + round((sub + round(sub * 0.05)) * 0.1);
$$;
GRANT EXECUTE ON FUNCTION public.bill_total(numeric) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_table(p_token text)
RETURNS TABLE(table_number int, area text, capacity int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT table_number, area, capacity FROM public.tables WHERE qr_token = p_token AND is_active = true;
$$;
GRANT EXECUTE ON FUNCTION public.get_table(text) TO anon, authenticated;

-- =========================================================================
-- SELESAI: Database sekarang 100% selaras dengan UI & Backend POS!
-- =========================================================================
