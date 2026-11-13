-- =====================================================
-- seed.sql (Dijalankan via Supabase db reset / seed)
-- =====================================================

-- 1. KATEGORI MENU
insert into categories (name) values
 ('Menu Nusantara'), ('Sambelan'), ('Pendamping'), ('Ala Carte'),
 ('Teh'), ('Kopi'), ('Wedang'), ('Lainnya')
on conflict (name) do nothing;

-- 2. DAFTAR PRODUK MAKANAN & MINUMAN
insert into products (category_id, product_code, name, price)
select c.category_id, v.code, v.name, v.price
from (values
 -- TEH
 ('Teh','TEH001','Teh Manis/Tawar',8000),
 ('Teh','TEH002','Teh Jumbo Manis/Tawar',12000),
 ('Teh','TEH003','Teh Jeruk Nipis',15000),
 ('Teh','TEH004','Teh Kampul',15000),
 ('Teh','TEH005','Nipis Telang Panas',16000),
 ('Teh','TEH006','Nipis Telang Es',14000),
 ('Teh','TEH007','Kombucha',15000),
 -- KOPI
 ('Kopi','KOP001','Kopi Hitam Panas',11000),
 ('Kopi','KOP002','Kopi Hitam Es',15000),
 ('Kopi','KOP003','Kopi Susu Panas',12000),
 ('Kopi','KOP004','Kopi Susu Es',16000),
 ('Kopi','KOP005','Kopi Susu Jahe Panas',14000),
 ('Kopi','KOP006','Kopi Susu Jahe Es',18000),
 -- WEDANG
 ('Wedang','WDG005','Jahe Nipis Panas',17000),
 ('Wedang','WDG006','Jahe Nipis Es',20000),
 ('Wedang','WDG007','Jamon Panas',17000),
 ('Wedang','WDG008','Jamon Es',20000),
 -- LAINNYA
 ('Lainnya','LL001','Air Mineral',5000),
 ('Lainnya','LL002','Es Batu',2000),
 -- MENU NUSANTARA
 ('Menu Nusantara','MN001','Nasi Rawon Daging',26000),
 ('Menu Nusantara','MN002','Nasi Rawon Otot',26000),
 ('Menu Nusantara','MN003','Nasi Rawon Empal',26000),
 ('Menu Nusantara','MN004','Nasi Rawon Campur',32000),
 ('Menu Nusantara','MN005','Nasi Rawon Spesial',36000),
 ('Menu Nusantara','MN006','Rawon Tanpa Nasi',21000),
 ('Menu Nusantara','MN007','Nasi Sop Ayam Goreng (1/8 Potong)',25000),
 ('Menu Nusantara','MN008','Nasi Sop Empal',30000),
 ('Menu Nusantara','MN009','Nasi Sop Paru',26000),
 ('Menu Nusantara','MN010','Nasi Sop Telur Goreng',20000),
 ('Menu Nusantara','MN011','Nasi Sop Otot',28000),
 ('Menu Nusantara','MN012','Sop Tanpa Nasi',15000),
 ('Menu Nusantara','MN013','Nasi Pecel Ayam Goreng (1/8 Potong)',25000),
 ('Menu Nusantara','MN014','Nasi Pecel Empal',30000),
 ('Menu Nusantara','MN015','Nasi Pecel Paru',26000),
 ('Menu Nusantara','MN016','Nasi Pecel Telur Goreng',20000),
 ('Menu Nusantara','MN017','Nasi Pecel Telur Bali',21000),
 ('Menu Nusantara','MN018','Pecel Tanpa Nasi',15000),
 ('Menu Nusantara','MN019','Nasi Campur',25000),
 ('Menu Nusantara','MN020','Nasi Sambel Cecek/Jeroan',18000),
 ('Menu Nusantara','MN021','Telur Bali',8000),
 ('Menu Nusantara','MN022','Lodeh',16000),
 ('Menu Nusantara','MN023','Sayur Asem',16000),
 ('Menu Nusantara','MN024','Nasi Opor',25000),
 ('Menu Nusantara','MN025','Opor Ayam Tanpa Nasi',20000),
 -- PENDAMPING
 ('Pendamping','PD001','Nasi Putih',7000),
 ('Pendamping','PD002','Daging Rawon',18000),
 ('Pendamping','PD003','Empal Goreng',18000),
 ('Pendamping','PD004','Paru Goreng',12000),
 ('Pendamping','PD005','Ayam Goreng (1/4)',17000),
 ('Pendamping','PD006','Otot',15000),
 ('Pendamping','PD007','Kuah Rawon',5000),
 ('Pendamping','PD008','Telur Goreng (Dadar/Ceplok)',6000),
 ('Pendamping','PD009','Telur Asin',9000),
 ('Pendamping','PD010','Tahu/Tempe (2 Pcs)',5000),
 ('Pendamping','PD011','Perkedel (3 Pcs)',5000),
 ('Pendamping','PD012','Kerupuk (3 Pcs)',2000),
 ('Pendamping','PD013','Kerupuk Udang (2 Pcs)',5000),
 ('Pendamping','PD014','Peyek',5000),
 -- ALA CARTE
 ('Ala Carte','AL001','Nasi Putih',7000),
 ('Ala Carte','AL002','Empal Goreng',18000),
 ('Ala Carte','AL003','Paru Goreng',12000),
 ('Ala Carte','AL004','Ayam Goreng',18000),
 ('Ala Carte','AL005','Otot',15000),
 ('Ala Carte','AL006','Ikan Pe Goreng',18000),
 ('Ala Carte','AL007','4T',13000),
 ('Ala Carte','AL008','Kuah Rawon',5000),
 ('Ala Carte','AL009','Telur Goreng (Dadar/Ceplok)',6000),
 ('Ala Carte','AL010','Usus Goreng',10000),
 ('Ala Carte','AL011','Ati Ampela',12000),
 -- SAMBELAN
 ('Sambelan','SMB001','Nasi Lele Goreng',26000),
 ('Sambelan','SMB002','Nasi Ayam Goreng (1/4)',26000),
 ('Sambelan','SMB003','Nasi Empal Goreng',26000),
 ('Sambelan','SMB004','Nasi Paru Goreng',26000),
 ('Sambelan','SMB005','Nasi 4T',20000),
 ('Sambelan','SMB006','Nasi Sambelan Telur',16000),
 ('Sambelan','SMB007','Nasi Ikan Pe Goreng',25000),
 ('Sambelan','SMB008','Nasi Ati Ampela',20000),
 ('Sambelan','SMB009','Nasi Usus Goreng',20000)
) as v(cat, code, name, price)
join categories c on c.name = v.cat
on conflict (product_code) do nothing;

-- 3. MEJA RESTORAN DINE-IN (Meja 1 s/d 10)
insert into tables (table_number, qr_token, is_active)
values
 (1, 'tbl_token_meja_01', true),
 (2, 'tbl_token_meja_02', true),
 (3, 'tbl_token_meja_03', true),
 (4, 'tbl_token_meja_04', true),
 (5, 'tbl_token_meja_05', true),
 (6, 'tbl_token_meja_06', true),
 (7, 'tbl_token_meja_07', true),
 (8, 'tbl_token_meja_08', true),
 (9, 'tbl_token_meja_09', true),
 (10, 'tbl_token_meja_10', true)
on conflict (table_number) do nothing;
