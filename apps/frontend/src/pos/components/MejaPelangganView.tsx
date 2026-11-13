import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TableItem } from '../types';

const MejaPelangganViewInner: React.FC = () => {
  const {
    tables,
    selectedTableId,
    setSelectedTableId,
    setActiveView,
    setOrderTableNumber,
    setOrderCustomerName,
    setSelectedBillId,
    openReceiptModal,
    bills,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'terisi' | 'checkout' | 'kosong'>('all');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Filtered tables
  const filteredTables = tables.filter((table) => {
    const matchesSearch =
      table.number.includes(searchQuery) ||
      (table.name && table.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      table.statusLabel.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'all') return true;
    if (filterStatus === 'kosong') return table.status === 'kosong';
    if (filterStatus === 'checkout') return table.status === 'checkout';
    if (filterStatus === 'terisi') {
      return table.status !== 'kosong';
    }
    return true;
  });

  const selectedTable =
    tables.find((t) => t.number === selectedTableId) ||
    tables.find((t) => t.status !== 'kosong') ||
    tables[0];

  const handleSelectTable = (table: TableItem) => {
    setSelectedTableId(table.number);
    setMobileDrawerOpen(true);
  };

  const handleBukaPesanan = (tableNumber: string) => {
    setOrderTableNumber(tableNumber);
    setOrderCustomerName('');
    setMobileDrawerOpen(false);
    setActiveView('pesanan-baru');
  };

  const handleBukaCheckout = (tableNumber: string) => {
    const matchedBill = bills.find((b) => b.tableNumber === tableNumber);
    if (matchedBill) {
      setSelectedBillId(matchedBill.id);
    }
    setMobileDrawerOpen(false);
    setActiveView('checkout');
  };

  const handleViewReceipt = () => {
    if (!selectedTable) return;
    const matchedBill = bills.find((b) => b.tableNumber === selectedTable.number) || bills[0];
    if (matchedBill) {
      openReceiptModal(matchedBill);
    }
  };

  // Metrics counts
  const occupiedCount = tables.filter((t) => t.status !== 'kosong').length;
  const emptyCount = tables.filter((t) => t.status === 'kosong').length;
  const checkoutCount = tables.filter((t) => t.status === 'checkout').length;
  const readyCount = tables.filter((t) => t.status === 'siap_diantar').length;
  const totalGuests = tables.reduce(
    (acc, t) => acc + (t.status !== 'kosong' ? t.guestCount || 2 : 0),
    0
  );

  return (
    <div className="flex flex-col w-full p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1540px] mx-auto pb-24 md:pb-8">
      {/* Top Header & Action Bar (Aligned with DashboardView) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#3d1018] tracking-tight">
            Meja &amp; Pelanggan
          </h1>
        </div>
      </div>

      {/* 4 Operational Metric Cards (Calm, Editorial & Consistent with Dashboard) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Meja Terisi */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-[#ebe8e3] flex flex-col justify-between hover:border-[#d8d1c7] transition-colors">
          <div className="flex items-center justify-between text-[#524344] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#524344]">
              Meja Terisi
            </span>
            <span className="w-8 h-8 rounded-full bg-[#f0ede9] flex items-center justify-center text-[#3d1018]">
              <span className="material-symbols-outlined text-[18px]">table_restaurant</span>
            </span>
          </div>
          <div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#3d1018] tabular-nums">
              {occupiedCount}
              <span className="text-sm sm:text-base font-sans text-[#847374] font-medium ml-1">
                / {tables.length}
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2: Tamu Bersantap */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-[#ebe8e3] flex flex-col justify-between hover:border-[#d8d1c7] transition-colors">
          <div className="flex items-center justify-between text-[#524344] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#524344]">
              Tamu Aktif
            </span>
            <span className="w-8 h-8 rounded-full bg-[#f0ede9] flex items-center justify-center text-[#3d1018]">
              <span className="material-symbols-outlined text-[18px]">groups</span>
            </span>
          </div>
          <div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#3d1018] tabular-nums">
              {totalGuests}
              <span className="text-sm font-sans text-[#847374] font-medium ml-1">orang</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Siap Diantar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-[#ebe8e3] flex flex-col justify-between hover:border-[#d8d1c7] transition-colors">
          <div className="flex items-center justify-between text-[#524344] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#524344]">
              Siap Diantar
            </span>
            <span className="w-8 h-8 rounded-full bg-[#f0ede9] flex items-center justify-center text-[#3d1018]">
              <span className="material-symbols-outlined text-[18px]">room_service</span>
            </span>
          </div>
          <div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#3d1018] tabular-nums">
              {readyCount}
              <span className="text-sm font-sans text-[#847374] font-medium ml-1">meja</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Minta Checkout */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-[#ebe8e3] flex flex-col justify-between hover:border-[#d8d1c7] transition-colors">
          <div className="flex items-center justify-between text-[#524344] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#524344]">
              Minta Checkout
            </span>
            <span className="w-8 h-8 rounded-full bg-[#f0ede9] flex items-center justify-center text-[#3d1018]">
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            </span>
          </div>
          <div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#3d1018] tabular-nums">
              {checkoutCount}
              <span className="text-sm font-sans text-[#847374] font-medium ml-1">meja</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Segmented Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#847374] text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor meja, nama pelanggan, atau status..."
            className="w-full h-10 pl-9 pr-8 rounded-xl bg-white text-[#1c1c19] placeholder-[#847374] text-xs border border-[#ebe8e3] outline-none focus:border-[#3d1018] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Bersihkan pencarian"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#f0ede9] flex items-center justify-center text-[#524344] hover:text-[#1c1c19] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[13px]">close</span>
            </button>
          )}
        </div>

        {/* Clean Segmented Control (Aligned with DashboardView Presets) */}
        <div className="inline-flex items-center bg-white p-1 rounded-xl border border-[#ebe8e3] shadow-xs overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'Semua Meja', count: tables.length },
            { id: 'terisi', label: 'Terisi', count: occupiedCount },
            { id: 'checkout', label: 'Minta Checkout', count: checkoutCount },
            { id: 'kosong', label: 'Kosong', count: emptyCount },
          ].map((item) => {
            const active = filterStatus === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilterStatus(item.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#3d1018] text-white shadow-xs'
                    : 'text-[#524344] hover:text-[#1c1c19] hover:bg-[#f6f3ee]'
                }`}
              >
                {item.label} ({item.count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Layout: Tables Grid + Desktop Sticky Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Tables Grid (8 cols on desktop) */}
        <div className="lg:col-span-8">
          {filteredTables.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#ebe8e3]">
              <span className="material-symbols-outlined text-4xl text-[#847374] mb-2 block">
                table_restaurant
              </span>
              <p className="font-serif text-lg font-bold text-[#1c1c19]">Tidak ada meja ditemukan</p>
              <p className="text-xs text-[#524344] mt-1">
                Silakan sesuaikan kata kunci pencarian atau ubah filter status di atas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredTables.map((table) => {
                const isSelected = selectedTable?.number === table.number;
                const isKosong = table.status === 'kosong';
                const isCheckout = table.status === 'checkout';
                const isSiap = table.status === 'siap_diantar';

                return (
                  <div
                    key={table.id}
                    onClick={() => handleSelectTable(table)}
                    className={`rounded-2xl p-4 transition-all cursor-pointer flex flex-col justify-between min-h-[154px] relative bg-white border ${
                      isSelected
                        ? 'border-[#3d1018] ring-1 ring-[#3d1018] shadow-sm'
                        : 'border-[#ebe8e3] hover:border-[#d8d1c7] shadow-xs hover:shadow-sm'
                    }`}
                  >
                    {/* Top Row: Plaque Table Number & Unboxed Status */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#847374]">
                          MEJA
                        </span>
                        <span
                          className={`font-serif text-2xl sm:text-3xl font-bold tabular-nums leading-none ${
                            isKosong ? 'text-[#847374]' : 'text-[#3d1018]'
                          }`}
                        >
                          {table.number}
                        </span>
                      </div>

                      {/* Status Text (No Heavy Pill Sandwiches) */}
                      {isKosong ? (
                        <span className="text-[11px] font-medium text-[#847374]">Kosong</span>
                      ) : isCheckout ? (
                        <span className="text-[11px] font-bold text-[#994703] flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">receipt_long</span>
                          <span>Checkout</span>
                        </span>
                      ) : isSiap ? (
                        <span className="text-[11px] font-bold text-[#994703] flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">room_service</span>
                          <span>Siap Antar</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-[#524344]">
                          {table.statusLabel}
                        </span>
                      )}
                    </div>

                    {/* Middle Info */}
                    <div className="my-2">
                      {isKosong ? (
                        <>
                          <p className="font-semibold text-xs text-[#1c1c19]">Tersedia</p>
                          <p className="text-[11px] text-[#847374] mt-0.5">
                            Kapasitas 4 orang
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-xs sm:text-sm text-[#1c1c19] truncate">
                            {table.name || 'Pelanggan'} {table.guestCount ? `• ${table.guestCount} org` : ''}
                          </p>
                          <p className="text-[11px] text-[#524344] mt-0.5 truncate">
                            {table.billId ? `Bill #${table.billId} • ` : ''}
                            {table.items ? `${table.items.length} menu` : 'Sedang bersantap'}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Bottom Row */}
                    <div className="pt-2 border-t border-[#f0ede9] flex items-center justify-between text-xs">
                      {isKosong ? (
                        <div className="w-full text-center">
                          <span className="text-[11px] text-[#847374] font-medium">Siap buka order</span>
                        </div>
                      ) : (
                        <>
                          <span className="text-[11px] text-[#847374] truncate max-w-[90px]">
                            {table.infoSubtitle || 'Dine-in'}
                          </span>
                          <span className="font-serif font-bold text-sm text-[#3d1018] tabular-nums">
                            {table.totalFormatted || 'Rp 0'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Selected Table Detail Panel (Desktop 4 cols) */}
        <div className="hidden lg:flex lg:col-span-4 bg-white rounded-2xl shadow-sm border border-[#ebe8e3] p-5 flex-col gap-4 sticky top-20">
          {/* Header Panel */}
          <div className="flex items-start justify-between border-b border-[#ebe8e3] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#524344] uppercase tracking-wider">
                  Detail Meja
                </span>
                <span className="text-[#847374]">•</span>
                <span className="text-xs font-semibold text-[#3d1018]">
                  {selectedTable.statusLabel}
                </span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#3d1018] mt-1">
                Meja {selectedTable.number}
              </h2>
              <p className="text-xs text-[#524344] mt-0.5">
                {selectedTable.name
                  ? `${selectedTable.name} • ${selectedTable.guestCount || 2} tamu`
                  : 'Kapasitas 4 orang'}
              </p>
            </div>
          </div>

          {selectedTable.status === 'kosong' ? (
            <div className="py-8 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#f6f3ee] flex items-center justify-center text-[#847374]">
                <span className="material-symbols-outlined text-[28px]">table_restaurant</span>
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#1c1c19]">Meja Ini Kosong</h3>
                <p className="text-xs text-[#524344] max-w-xs mt-1">
                  Siap menerima pelanggan baru untuk pesanan santap di tempat.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleBukaPesanan(selectedTable.number)}
                className="w-full h-11 mt-2 rounded-xl bg-[#3d1018] hover:bg-[#58252c] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Buka Pesanan untuk Meja {selectedTable.number}</span>
              </button>
            </div>
          ) : (
            <>
              {/* Timeline / Activity Status */}
              <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#faf7f2] border border-[#ebe8e3] text-xs">
                <div className="flex items-center gap-2 text-[#524344]">
                  <span className="material-symbols-outlined text-[16px] text-[#994703]">
                    schedule
                  </span>
                  <span className="font-medium">
                    {selectedTable.infoSubtitle || 'Aktif bersantap'}
                  </span>
                </div>
                <span className="font-mono text-[11px] font-bold text-[#847374]">
                  {selectedTable.billId ? `Bill #${selectedTable.billId}` : 'Pesanan Aktif'}
                </span>
              </div>

              {/* Items Summary */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs text-[#524344]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#524344]">
                    Rincian Menu
                  </span>
                  <span>{selectedTable.items?.length || 4} Item</span>
                </div>
                <div className="divide-y divide-[#ebe8e3] text-xs max-h-48 overflow-y-auto pr-1">
                  {(
                    selectedTable.items || [
                      { name: '2x Rawon Daging Spesial', price: 96000 },
                      { name: '2x Nasi Putih Wangi', price: 16000 },
                      { name: '2x Telur Asin Brebes', price: 18000 },
                      { name: '2x Es Sinom Tradisional', price: 30000 },
                    ]
                  ).map((item, idx) => (
                    <div key={idx} className="py-2 flex justify-between items-center">
                      <span className="text-[#1c1c19] truncate">{item.name}</span>
                      <span className="font-semibold text-[#1c1c19] tabular-nums shrink-0 ml-2">
                        Rp {item.price.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Price Section */}
              <div className="flex items-baseline justify-between pt-3 border-t border-[#ebe8e3]">
                <span className="text-xs font-bold text-[#524344] uppercase tracking-wider">
                  Total Tagihan
                </span>
                <span className="font-serif text-2xl font-bold text-[#3d1018] tabular-nums">
                  {selectedTable.totalFormatted || 'Rp 207.900'}
                </span>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleViewReceipt}
                  className="h-11 rounded-xl bg-white border border-[#ebe8e3] hover:bg-[#f6f3ee] text-[#1c1c19] font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">receipt</span>
                  <span>Ringkasan Bill</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBukaCheckout(selectedTable.number)}
                  className="h-11 rounded-xl bg-[#3d1018] hover:bg-[#58252c] text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">point_of_sale</span>
                  <span>Buka Checkout</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Drawer (Bottom Sheet) */}
      {mobileDrawerOpen && (
        <>
          <div
            onClick={() => setMobileDrawerOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 lg:hidden"
          ></div>
          <div className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-3xl shadow-2xl p-5 pb-8 border-t border-[#ebe8e3] max-h-[85vh] overflow-y-auto lg:hidden animate-in slide-in-from-bottom duration-200">
            <div className="w-10 h-1 bg-[#ebe8e3] rounded-full mx-auto mb-3"></div>

            <div className="flex items-start justify-between border-b border-[#ebe8e3] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-2xl font-bold text-[#3d1018]">
                    Meja {selectedTable.number}
                  </h2>
                  <span className="text-xs font-semibold text-[#524344]">
                    ({selectedTable.statusLabel})
                  </span>
                </div>
                <p className="text-xs text-[#524344] mt-0.5">
                  {selectedTable.name
                    ? `${selectedTable.name} • ${selectedTable.guestCount || 2} tamu`
                    : 'Kapasitas 4 orang'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Tutup detail meja"
                className="w-8 h-8 rounded-full bg-[#f0ede9] flex items-center justify-center text-[#524344] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {selectedTable.status === 'kosong' ? (
              <div className="py-6 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#f6f3ee] flex items-center justify-center text-[#847374]">
                  <span className="material-symbols-outlined text-[28px]">table_restaurant</span>
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#1c1c19]">Meja Ini Kosong</h3>
                  <p className="text-xs text-[#524344] mt-0.5">
                    Buka pesanan baru untuk meja {selectedTable.number}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleBukaPesanan(selectedTable.number)}
                  className="w-full h-11 mt-2 rounded-xl bg-[#3d1018] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  <span>Buka Pesanan untuk Meja Ini</span>
                </button>
              </div>
            ) : (
              <div className="py-3 flex flex-col gap-3">
                <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#faf7f2] border border-[#ebe8e3] text-xs">
                  <div className="flex items-center gap-2 text-[#524344]">
                    <span className="material-symbols-outlined text-[16px] text-[#994703]">
                      schedule
                    </span>
                    <span>{selectedTable.infoSubtitle || 'Dine-in'}</span>
                  </div>
                  <span className="font-mono text-[#847374]">
                    {selectedTable.billId ? `Bill #${selectedTable.billId}` : 'Pesanan Aktif'}
                  </span>
                </div>

                <div className="divide-y divide-[#ebe8e3] text-xs py-1">
                  {(
                    selectedTable.items || [
                      { name: '2x Rawon Daging Spesial', price: 96000 },
                      { name: '2x Nasi Putih Wangi', price: 16000 },
                      { name: '2x Telur Asin Brebes', price: 18000 },
                      { name: '2x Es Sinom Tradisional', price: 30000 },
                    ]
                  ).map((item, idx) => (
                    <div key={idx} className="py-2 flex justify-between items-center">
                      <span className="text-[#1c1c19] truncate">{item.name}</span>
                      <span className="font-semibold text-[#1c1c19] tabular-nums shrink-0 ml-2">
                        Rp {item.price.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-baseline justify-between pt-2 border-t border-[#ebe8e3]">
                  <span className="text-xs font-bold text-[#524344] uppercase tracking-wider">
                    Total Tagihan
                  </span>
                  <span className="font-serif text-xl font-bold text-[#3d1018] tabular-nums">
                    {selectedTable.totalFormatted || 'Rp 207.900'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleViewReceipt}
                    className="h-11 rounded-xl bg-white border border-[#ebe8e3] text-[#1c1c19] font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">receipt</span>
                    <span>Ringkasan Bill</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBukaCheckout(selectedTable.number)}
                    className="h-11 rounded-xl bg-[#3d1018] text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">point_of_sale</span>
                    <span>Buka Checkout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export const MejaPelangganView: React.FC = () => {
  const { tables } = useApp();
  if (!tables.length) {
    return (
      <div className="p-10 text-center text-sm text-[#524344]">
        Belum ada meja aktif. Jalankan supabase/seed.sql terlebih dahulu.
      </div>
    );
  }
  return <MejaPelangganViewInner />;
};
