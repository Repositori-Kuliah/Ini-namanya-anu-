-- =====================================================================
-- seed_demo.sql - data tambahan untuk testing (jalankan SETELAH seed.sql)
-- Menu & meja memakai seed.sql milikmu; file ini TIDAK mengubahnya.
-- Akun demo (password semua: password123):
--   admin@rawongusti.test   -> admin
--   kasir@rawongusti.test   -> staff (kasir/waiter)
--   dapur@rawongusti.test   -> kitchen
-- =====================================================================
select _create_user('admin@rawongusti.test','password123','Arif Gusti','admin');
select _create_user('kasir@rawongusti.test','password123','Dewi Sartika','staff');
select _create_user('dapur@rawongusti.test','password123','Chef Sam R.','kitchen');
update profiles set terminal='KDS Stasiun Panas' where email='dapur@rawongusti.test';
update profiles set terminal='Terminal #02' where email='admin@rawongusti.test';

-- Tambahan pesanan (harga dari tabel extras, bukan dari klien)
insert into extras(name,description,price) values
 ('Kerupuk Udang Jumbo','Renyah gurih, ukuran 20cm',4000),
 ('Ekstra Sambal Terasi Gurih','Cobek kecil sambal matang uleg',3000),
 ('Sambal Kecap Rawit','Kecap manis kental & irisan rawit hijau',2500),
 ('Nasi Putih Hangat Tambahan','Beras pandan wangi pulen, 1 porsi',5000)
on conflict(name) do nothing;

-- Tandai beberapa menu favorit/signature + deskripsi singkat untuk tampilan
update products set is_signature=true, is_favorite=true, description='Kuah kluwek pekat gurih dengan irisan daging sapi empuk, tauge pendek, dan sambal terasi.' where product_code='MN001';
update products set is_favorite=true, description='Kuah kluwek rempah dengan campuran daging, otot, dan jeroan pilihan.' where product_code='MN004';
update products set is_signature=true, description='Rawon dengan daging, empal, paru, dan telur asin - paket lengkap andalan Gusti.' where product_code='MN005';
update products set is_favorite=true where product_code in ('MN013','MN019','SMB002','TEH001','KOP004');

-- Bahan baku
insert into ingredients(code,name,category,current_stock,minimum_stock,unit,cost_per_unit,supplier,linked_menu_items) values
 ('BAHAN-01','Daging Sengkel Sapi','Daging & Unggas',3.5,5,'kg',125000,'UD Jagal Pegirian','{"Nasi Rawon Daging","Nasi Rawon Campur"}'),
 ('BAHAN-02','Kluwek Matang Pilihan','Bumbu & Rempah',1.2,2,'kg',35000,'Pasar Keputran','{"Nasi Rawon Daging","Kuah Rawon"}'),
 ('BAHAN-03','Beras Pandan Wangi','Beras & Pokok',28,10,'kg',16000,'Toko Beras Makmur','{"Nasi Putih"}'),
 ('BAHAN-04','Telur Bebek Asin Brebes','Sayur & Pelengkap',18,25,'butir',4200,'Peternakan Brebes Masir','{"Telur Asin"}'),
 ('BAHAN-05','Tempe Kedelai Segar','Sayur & Pelengkap',0,10,'papan',3000,'Pengrajin Tempe Sukun','{"Tahu/Tempe (2 Pcs)"}'),
 ('BAHAN-06','Daging Ayam Kampung','Daging & Unggas',8,4,'ekor',45000,'Peternakan Lawang','{"Ayam Goreng (1/4)","Nasi Opor"}'),
 ('BAHAN-07','Paru & Jeroan Sapi','Daging & Unggas',2,2.5,'kg',70000,'UD Jagal Pegirian','{"Paru Goreng","Nasi Sop Paru"}'),
 ('BAHAN-08','Tauge Pendek Rawon','Sayur & Pelengkap',1.5,3,'kg',12000,'Pasar Pabean','{"Nasi Rawon Daging"}'),
 ('BAHAN-09','Kopi Robusta Bubuk','Minuman',6,3,'kg',90000,'Kebun Kopi Dampit','{"Kopi Susu Es","Kopi Hitam Panas"}'),
 ('BAHAN-10','Teh Melati Solo','Minuman',6,3,'pack',15000,'CV Teh Wangi Nusantara','{"Teh Manis/Tawar"}'),
 ('BAHAN-11','Gula Tebu Alami','Minuman',15,5,'kg',17500,'Pabrik Gula Kebonagung','{"Teh Manis/Tawar","Kopi Susu Es"}')
on conflict(code) do nothing;

-- Contoh pesanan agar POS/KDS tidak kosong saat pertama dibuka
do $$
declare s1 bigint; s2 bigint; s3 bigint; o bigint; kasir uuid;
begin
  if exists(select 1 from orders) then return; end if;
  select id into kasir from profiles where email='kasir@rawongusti.test';
  insert into table_sessions(table_id,guest_count,customer_name) select table_id,3,'Nadia' from tables where table_number=2 returning session_id into s1;
  insert into table_sessions(table_id,guest_count,customer_name) select table_id,4,'Rina' from tables where table_number=5 returning session_id into s2;
  insert into table_sessions(table_id,guest_count,customer_name) select table_id,2,'Fajar' from tables where table_number=9 returning session_id into s3;

  insert into orders(order_number,session_id,order_source,order_status,payment_preference,served_at) values('A0001',s1,'qr','served','cashier',now()) returning order_id into o;
  perform _insert_items(o, (select jsonb_agg(jsonb_build_object('id',product_id,'qty',q)) from (values('MN001',2),('PD001',2),('TEH001',3)) v(c,q) join products on product_code=c));
  update orders set total=bill_total((select sum(subtotal) from order_items where order_id=o)) where order_id=o;

  insert into orders(order_number,session_id,order_source,order_status,created_by) values('A0002',s2,'staff','preparing',kasir) returning order_id into o;
  perform _insert_items(o, (select jsonb_agg(jsonb_build_object('id',product_id,'qty',q,'note',n)) from (values('MN004',3,'Pedas sedang'),('KOP004',2,null)) v(c,q,n) join products on product_code=c));
  update orders set total=bill_total((select sum(subtotal) from order_items where order_id=o)) where order_id=o;

  insert into orders(order_number,session_id,order_source,order_status,payment_preference,ready_at) values('A0003',s3,'qr','ready','qris',now()) returning order_id into o;
  perform _insert_items(o, (select jsonb_agg(jsonb_build_object('id',product_id,'qty',q)) from (values('MN002',2),('KOP002',2)) v(c,q) join products on product_code=c));
  update orders set total=bill_total((select sum(subtotal) from order_items where order_id=o)) where order_id=o;
  perform setval('order_no_seq',3);
end $$;
