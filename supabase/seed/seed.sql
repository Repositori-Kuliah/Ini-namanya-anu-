-- =====================================================================
-- seed.sql
-- RAWON GUSTI POS & SELF-ORDERING - MASTER SEED & DEMO SCENARIO DATA
-- =====================================================================
-- File seed resmi tunggal untuk mengisi katalog menu, pengaturan outlet,
-- meja, bahan baku, serta skenario pesanan demo awal untuk pengujian POS & KDS.
-- =====================================================================

-- 1. KATEGORI MENU (7 Kategori Bersih)
INSERT INTO public.categories (category_id, name, menu_order) OVERRIDING SYSTEM VALUE VALUES
  (1, 'Menu Nusantara', 1),
  (2, 'Sambelan', 2),
  (3, 'Pendamping', 3),
  (5, 'Teh', 4),
  (6, 'Kopi', 5),
  (7, 'Wedang', 6),
  (8, 'Lainnya', 7)
ON CONFLICT (name) DO UPDATE SET menu_order = EXCLUDED.menu_order;

-- 2. KATALOG PRODUK (70 Menu Bersih Tanpa Duplikasi)
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

-- 3. DAFTAR MEJA DINE-IN (Meja 01 s/d 12)
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

-- 4. PELENGKAP MENU (Extras)
INSERT INTO public.extras (name, description, price, is_available) VALUES
  ('Kerupuk Udang Jumbo', 'Renyah gurih, ukuran besar 20cm', 4000, true),
  ('Ekstra Sambal Terasi Gurih', 'Cobek kecil sambal matang uleg pedas mantap', 3000, true),
  ('Sambal Kecap Rawit', 'Kecap manis kental dengan irisan rawit hijau', 2500, true),
  ('Nasi Putih Hangat Tambahan', 'Beras pandan wangi pulen 1 porsi', 5000, true),
  ('Telur Asin Brebes', 'Telur bebek asin masir khas rawon', 6000, true)
ON CONFLICT (name) DO NOTHING;

-- 5. STOK BAHAN BAKU (Ingredients)
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

-- 6. PENGATURAN OUTLET CLOUD
INSERT INTO public.store_settings (setting_id, store_name, tax_name, tax_rate, enable_tax, service_charge_name, service_charge_rate, enable_service_charge, guest_wifi_ssid, guest_wifi_password)
VALUES (1, 'Rawon Gusti Surabaya', 'PB1 (Pajak Restoran)', 10, true, 'Biaya Layanan', 5, true, 'RawonGusti-Tamu', 'rawonenak123')
ON CONFLICT (setting_id) DO NOTHING;

-- 7. AKUN STAF & PERAN DEMO
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

-- 8. SKENARIO PESANAN DEMO (Agar POS & KDS Tidak Kosong)
DO $$
DECLARE
  s1 bigint;
  s2 bigint;
  o1 bigint;
  o2 bigint;
  p_rawon bigint;
  p_nasi bigint;
  p_teh bigint;
BEGIN
  -- Lewati jika sudah ada data pesanan
  IF EXISTS (SELECT 1 FROM public.orders) THEN 
    RETURN; 
  END IF;

  SELECT product_id INTO p_rawon FROM public.products WHERE product_code = 'MN001' LIMIT 1;
  SELECT product_id INTO p_nasi FROM public.products WHERE product_code = 'PD001' LIMIT 1;
  SELECT product_id INTO p_teh FROM public.products WHERE product_code = 'TEH001' LIMIT 1;

  -- Skenario 1: Meja 02 (Pelanggan Nadia, status: dimasak / preparing di dapur)
  INSERT INTO public.table_sessions(table_id, guest_count, customer_name)
    SELECT table_id, 2, 'Nadia' FROM public.tables WHERE table_number = 2
    RETURNING session_id INTO s1;

  INSERT INTO public.orders(order_number, session_id, order_source, order_status, total, note)
    VALUES ('A1001', s1, 'qr', 'preparing', 41000, 'Rawon kuah dipisah, pedas sedang')
    RETURNING order_id INTO o1;

  IF p_rawon IS NOT NULL THEN
    INSERT INTO public.order_items(order_id, product_id, product_name, unit_price, quantity)
      VALUES (o1, p_rawon, 'Nasi Rawon Daging', 26000, 1);
  END IF;
  IF p_teh IS NOT NULL THEN
    INSERT INTO public.order_items(order_id, product_id, product_name, unit_price, quantity)
      VALUES (o1, p_teh, 'Teh Manis/Tawar', 8000, 2);
  END IF;

  -- Skenario 2: Meja 05 (Pelanggan Dimas, status: pesanan baru / submitted)
  INSERT INTO public.table_sessions(table_id, guest_count, customer_name)
    SELECT table_id, 3, 'Dimas Santoso' FROM public.tables WHERE table_number = 5
    RETURNING session_id INTO s2;

  INSERT INTO public.orders(order_number, session_id, order_source, order_status, total, note)
    VALUES ('A1002', s2, 'staff', 'submitted', 52000, 'Minta sendok tambahan')
    RETURNING order_id INTO o2;

  IF p_rawon IS NOT NULL THEN
    INSERT INTO public.order_items(order_id, product_id, product_name, unit_price, quantity)
      VALUES (o2, p_rawon, 'Nasi Rawon Daging', 26000, 2);
  END IF;

  -- Skenario 3: Panggilan Pelayan di Meja 03
  INSERT INTO public.service_requests(table_id, kind, status)
    SELECT table_id, 'waiter', 'pending' FROM public.tables WHERE table_number = 3;

  -- Skenario 4: Transaksi Selesai & Lunas (Agar Dashboard & Laporan Langsung Ada Grafik Omzet & Riwayat Pembayaran)
  DECLARE
    s3 bigint;
    o3 bigint;
  BEGIN
    INSERT INTO public.table_sessions(table_id, guest_count, customer_name, opened_at, closed_at)
      SELECT table_id, 2, 'Rizky Pratama', now() - interval '2 hours', now() - interval '1 hour'
      FROM public.tables WHERE table_number = 1
      RETURNING session_id INTO s3;

    INSERT INTO public.orders(order_number, session_id, order_source, order_status, total, ready_at, served_at, created_at)
      VALUES ('A1000', s3, 'qr', 'served', 65000, now() - interval '100 minutes', now() - interval '90 minutes', now() - interval '2 hours')
      RETURNING order_id INTO o3;

    IF p_rawon IS NOT NULL THEN
      INSERT INTO public.order_items(order_id, product_id, product_name, unit_price, quantity)
        VALUES (o3, p_rawon, 'Nasi Rawon Daging', 26000, 2);
    END IF;
    IF p_teh IS NOT NULL THEN
      INSERT INTO public.order_items(order_id, product_id, product_name, unit_price, quantity)
        VALUES (o3, p_teh, 'Teh Manis/Tawar', 8000, 1);
    END IF;

    INSERT INTO public.payments(transaction_code, order_id, method, amount, cash_received, change_amount, status, paid_at, created_at)
      VALUES ('TRX-' || to_char(now(), 'YYYYMMDD') || '-001', o3, 'qris', 65000, 65000, 0, 'paid', now() - interval '1 hour', now() - interval '1 hour');
  END;
END $$;
