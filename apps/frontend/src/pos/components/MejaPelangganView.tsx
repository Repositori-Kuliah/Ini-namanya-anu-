import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TableItem } from '../types';
import { useLockBodyScroll } from '../../lib/useLockBodyScroll';

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
    clearTableSession,
    bills,
    showToast,
    pendingQrOrders,
    confirmCustomerOrder,
    rejectCustomerOrder,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'terisi' | 'tersedia'>('all');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Kunci scroll halaman belakang saat modal detail meja / konfirmasi terbuka
  useLockBodyScroll(mobileDrawerOpen || showConfirmModal);

  // Filtered tables (Hanya 3 status: Semua Meja, Terisi, Tersedia)
  const filteredTables = tables.filter((table) => {
    const matchesSearch =
      table.number.includes(searchQuery) ||
      (table.name && table.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      table.statusLabel.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'all') return true;
    if (filterStatus === 'tersedia') return table.status === 'kosong';
    if (filterStatus === 'terisi') return table.status !== 'kosong';
    return true;
  });

  const selectedTable =
    tables.find((t) => t.number === selectedTableId) ||
    tables.find((t) => t.status !== 'kosong') ||
    tables[0];

  // HANYA ada nilai jika meja ini memiliki pesanan dari self-order yang menunggu verifikasi kasir
  const pendingOrderForSelectedTable = selectedTable
    ? pendingQrOrders.find((ord) => ord.tableNumber === selectedTable.number)
    : null;

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

  return (
    <div className="flex flex-col w-full p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1540px] mx-auto pb-4 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#3d1018] tracking-tight">
            Meja &amp; Pelanggan
          </h1>
        </div>
      </div>

      {/* Search & Segmented Filter Bar (3 Tab Filter: Semua Meja, Terisi, Tersedia) */}
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

        {/* Clean Segmented Control: 3 Status Saja (Semua Meja, Terisi, Tersedia) */}
        <div className="inline-flex items-center bg-white p-1 rounded-xl border border-[#ebe8e3] shadow-xs overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'Semua Meja', count: tables.length },
            { id: 'terisi', label: 'Terisi', count: occupiedCount },
            { id: 'tersedia', label: 'Tersedia', count: emptyCount },
          ].map((item) => {
            const active = filterStatus === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilterStatus(item.id as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
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
                const hasPendingQr = pendingQrOrders.some((p) => p.tableNumber === table.number);

                return (
                  <div
                    key={table.id}
                    onClick={() => handleSelectTable(table)}
                    className={`rounded-2xl p-4 transition-all cursor-pointer flex flex-col justify-between min-h-[148px] relative bg-white border ${
                      isSelected
                        ? 'border-[#3d1018] ring-2 ring-[#3d1018]/25 shadow-md'
                        : 'border-[#ebe8e3] hover:border-[#d8d1c7] shadow-xs hover:shadow-sm'
                    }`}
                  >
                    {/* Badge Notifikasi Self-Order Menunggu Konfirmasi */}
                    {hasPendingQr && (
                      <span className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[#15803d] text-[10px] font-bold border border-emerald-300 shadow-2xs animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#15803d]" />
                        Self-Order
                      </span>
                    )}
                    {/* Tengah: Nomor Meja Besar & Tegas */}
                    <div className="flex flex-col items-center justify-center flex-1 py-3 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#847374] mb-0.5">
                        MEJA
                      </span>
                      <span
                        className={`font-serif text-3xl sm:text-4xl font-bold tabular-nums leading-none ${
                          isKosong ? 'text-[#847374]' : 'text-[#3d1018]'
                        }`}
                      >
                        {table.number}
                      </span>
                    </div>

                    {/* Bawah: Status Terisi vs Tersedia (Center) */}
                    <div className="pt-2.5 border-t border-[#f0ede9] text-center">
                      <span
                        className={`text-xs font-bold ${
                          isKosong ? 'text-[#847374]' : 'text-[#3d1018]'
                        }`}
                      >
                        {isKosong ? 'Tersedia' : 'Terisi'}
                      </span>
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
              <span className="text-[11px] font-bold text-[#524344] uppercase tracking-wider block">
                Detail Meja
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#3d1018] mt-1">
                Meja {selectedTable.number}
              </h2>
            </div>
            {selectedTable.status !== 'kosong' && (
              <button
                type="button"
                onClick={() => clearTableSession(selectedTable.number)}
                className="px-2.5 py-1 text-[11px] font-semibold text-stone-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Kosongkan meja ini"
              >
                Kosongkan Meja
              </button>
            )}
          </div>

          {selectedTable.status === 'kosong' ? (
            <div className="py-8 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#f6f3ee] flex items-center justify-center text-[#847374]">
                <span className="material-symbols-outlined text-[28px]">table_restaurant</span>
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#1c1c19]">Meja Ini Tersedia</h3>
                <p className="text-xs text-[#524344] max-w-xs mt-1">
                  Siap menerima pesanan baru untuk meja {selectedTable.number}.
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
              {/* Items Summary (Rincian Menu) */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs text-[#524344]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#524344]">
                    Rincian Menu
                  </span>
                  <span>{selectedTable.items?.length || 0} Item</span>
                </div>
                <div className="divide-y divide-[#ebe8e3] text-xs max-h-56 overflow-y-auto pr-1">
                  {(selectedTable.items && selectedTable.items.length > 0) ? (
                    selectedTable.items.map((item, idx) => (
                      <div key={idx} className="py-2 flex justify-between items-center">
                        <span className="text-[#1c1c19] truncate">{item.name}</span>
                        <span className="font-semibold text-[#1c1c19] tabular-nums shrink-0 ml-2">
                          Rp {item.price.toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-xs text-[#847374] italic">
                      Belum ada rincian pesanan tercatat
                    </div>
                  )}
                </div>
              </div>

              {/* Total Price Section */}
              <div className="flex items-baseline justify-between pt-3 border-t border-[#ebe8e3]">
                <span className="text-xs font-bold text-[#524344] uppercase tracking-wider">
                  Total Tagihan
                </span>
                <span className="font-serif text-2xl font-bold text-[#3d1018] tabular-nums">
                  {selectedTable.totalFormatted || 'Rp 0'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-1">
                {/* HANYA MUNCUL JIKA PESANAN BERASAL DARI SELF-ORDER (QR) DAN MENUNGGU KONFIRMASI */}
                {pendingOrderForSelectedTable && (
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    className="w-full h-11 rounded-xl bg-[#15803d] hover:bg-[#166534] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all active:scale-[0.99]"
                  >
                    <span className="material-symbols-outlined text-[18px] animate-pulse">
                      notifications_active
                    </span>
                    <span>Verifikasi Pesanan Self-Order</span>
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2.5">
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
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Detail Meja Pop-up Modal */}
      {mobileDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs lg:hidden animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl shadow-2xl p-5 border border-[#ebe8e3] max-w-sm sm:max-w-md w-full max-h-[90vh] overflow-y-auto overscroll-contain animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-[#ebe8e3] pb-3">
              <div>
                <span className="text-[11px] font-bold text-[#524344] uppercase tracking-wider block">
                  Detail Meja
                </span>
                <h2 className="font-serif text-2xl font-bold text-[#3d1018] mt-1">
                  Meja {selectedTable.number}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {selectedTable.status !== 'kosong' && (
                  <button
                    type="button"
                    onClick={() => {
                      clearTableSession(selectedTable.number);
                      setMobileDrawerOpen(false);
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold text-stone-500 hover:text-red-700 bg-stone-100 rounded-lg cursor-pointer"
                  >
                    Kosongkan Meja
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  aria-label="Tutup detail meja"
                  className="w-8 h-8 rounded-full bg-[#f0ede9] flex items-center justify-center text-[#524344] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            {selectedTable.status === 'kosong' ? (
              <div className="py-6 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#f6f3ee] flex items-center justify-center text-[#847374]">
                  <span className="material-symbols-outlined text-[28px]">table_restaurant</span>
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#1c1c19]">Meja Ini Tersedia</h3>
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
                {/* Rincian Menu */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs text-[#524344]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#524344]">
                      Rincian Menu
                    </span>
                    <span>{selectedTable.items?.length || 0} Item</span>
                  </div>
                  <div className="divide-y divide-[#ebe8e3] text-xs py-1 max-h-48 overflow-y-auto">
                    {(selectedTable.items && selectedTable.items.length > 0) ? (
                      selectedTable.items.map((item, idx) => (
                        <div key={idx} className="py-2 flex justify-between items-center">
                          <span className="text-[#1c1c19] truncate">{item.name}</span>
                          <span className="font-semibold text-[#1c1c19] tabular-nums shrink-0 ml-2">
                            Rp {item.price.toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="py-3 text-center text-xs text-[#847374] italic">
                        Belum ada rincian pesanan tercatat
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-baseline justify-between pt-2 border-t border-[#ebe8e3]">
                  <span className="text-xs font-bold text-[#524344] uppercase tracking-wider">
                    Total Tagihan
                  </span>
                  <span className="font-serif text-xl font-bold text-[#3d1018] tabular-nums">
                    {selectedTable.totalFormatted || 'Rp 0'}
                  </span>
                </div>

                {/* HANYA MUNCUL JIKA PESANAN BERASAL DARI SELF-ORDER (QR) DAN MENUNGGU KONFIRMASI */}
                {pendingOrderForSelectedTable && (
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    className="w-full h-11 rounded-xl bg-[#15803d] hover:bg-[#166534] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all active:scale-[0.99] mt-2"
                  >
                    <span className="material-symbols-outlined text-[18px] animate-pulse">
                      notifications_active
                    </span>
                    <span>Verifikasi Pesanan Self-Order</span>
                  </button>
                )}

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
        </div>
      )}

      {/* Pop-up Modal Konfirmasi Pesanan Self-Order (Tolak vs Terima) */}
      {showConfirmModal && pendingOrderForSelectedTable && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl shadow-2xl p-5 border border-[#ebe8e3] max-w-md w-full animate-in zoom-in-95 duration-150 flex flex-col gap-4">
            {/* Header Pop-up */}
            <div className="flex items-start justify-between pb-3 border-b border-[#ebe8e3]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#15803d] border border-emerald-200 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#1c1c19] leading-tight">
                    Konfirmasi Pesanan Self-Order
                  </h3>
                  <span className="text-xs text-[#524344]">
                    Meja {pendingOrderForSelectedTable.tableNumber} • {pendingOrderForSelectedTable.customerName}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-stone-100 text-stone-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Rincian Pesanan Masuk Dari Pelanggan */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#524344] uppercase tracking-wider">
                <span>Rincian Menu</span>
                <span>{pendingOrderForSelectedTable.items.length} Item</span>
              </div>
              <div className="max-h-52 overflow-y-auto divide-y divide-[#ebe8e3] rounded-xl bg-[#fcf9f4] p-3 border border-[#ebe8e3] text-xs">
                {pendingOrderForSelectedTable.items.map((it: any, idx: number) => (
                  <div key={idx} className="py-2 flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-[#3d1018]">{it.quantity}×</span>
                        <span className="font-semibold text-[#1c1c19] truncate">{it.product_name}</span>
                      </div>
                      {it.note && (
                        <p className="text-[11px] text-[#994703] mt-0.5 italic">Catatan: {it.note}</p>
                      )}
                    </div>
                    <span className="font-mono font-bold text-[#1c1c19] shrink-0">
                      Rp {((it.unit_price || 0) * (it.quantity || 1)).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>

              {pendingOrderForSelectedTable.note && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  <span className="font-bold">Catatan Meja: </span>
                  {pendingOrderForSelectedTable.note}
                </div>
              )}

              <div className="flex justify-between items-baseline pt-2">
                <span className="text-xs font-bold text-[#524344] uppercase tracking-wider">Total Tagihan</span>
                <span className="font-serif text-xl font-bold text-[#3d1018]">
                  Rp {pendingOrderForSelectedTable.total.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Tombol Tolak vs Terima */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#ebe8e3]">
              <button
                type="button"
                onClick={async () => {
                  await rejectCustomerOrder(pendingOrderForSelectedTable.orderId);
                  setShowConfirmModal(false);
                }}
                className="h-11 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">cancel</span>
                <span>Tolak Pesanan</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  await confirmCustomerOrder(pendingOrderForSelectedTable.orderId);
                  setShowConfirmModal(false);
                }}
                className="h-11 rounded-xl bg-[#15803d] hover:bg-[#166534] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>Terima &amp; Masak</span>
              </button>
            </div>
          </div>
        </div>
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
