import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BillItem } from '../types';

export const CheckoutView: React.FC = () => {
  const {
    bills,
    selectedBillId,
    setSelectedBillId,
    selectedBill,
    settlePayment,
    openReceiptModal,
    showToast,
    recentReceipts,
    refresh,
  } = useApp();

  const [queueTab, setQueueTab] = useState<'unpaid' | 'history'>('unpaid');
  const [selectedHistoryBill, setSelectedHistoryBill] = useState<BillItem | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'QRIS' | 'Kartu Debit'>('Tunai');
  const [cashTendered, setCashTendered] = useState<number>(250000);
  const [autoPrintReceipt, setAutoPrintReceipt] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showQrisCode, setShowQrisCode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredBills = bills.filter(
    (b) =>
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.tableNumber.includes(searchQuery) ||
      b.billNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHistory = recentReceipts.filter(
    (b) =>
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.tableNumber.includes(searchQuery) ||
      b.billNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentBill: BillItem =
    queueTab === 'history'
      ? selectedHistoryBill || filteredHistory[0] || {
          id: 'empty-history',
          billNumber: '-',
          tableNumber: '-',
          customerName: 'Tidak ada riwayat',
          guestCount: 0,
          itemCount: 0,
          items: [],
          subtotal: 0,
          serviceFee: 0,
          tax: 0,
          total: 0,
          requestedAt: '-',
          elapsedMinutesAgo: 0,
          waiterName: '-',
          openedAtTime: '-',
          status: 'lunas',
        }
      : selectedBill || filteredBills[0] || bills[0] || {
          id: 'empty-bill',
          billNumber: 'B-000',
          tableNumber: '00',
          customerName: 'Tamu',
          guestCount: 0,
          itemCount: 0,
          items: [],
          subtotal: 0,
          serviceFee: 0,
          tax: 0,
          total: 0,
          requestedAt: '12:00',
          elapsedMinutesAgo: 0,
          waiterName: '-',
          openedAtTime: '12.00 WIB',
          status: 'belum_dibayar',
        };

  // Hitung uang kembalian
  const change = cashTendered - currentBill.total;
  const isChangeNegative = change < 0;

  const handleCashPreset = (amount: number) => {
    setCashTendered(amount);
  };

  const handleNumpad = (val: string) => {
    let str = cashTendered.toString();
    if (str === '0') str = '';
    str += val;
    setCashTendered(parseInt(str, 10) || 0);
  };

  const handleBackspace = () => {
    const str = cashTendered.toString();
    if (str.length > 1) {
      setCashTendered(parseInt(str.slice(0, -1), 10) || 0);
    } else {
      setCashTendered(0);
    }
  };

  const handleExecutePayment = () => {
    if (currentBill.isAllServed === false) {
      showToast('Tidak bisa bayar! Masih ada pesanan di dapur yang belum disajikan.', 'warning');
      return;
    }

    if (paymentMethod === 'Tunai' && isChangeNegative) {
      showToast('Nominal uang tunai kurang dari total tagihan!', 'warning');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      settlePayment(currentBill.id, paymentMethod, cashTendered);
    }, 250);
  };

  const handleManualRefresh = () => {
    refresh();
    showToast('Daftar tagihan kasir diperbarui', 'info');
  };

  // Preset pecahan uang tunai dinamis berbasis total tagihan
  const billTotal = currentBill.total;
  const next50k = Math.ceil(billTotal / 50000) * 50000;
  const next100k = Math.ceil(billTotal / 100000) * 100000;
  const dynamicPresets = Array.from(
    new Set([
      billTotal,
      next50k > billTotal ? next50k : billTotal + 50000,
      next100k > billTotal ? next100k : billTotal + 100000,
      next100k + 50000,
    ])
  ).filter((val) => val >= billTotal).slice(0, 4);

  return (
    <div className="flex flex-col w-full pb-20 md:pb-8 max-w-[1600px] mx-auto px-4 sm:px-6 pt-3">
      {/* Header Halaman (Minimalis & Fungsional) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-[#ebe8e3]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1c1c19] tracking-tight">
            Checkout &amp; Pembayaran
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleManualRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#ebe8e3] text-[#1c1c19] text-xs font-semibold hover:bg-[#f6f3ee] transition-colors cursor-pointer"
            aria-label="Segarkan antrean tagihan"
          >
            <span className="material-symbols-outlined text-[16px] text-[#3d1018]">sync</span>
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Grid Dua Kolom: KIRI (Antrean Tagihan) & KANAN (Detail Pembayaran) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* =========================================================================
            LEFT AREA: BILL QUEUE (5 Kolom pada Desktop)
           ========================================================================= */}
        <section
          aria-label="Daftar Antrean Tagihan"
          className="lg:col-span-5 flex flex-col gap-3"
        >
          {/* Tab Filter: Belum Dibayar vs Riwayat Transaksi */}
          <div className="flex items-center bg-[#f0ede9] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setQueueTab('unpaid')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                queueTab === 'unpaid'
                  ? 'bg-white text-[#3d1018] shadow-xs'
                  : 'text-[#524344] hover:text-[#1c1c19]'
              }`}
            >
              <span>Belum Dibayar</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  queueTab === 'unpaid' ? 'bg-[#3d1018] text-white' : 'bg-[#e0dcd8] text-[#524344]'
                }`}
              >
                {bills.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setQueueTab('history')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                queueTab === 'history'
                  ? 'bg-white text-[#3d1018] shadow-xs'
                  : 'text-[#524344] hover:text-[#1c1c19]'
              }`}
            >
              <span>Riwayat Transaksi</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  queueTab === 'history' ? 'bg-[#3d1018] text-white' : 'bg-[#e0dcd8] text-[#524344]'
                }`}
              >
                {recentReceipts.length}
              </span>
            </button>
          </div>

          {/* Kotak Pencarian */}
          <div className="relative flex items-center bg-white px-3 py-2 rounded-xl border border-[#ebe8e3]">
            <span className="material-symbols-outlined text-[18px] text-[#847374] mr-2">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari meja, tamu, atau nomor bill..."
              className="bg-transparent w-full text-xs text-[#1c1c19] placeholder-[#847374] outline-none"
              aria-label="Cari tagihan"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[#847374] hover:text-[#1c1c19] text-xs"
                aria-label="Hapus pencarian"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Daftar Tagihan Ringkas (Compact Horizontal List) */}
          <div className="flex flex-col gap-2">
            {queueTab === 'unpaid' ? (
              filteredBills.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center border border-[#ebe8e3]">
                  <span className="material-symbols-outlined text-3xl text-emerald-700 mb-1">
                    check_circle
                  </span>
                  <p className="font-bold text-sm text-[#1c1c19]">Semua Tagihan Selesai</p>
                  <p className="text-xs text-[#524344] mt-0.5">
                    Tidak ada meja yang sedang menunggu pembayaran kasir.
                  </p>
                </div>
              ) : (
                filteredBills.map((bill) => {
                  const isSelected = bill.id === currentBill.id;
                  const isUnserved = bill.isAllServed === false;

                  return (
                    <button
                      key={bill.id}
                      type="button"
                      onClick={() => setSelectedBillId(bill.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#fcf9f4] border-[#3d1018] ring-1 ring-[#3d1018]'
                          : 'bg-white hover:bg-[#f6f3ee] border-[#ebe8e3]'
                      }`}
                      aria-pressed={isSelected}
                    >
                      {/* Badge Meja & Info Tamu */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-lg flex flex-col items-center justify-center shrink-0 font-bold ${
                            isSelected
                              ? 'bg-[#3d1018] text-white'
                              : 'bg-[#f0ede9] text-[#1c1c19]'
                          }`}
                        >
                          <span className="text-[9px] uppercase leading-none opacity-80">Meja</span>
                          <span className="text-base tabular-nums leading-tight">
                            {bill.tableNumber}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs sm:text-sm text-[#1c1c19] truncate">
                              {bill.customerName}
                            </span>
                            {isUnserved && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[10px] font-semibold shrink-0">
                                Dapur
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#524344] mt-0.5 truncate">
                            {bill.billNumber} • {bill.itemCount} menu • {bill.guestCount} tamu
                          </p>
                        </div>
                      </div>

                      {/* Total & Status */}
                      <div className="text-right shrink-0">
                        <span className="font-bold text-xs sm:text-sm text-[#1c1c19] tabular-nums block">
                          Rp {bill.total.toLocaleString('id-ID')}
                        </span>
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-medium mt-0.5 ${
                            bill.status === 'minta_checkout'
                              ? 'bg-[#ffdbc9] text-[#753400]'
                              : 'bg-[#f0ede9] text-[#524344]'
                          }`}
                        >
                          {bill.status === 'minta_checkout' ? 'Minta Bayar' : 'Belum Bayar'}
                        </span>
                      </div>
                    </button>
                  );
                })
              )
            ) : filteredHistory.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-[#ebe8e3]">
                <span className="material-symbols-outlined text-3xl text-[#847374] mb-1">
                  history
                </span>
                <p className="font-bold text-sm text-[#1c1c19]">Belum Ada Riwayat</p>
                <p className="text-xs text-[#524344] mt-0.5">
                  Transaksi yang telah lunas akan tersimpan di sini.
                </p>
              </div>
            ) : (
              filteredHistory.map((bill) => {
                const isSelected = bill.id === currentBill.id;

                return (
                  <button
                    key={bill.id}
                    type="button"
                    onClick={() => setSelectedHistoryBill(bill)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#fcf9f4] border-[#3d1018] ring-1 ring-[#3d1018]'
                        : 'bg-white hover:bg-[#f6f3ee] border-[#ebe8e3]'
                    }`}
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-lg flex flex-col items-center justify-center shrink-0 font-bold ${
                          isSelected
                            ? 'bg-[#3d1018] text-white'
                            : 'bg-[#f0ede9] text-[#1c1c19]'
                        }`}
                      >
                        <span className="text-[9px] uppercase leading-none opacity-80">Meja</span>
                        <span className="text-base tabular-nums leading-tight">
                          {bill.tableNumber}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs sm:text-sm text-[#1c1c19] truncate">
                            {bill.customerName}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Lunas
                          </span>
                        </div>
                        <p className="text-[11px] text-[#524344] mt-0.5 truncate">
                          {bill.billNumber} • {bill.paymentMethod?.toUpperCase() || 'TUNAI'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold text-xs sm:text-sm text-[#1c1c19] tabular-nums block">
                        Rp {bill.total.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[10px] text-[#847374] block mt-0.5">
                        {bill.paidAtTime || bill.requestedAt}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* =========================================================================
            RIGHT AREA: PAYMENT DETAIL (7 Kolom pada Desktop)
           ========================================================================= */}
        <section
          aria-label="Detail Pembayaran Tagihan Terpilih"
          className="lg:col-span-7 bg-white rounded-xl border border-[#ebe8e3] p-4 sm:p-5 flex flex-col gap-4"
        >
          {/* Header Rincian Tagihan Terpilih */}
          <div className="flex items-start justify-between pb-3 border-b border-[#ebe8e3]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-[#1c1c19]">
                  Meja {currentBill.tableNumber}
                </h2>
                <span className="text-[#847374]">•</span>
                <span className="text-sm font-semibold text-[#524344]">
                  {currentBill.customerName}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    currentBill.status === 'lunas'
                      ? 'bg-emerald-100 text-emerald-800'
                      : currentBill.status === 'minta_checkout'
                      ? 'bg-[#ffdbc9] text-[#753400]'
                      : 'bg-[#f0ede9] text-[#524344]'
                  }`}
                >
                  {currentBill.status === 'lunas'
                    ? 'Lunas'
                    : currentBill.status === 'minta_checkout'
                    ? 'Minta Kasir'
                    : 'Belum Lunas'}
                </span>
              </div>
              <p className="text-xs text-[#847374] mt-0.5">
                ID: {currentBill.billNumber} • Pelayan: {currentBill.waiterName} • {currentBill.guestCount} Tamu
              </p>
            </div>

            <button
              type="button"
              onClick={() => openReceiptModal(currentBill)}
              className="px-2.5 py-1.5 rounded-lg border border-[#ebe8e3] bg-[#fcf9f4] hover:bg-[#f0ede9] text-[#1c1c19] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              aria-label="Pratinjau struk kasir"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span className="hidden sm:inline">Struk</span>
            </button>
          </div>

          {/* Alert Status Dapur Jika Masih Ada Pesanan Belum Disajikan */}
          {currentBill.isAllServed === false && currentBill.status !== 'lunas' && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2"
            >
              <span className="material-symbols-outlined text-[18px] text-amber-700 shrink-0 mt-0.5">
                warning
              </span>
              <div>
                <strong className="block font-semibold">
                  Pesanan Belum Selesai Dimasak di Dapur
                </strong>
                <span className="text-[11px] text-amber-800">
                  Tagihan hanya dapat dilunasi setelah seluruh menu disajikan melalui Kitchen Display.
                </span>
              </div>
            </div>
          )}

          {/* Rincian Menu Yang Dipesan (Tabel Ringkas) */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#524344] block mb-2">
              Daftar Pesanan ({currentBill.items.length} menu)
            </span>

            {currentBill.items.length === 0 ? (
              <p className="text-xs text-[#847374] italic py-2">Tidak ada item pesanan.</p>
            ) : (
              <div className="divide-y divide-[#ebe8e3] text-xs">
                {currentBill.items.map((item, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 text-center font-bold text-[#3d1018] tabular-nums shrink-0">
                        {item.quantity}×
                      </span>
                      <div className="min-w-0">
                        <span className="font-semibold text-[#1c1c19] truncate block">
                          {item.name}
                        </span>
                        {item.notes && (
                          <span className="text-[11px] text-[#994703] block truncate">
                            Catatan: {item.notes}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-medium text-[#1c1c19] tabular-nums shrink-0">
                      Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Kalkulasi Finansial (Subtotal, PB1, Service, Total) */}
          <div className="pt-3 border-t border-[#ebe8e3] space-y-1.5 text-xs">
            <div className="flex justify-between text-[#524344]">
              <span>Subtotal Menu</span>
              <span className="font-medium text-[#1c1c19] tabular-nums">
                Rp {currentBill.subtotal.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between text-[#524344]">
              <span>Biaya Layanan (5%)</span>
              <span className="font-medium text-[#1c1c19] tabular-nums">
                Rp {currentBill.serviceFee.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between text-[#524344]">
              <span>Pajak Restoran PB1 (10%)</span>
              <span className="font-medium text-[#1c1c19] tabular-nums">
                Rp {currentBill.tax.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#ebe8e3] items-baseline">
              <span className="text-sm font-bold text-[#1c1c19]">TOTAL PEMBAYARAN</span>
              <span className="text-2xl font-bold text-[#3d1018] tabular-nums">
                Rp {currentBill.total.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Pilihan Metode Pembayaran & Penyelesaian */}
          {currentBill.status === 'lunas' ? (
            /* Mode Transaksi Lunas */
            <div className="pt-2 border-t border-[#ebe8e3] space-y-3">
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-900 block">
                    Transaksi Sudah Lunas
                  </span>
                  <span className="text-[11px] text-emerald-700">
                    Dibayar via {(currentBill.paymentMethod || 'Tunai').toUpperCase()} • {currentBill.paidAtTime || currentBill.requestedAt}
                  </span>
                </div>
                <span className="px-2 py-1 rounded bg-emerald-700 text-white font-bold text-[10px]">
                  SELESAI
                </span>
              </div>

              {currentBill.paymentMethod === 'tunai' && currentBill.cashTendered ? (
                <div className="grid grid-cols-2 gap-2 text-xs bg-[#fcf9f4] p-3 rounded-lg border border-[#ebe8e3]">
                  <div>
                    <span className="text-[#847374] block">Diterima:</span>
                    <span className="font-bold text-[#1c1c19] tabular-nums">
                      Rp {currentBill.cashTendered.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#847374] block">Kembalian:</span>
                    <span className="font-bold text-[#994703] tabular-nums">
                      Rp {(currentBill.changeAmount || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => openReceiptModal(currentBill)}
                className="w-full py-2.5 rounded-lg bg-[#3d1018] hover:bg-[#58252c] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Cetak Ulang Struk</span>
              </button>
            </div>
          ) : (
            /* Mode Input Pembayaran Kasir */
            <div className="pt-2 border-t border-[#ebe8e3] space-y-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#524344] block mb-1.5">
                  Metode Pembayaran
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(['Tunai', 'QRIS', 'Kartu Debit'] as const).map((method) => {
                    const active = paymentMethod === method;
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(method);
                          setShowQrisCode(method === 'QRIS');
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          active
                            ? 'bg-[#3d1018] text-white shadow-xs'
                            : 'bg-[#f0ede9] text-[#1c1c19] hover:bg-[#e0dcd8]'
                        }`}
                        aria-pressed={active}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {method === 'Tunai'
                            ? 'payments'
                            : method === 'QRIS'
                            ? 'qr_code_2'
                            : 'credit_card'}
                        </span>
                        <span>{method}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tampilan QRIS */}
              {paymentMethod === 'QRIS' && (
                <div className="p-4 rounded-xl bg-[#fcf9f4] border border-[#ebe8e3] flex flex-col items-center text-center gap-2">
                  <div className="w-40 h-40 bg-white p-2 rounded-lg border border-[#ebe8e3] flex items-center justify-center">
                    <svg className="w-full h-full text-[#3d1018]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm-2 10h8v8H2v-8zm2 2v4h4v-4H4zm10-14h8v8h-8V2zm2 2v4h4V4h-4zm3 8h3v2h-3v-2zm-3 2h2v3h-2v-3zm5 2h2v4h-4v-2h2v-2zm-2 2v2h-3v-2h3zm-3-4h2v2h-2v-2zm-2 2h2v2h-2v-2z" />
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-[#1c1c19]">
                    NMID: ID1029384756 • RAWON GUSTI
                  </p>
                  <p className="text-[11px] text-[#524344]">
                    Pelanggan memindai QR dinamis di atas menggunakan aplikasi e-wallet / mobile banking.
                  </p>
                </div>
              )}

              {/* Tampilan Tunai (Input, Preset, Numpad, Kembalian) */}
              {paymentMethod === 'Tunai' && (
                <div className="space-y-2.5 p-3 rounded-xl bg-[#fcf9f4] border border-[#ebe8e3]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label htmlFor="cash-input" className="text-xs font-bold text-[#1c1c19]">
                      Uang Tunai Diterima:
                    </label>
                    <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-[#ebe8e3] focus-within:border-[#3d1018]">
                      <span className="font-bold text-xs text-[#524344]">Rp</span>
                      <input
                        id="cash-input"
                        type="text"
                        value={cashTendered.toLocaleString('id-ID')}
                        onChange={(e) => {
                          const raw = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0;
                          setCashTendered(raw);
                        }}
                        className="font-bold text-sm text-[#1c1c19] text-right outline-none w-32 tabular-nums"
                      />
                    </div>
                  </div>

                  {/* Tombol Preset Pecahan */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-[#847374] font-semibold uppercase">Pecahan:</span>
                    <button
                      type="button"
                      onClick={() => handleCashPreset(billTotal)}
                      className="px-2 py-1 rounded bg-white hover:bg-[#ebe8e3] text-xs font-semibold text-[#1c1c19] border border-[#ebe8e3] cursor-pointer"
                    >
                      Uang Pas
                    </button>
                    {dynamicPresets.slice(1).map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleCashPreset(amt)}
                        className="px-2 py-1 rounded bg-white hover:bg-[#ebe8e3] text-xs font-semibold text-[#1c1c19] border border-[#ebe8e3] cursor-pointer tabular-nums"
                      >
                        {amt.toLocaleString('id-ID')}
                      </button>
                    ))}
                  </div>

                  {/* Numpad Sentuh Cepat */}
                  <div className="grid grid-cols-4 gap-1 pt-1">
                    {['1', '2', '3', '000', '4', '5', '6', '00', '7', '8', '9'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleNumpad(val)}
                        className="h-9 rounded-lg bg-white hover:bg-[#ebe8e3] font-bold text-xs text-[#1c1c19] border border-[#ebe8e3] cursor-pointer active:scale-95 transition-all"
                      >
                        {val}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleBackspace}
                      className="h-9 rounded-lg bg-[#f0ede9] text-[#3d1018] hover:bg-[#e0dcd8] font-bold border border-[#ebe8e3] flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                      aria-label="Hapus digit"
                    >
                      <span className="material-symbols-outlined text-[16px]">backspace</span>
                    </button>
                  </div>

                  {/* Baris Kembalian */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#ebe8e3] text-xs font-bold">
                    <span className="text-[#524344]">Uang Kembalian:</span>
                    <span
                      className={`text-base tabular-nums ${
                        isChangeNegative ? 'text-red-700' : 'text-[#994703]'
                      }`}
                    >
                      {isChangeNegative
                        ? `Kurang Rp ${Math.abs(change).toLocaleString('id-ID')}`
                        : `Rp ${change.toLocaleString('id-ID')}`}
                    </span>
                  </div>
                </div>
              )}

              {/* Opsi Cetak Struk */}
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#1c1c19]">
                <input
                  type="checkbox"
                  checked={autoPrintReceipt}
                  onChange={(e) => setAutoPrintReceipt(e.target.checked)}
                  className="w-4 h-4 rounded text-[#3d1018] accent-[#3d1018] cursor-pointer"
                />
                <span>Cetak struk kasir termal otomatis setelah pembayaran</span>
              </label>

              {/* Tombol Eksekusi Pembayaran */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleExecutePayment}
                  disabled={
                    isProcessing ||
                    bills.length === 0 ||
                    currentBill.isAllServed === false ||
                    (paymentMethod === 'Tunai' && isChangeNegative)
                  }
                  className={`w-full py-3 px-4 rounded-xl text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
                    currentBill.isAllServed === false || (paymentMethod === 'Tunai' && isChangeNegative)
                      ? 'bg-[#847374] opacity-60 cursor-not-allowed'
                      : 'bg-[#3d1018] hover:bg-[#58252c] active:scale-[0.99]'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">
                        sync
                      </span>
                      <span>Memproses Pembayaran...</span>
                    </>
                  ) : currentBill.isAllServed === false ? (
                    <>
                      <span className="material-symbols-outlined text-[18px]">skillet</span>
                      <span>Tunggu Masakan Disajikan Dapur</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      <span>
                        Konfirmasi Pembayaran (Rp {currentBill.total.toLocaleString('id-ID')})
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
