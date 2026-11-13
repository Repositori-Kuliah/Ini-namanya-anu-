import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { today } from '../../lib/domain';
import { fetchPaid } from '../../lib/report';
import { TransactionRecord } from '../types';
import { CustomDatePicker } from './CustomDatePicker';

const formatIDDate = (isoStr: string) => {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoStr;
};

export const LaporanView: React.FC = () => {
  const { transactions, showToast, openReceiptModal } = useApp();
  const todayStr = today();

  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [methodFilter, setMethodFilter] = useState('Semua metode');
  const [typeFilter, setTypeFilter] = useState('Dine in & Take away');
  const [customRangeTrx, setCustomRangeTrx] = useState<TransactionRecord[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Modal Rekap Tutup Shift Kasir
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [modalAwalKas, setModalAwalKas] = useState<number | ''>(200000); // Rp 200.000 modal awal laci
  const [uangFisikKasir, setUangFisikKasir] = useState<number | ''>('');

  const getDaysAgo = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
  };

  const handlePreset = (preset: 'today' | '7days' | '30days' | '1year') => {
    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7days') {
      setStartDate(getDaysAgo(6));
      setEndDate(todayStr);
    } else if (preset === '30days') {
      setStartDate(getDaysAgo(29));
      setEndDate(todayStr);
    } else if (preset === '1year') {
      setStartDate(getDaysAgo(364));
      setEndDate(todayStr);
    }
  };

  const activeTransactions = customRangeTrx !== null ? customRangeTrx : transactions;

  const filteredTransactions = activeTransactions.filter((t) => {
    if (methodFilter !== 'Semua metode' && t.method !== methodFilter) return false;
    if (typeFilter === 'Dine in saja' && t.typeMeja.toLowerCase().includes('take away')) return false;
    if (typeFilter === 'Take away saja' && !t.typeMeja.toLowerCase().includes('take away')) return false;
    return true;
  });

  const totalPenjualan = filteredTransactions.reduce((acc, t) => acc + t.total, 0);
  const totalSubtotal = filteredTransactions.reduce((acc, t) => acc + t.subtotal, 0);
  const totalPajak = filteredTransactions.reduce((acc, t) => acc + t.tax, 0);
  const avgTransaksi = Math.round(totalPenjualan / (filteredTransactions.length || 1));

  const tunaiTrx = filteredTransactions.filter((t) => t.method === 'Tunai');
  const qrisTrx = filteredTransactions.filter((t) => t.method === 'QRIS');
  const debitTrx = filteredTransactions.filter((t) => t.method === 'Kartu Debit');
  const tunaiTotal = tunaiTrx.reduce((acc, t) => acc + t.total, 0);
  const qrisTotal = qrisTrx.reduce((acc, t) => acc + t.total, 0);
  const debitTotal = debitTrx.reduce((acc, t) => acc + t.total, 0);

  const tunaiPct = totalPenjualan ? Math.round((tunaiTotal / totalPenjualan) * 1000) / 10 : 0;
  const qrisPct = totalPenjualan ? Math.round((qrisTotal / totalPenjualan) * 1000) / 10 : 0;
  const debitPct = totalPenjualan ? Math.round((debitTotal / totalPenjualan) * 1000) / 10 : 0;

  const handleApplyFilter = async () => {
    setIsLoading(true);
    try {
      const dbMethod =
        methodFilter === 'Tunai'
          ? 'cash'
          : methodFilter === 'QRIS'
          ? 'qris'
          : methodFilter === 'Kartu Debit'
          ? 'debit'
          : 'all';
      const rows = await fetchPaid(startDate, endDate, dbMethod);
      if (rows && rows.length > 0) {
        const mapped: TransactionRecord[] = rows.map((r, idx) => {
          const hhmm = new Date(r.at)
            .toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
            .replace('.', ':');
          return {
            id: `rep-${idx}-${r.no}`,
            code: `#${r.no}`,
            time: hhmm,
            at: r.at,
            typeMeja: r.table ? `Meja ${String(r.table).padStart(2, '0')}` : 'Bawa Pulang',
            source: r.src === 'qr' ? 'QR meja' : 'Manual',
            method: r.method === 'cash' ? 'Tunai' : r.method === 'qris' ? 'QRIS' : 'Kartu Debit',
            subtotal: r.subtotal,
            tax: r.total - r.subtotal,
            total: r.total,
            status: 'Lunas',
          };
        });
        setCustomRangeTrx(mapped);
      } else {
        setCustomRangeTrx(null);
      }
      showToast(`Filter laporan diterapkan (${startDate} s/d ${endDate})`, 'success');
    } catch (e) {
      console.warn('Laporan fetchPaid error:', e);
      showToast('Memuat laporan lokal aktif', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Kode', 'Waktu', 'Tipe/Meja', 'Sumber', 'Metode', 'Subtotal', 'Pajak', 'Total', 'Status'];
    const rows = filteredTransactions.map((t) => [
      t.code,
      t.time,
      `"${t.typeMeja}"`,
      t.source,
      t.method,
      t.subtotal,
      t.tax,
      t.total,
      t.status,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Rawon_Gusti_${startDate}_sd_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Laporan transaksi berhasil diunduh dalam format CSV', 'success');
  };

  // Tutup Shift Calculation
  const modalAwalNum = typeof modalAwalKas === 'number' ? modalAwalKas : 0;
  const totalKasSeharusnya = modalAwalNum + tunaiTotal;
  const fisikKas = typeof uangFisikKasir === 'number' ? uangFisikKasir : 0;
  const selisihKas = fisikKas - totalKasSeharusnya;

  // Dynamic hourly bucket data from actual transactions
  const hourBuckets = useMemo(() => {
    const buckets = [
      { label: '10:00–11:00', start: 10, end: 11, amount: 0 },
      { label: '11:00–12:00', start: 11, end: 12, amount: 0 },
      { label: '12:00–13:00', start: 12, end: 13, amount: 0 },
      { label: '13:00–14:00', start: 13, end: 14, amount: 0 },
      { label: '14:00–15:00', start: 14, end: 15, amount: 0 },
      { label: '17:00–20:00', start: 17, end: 20, amount: 0 },
    ];
    filteredTransactions.forEach((t) => {
      const dt = t.at ? new Date(t.at) : null;
      if (dt) {
        const hour = Number(
          dt.toLocaleTimeString('id-ID', { hour: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' })
        );
        const match = buckets.find((b) => hour >= b.start && hour < b.end);
        if (match) {
          match.amount += t.total;
        }
      }
    });
    return buckets;
  }, [filteredTransactions]);

  const maxBucket = Math.max(...hourBuckets.map((b) => b.amount), 0);

  return (
    <div className="flex flex-col w-full p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1540px] mx-auto pb-28 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-[#ebe8e3]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1c1c19] tracking-tight">
            Laporan Transaksi &amp; Penjualan
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tutup Kasir */}
          <button
            type="button"
            onClick={() => setShiftModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-[#f6f3ee] text-[#1c1c19] border border-[#ebe8e3] transition-colors cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px] text-[#994703]">point_of_sale</span>
            <span>Tutup Kasir</span>
          </button>

          {/* Ekspor CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#3d1018] hover:bg-[#58252c] transition-colors cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">table_chart</span>
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-[#ebe8e3] space-y-3">
        {/* Presets */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] font-semibold text-[#847374] uppercase tracking-wider mr-1">
            Pilihan Periode:
          </span>
          <div className="inline-flex items-center bg-[#f6f3ee] p-0.5 rounded-xl border border-[#ebe8e3]">
            {[
              { id: 'today', label: '1 Hari' },
              { id: '7days', label: '1 Minggu' },
              { id: '30days', label: '1 Bulan' },
              { id: '1year', label: '1 Tahun' },
            ].map((p) => {
              const active =
                (p.id === 'today' && startDate === todayStr && endDate === todayStr) ||
                (p.id === '7days' && startDate === getDaysAgo(6) && endDate === todayStr) ||
                (p.id === '30days' && startDate === getDaysAgo(29) && endDate === todayStr) ||
                (p.id === '1year' && startDate === getDaysAgo(364) && endDate === todayStr);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePreset(p.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-[#3d1018] text-white shadow-xs'
                      : 'text-[#524344] hover:text-[#1c1c19] hover:bg-white/60'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 items-end text-xs pt-1 border-t border-[#ebe8e3]">
          <div>
            <label className="block text-[11px] font-semibold text-[#524344] mb-1">Tanggal Mulai</label>
            <CustomDatePicker
              id="laporan-date-start"
              value={startDate}
              max={endDate}
              onChange={(iso) => setStartDate(iso)}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#524344] mb-1">Tanggal Akhir</label>
            <CustomDatePicker
              id="laporan-date-end"
              value={endDate}
              min={startDate}
              max={todayStr}
              onChange={(iso) => setEndDate(iso)}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#524344] mb-1">Metode Pembayaran</label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-[#ebe8e3] bg-[#f6f3ee] text-[#1c1c19] outline-none focus:border-[#3d1018] cursor-pointer"
            >
              <option value="Semua metode">Semua Metode</option>
              <option value="Tunai">Tunai</option>
              <option value="QRIS">QRIS</option>
              <option value="Kartu Debit">Kartu Debit</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#524344] mb-1">Tipe Pesanan</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-[#ebe8e3] bg-[#f6f3ee] text-[#1c1c19] outline-none focus:border-[#3d1018] cursor-pointer"
            >
              <option value="Dine in & Take away">Dine in &amp; Take away</option>
              <option value="Dine in saja">Dine in Saja</option>
              <option value="Take away saja">Take away Saja</option>
            </select>
          </div>

          <div>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleApplyFilter}
              className="w-full py-1.5 px-3 bg-[#3d1018] hover:bg-[#58252c] text-white font-semibold rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Memuat...</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[15px]">filter_alt</span>
                  <span>Terapkan Filter</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 4 Compact Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-[#ebe8e3]">
        <div className="px-2">
          <span className="text-[11px] font-semibold text-[#847374] uppercase tracking-wider">Total Penjualan Lunas</span>
          <div className="text-xl font-bold font-serif text-[#1c1c19] mt-0.5 tabular-nums">
            Rp {totalPenjualan.toLocaleString('id-ID')}
          </div>
        </div>

        <div className="px-2 border-l border-[#ebe8e3]">
          <span className="text-[11px] font-semibold text-[#847374] uppercase tracking-wider">Jumlah Transaksi</span>
          <div className="text-xl font-bold font-serif text-[#1c1c19] mt-0.5 tabular-nums">
            {filteredTransactions.length} <span className="text-xs font-normal text-[#847374]">struk</span>
          </div>
        </div>

        <div className="px-2 border-l border-[#ebe8e3]">
          <span className="text-[11px] font-semibold text-[#847374] uppercase tracking-wider">Rata-rata / Transaksi</span>
          <div className="text-xl font-bold font-serif text-[#1c1c19] mt-0.5 tabular-nums">
            Rp {avgTransaksi.toLocaleString('id-ID')}
          </div>
        </div>

        <div className="px-2 border-l border-[#ebe8e3]">
          <span className="text-[11px] font-semibold text-[#847374] uppercase tracking-wider">Pajak Restoran (PB1)</span>
          <div className="text-xl font-bold font-serif text-[#3d1018] mt-0.5 tabular-nums">
            Rp {totalPajak.toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      {/* Analytics: Tren & Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend Section */}
        <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-[#ebe8e3] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-[#ebe8e3]">
            <div>
              <h3 className="text-xs font-bold text-[#1c1c19] uppercase tracking-wider">Tren Penjualan Menurut Jam</h3>
              <p className="text-[11px] text-[#847374] mt-0.5">
                Periode: {startDate === endDate ? formatIDDate(startDate) : `${formatIDDate(startDate)} s/d ${formatIDDate(endDate)}`}
              </p>
            </div>
            <span className="text-[11px] font-semibold text-[#3d1018] tabular-nums">
              Total Rp {totalPenjualan.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="pt-6 pb-2">
            <div className="h-40 w-full flex items-end justify-between gap-2 px-2">
              {hourBuckets.map((bucket, i) => {
                const heightPx = maxBucket > 0 ? Math.max(6, Math.round((bucket.amount / maxBucket) * 120)) : 4;
                const hasSales = bucket.amount > 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <span
                      className={`text-[10px] tabular-nums transition-colors ${
                        hasSales ? 'font-bold text-[#3d1018]' : 'text-[#847374]'
                      }`}
                    >
                      {hasSales ? `Rp${bucket.amount.toLocaleString('id-ID')}` : 'Rp0'}
                    </span>
                    <div
                      style={{ height: `${heightPx}px` }}
                      className={`w-full max-w-[48px] rounded-t transition-all ${
                        hasSales ? 'bg-[#58252c] group-hover:bg-[#3d1018]' : 'bg-[#f0ede9]'
                      }`}
                    />
                    <span
                      className={`text-[10px] sm:text-[11px] ${
                        hasSales ? 'font-bold text-[#1c1c19]' : 'text-[#524344]'
                      }`}
                    >
                      {bucket.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white p-4 rounded-xl border border-[#ebe8e3] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#ebe8e3]">
              <h3 className="text-xs font-bold text-[#1c1c19] uppercase tracking-wider">Komposisi Pembayaran</h3>
              <span className="text-[11px] text-[#847374]">{filteredTransactions.length} struk</span>
            </div>

            {/* Proportion Bar */}
            <div className="w-full h-2.5 flex rounded-full overflow-hidden mt-3 bg-[#f0ede9]">
              <div className="bg-[#58252c] h-full" style={{ width: `${tunaiPct}%` }} />
              <div className="bg-[#fc934f] h-full" style={{ width: `${qrisPct}%` }} />
              <div className="bg-[#0284c7] h-full" style={{ width: `${debitPct}%` }} />
            </div>

            <div className="mt-3.5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#58252c] shrink-0" />
                  <span className="text-[#524344]">
                    Tunai ({tunaiTrx.length} struk • {tunaiPct}%)
                  </span>
                </div>
                <span className="font-semibold text-[#1c1c19] tabular-nums">
                  Rp {tunaiTotal.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#fc934f] shrink-0" />
                  <span className="text-[#524344]">
                    QRIS ({qrisTrx.length} struk • {qrisPct}%)
                  </span>
                </div>
                <span className="font-semibold text-[#1c1c19] tabular-nums">
                  Rp {qrisTotal.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7] shrink-0" />
                  <span className="text-[#524344]">
                    Kartu Debit ({debitTrx.length} struk • {debitPct}%)
                  </span>
                </div>
                <span className="font-semibold text-[#1c1c19] tabular-nums">
                  Rp {debitTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#ebe8e3] text-[11px] text-[#847374]">
            Pembayaran non-tunai langsung tercatat otomatis di sistem merchant settlement.
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-xl border border-[#ebe8e3] overflow-hidden shadow-2xs">
        <div className="p-3.5 border-b border-[#ebe8e3] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold text-[#1c1c19] uppercase tracking-wider">Rincian Transaksi Selesai</h3>
            <span className="text-[11px] text-[#847374]">
              {startDate === endDate ? formatIDDate(startDate) : `${formatIDDate(startDate)} s/d ${formatIDDate(endDate)}`} • {methodFilter} • {filteredTransactions.length} transaksi
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f6f3ee] border-b border-[#ebe8e3] text-[11px] font-bold text-[#847374] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3.5">No. Struk</th>
                <th className="py-2.5 px-3">Waktu</th>
                <th className="py-2.5 px-3.5">Tipe / Meja</th>
                <th className="py-2.5 px-3">Sumber</th>
                <th className="py-2.5 px-3">Metode</th>
                <th className="py-2.5 px-3.5 text-right">Subtotal</th>
                <th className="py-2.5 px-3.5 text-right">PB1 (10%)</th>
                <th className="py-2.5 px-3.5 text-right">Total Bayar</th>
                <th className="py-2.5 px-3 text-center">Struk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebe8e3]">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-[#847374]">
                    Tidak ada data transaksi yang sesuai dengan filter tanggal atau metode ini.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-[#fcfaf7] transition-colors">
                    <td className="py-2.5 px-3.5 font-bold text-[#3d1018]">{trx.code}</td>
                    <td className="py-2.5 px-3 text-[#524344] font-mono text-[11px]">{trx.time}</td>
                    <td className="py-2.5 px-3.5 font-medium text-[#1c1c19]">{trx.typeMeja}</td>
                    <td className="py-2.5 px-3 text-[#847374] text-[11px]">{trx.source}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                          trx.method === 'Tunai'
                            ? 'bg-amber-50 text-amber-900 border-amber-200'
                            : trx.method === 'QRIS'
                            ? 'bg-orange-50 text-orange-900 border-orange-200'
                            : 'bg-blue-50 text-blue-900 border-blue-200'
                        }`}
                      >
                        {trx.method}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-[#524344] tabular-nums">
                      Rp {trx.subtotal.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-[#847374] tabular-nums text-[11px]">
                      Rp {trx.tax.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-bold text-[#1c1c19] tabular-nums">
                      Rp {trx.total.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          const bill = trx.billData || {
                            id: trx.id,
                            billNumber: trx.code.replace('#', ''),
                            tableNumber: trx.typeMeja.replace('Meja ', ''),
                            customerName: 'Pelanggan',
                            guestCount: 1,
                            itemCount: 1,
                            items: [{ name: 'Pesanan Meja Restoran', quantity: 1, price: trx.subtotal }],
                            subtotal: trx.subtotal,
                            serviceFee: Math.round(trx.subtotal * 0.05),
                            tax: trx.tax,
                            total: trx.total,
                            requestedAt: trx.time,
                            elapsedMinutesAgo: 0,
                            waiterName: trx.source,
                            openedAtTime: `${trx.time} WIB`,
                            status: 'lunas',
                            paymentMethod: trx.method.toLowerCase() as any,
                            paidAtTime: `${trx.at ? new Date(trx.at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''} ${trx.time} WIB`,
                          };
                          openReceiptModal(bill);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[#ebe8e3] bg-[#f6f3ee] hover:bg-[#3d1018] text-[#3d1018] hover:text-white transition text-[11px] font-semibold cursor-pointer"
                        aria-label="Cetak Ulang Struk Kasir"
                      >
                        <span className="material-symbols-outlined text-[13px]">print</span>
                        <span>Struk</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Bottom Totals */}
        <div className="p-3 bg-[#f6f3ee] border-t border-[#ebe8e3] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-[11px] text-[#847374]">
            Total <strong className="text-[#1c1c19]">{filteredTransactions.length} transaksi lunas</strong>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-[#524344]">
              Subtotal: <strong className="text-[#1c1c19]">Rp {totalSubtotal.toLocaleString('id-ID')}</strong>
            </span>
            <span className="text-[#524344]">
              PB1: <strong className="text-[#1c1c19]">Rp {totalPajak.toLocaleString('id-ID')}</strong>
            </span>
            <span className="text-[#3d1018] font-serif font-bold text-sm">
              Total: Rp {totalPenjualan.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      {/* Modal Rekap Tutup Shift Kasir (Redesigned) */}
      {shiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-[#ebe8e3] space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#ebe8e3]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#3d1018]/10 text-[#3d1018] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#1c1c19]">Rekonsiliasi &amp; Tutup Kasir</h3>
                  <p className="text-[11px] text-[#847374]">Pencocokan saldo kas fisik laci vs penjualan sistem</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShiftModalOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#847374] hover:bg-[#f6f3ee] hover:text-[#1c1c19] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Rekonsiliasi Breakdown Surface */}
            <div className="rounded-xl border border-[#ebe8e3] bg-[#fcfaf7] divide-y divide-[#ebe8e3] overflow-hidden text-xs">
              {/* Modal Kas Awal */}
              <div className="p-3 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-[#1c1c19] block">Modal Kas Awal</span>
                  <span className="text-[10px] text-[#847374]">Saldo uang pecahan laci</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#847374]">Rp</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={modalAwalKas}
                    onChange={(e) => {
                      const val = e.target.value.replace(/^0+(?=\d)/, '');
                      setModalAwalKas(val === '' ? '' : Number(val));
                    }}
                    className="w-28 text-right font-bold text-sm text-[#1c1c19] bg-white border border-[#ebe8e3] rounded-lg px-2.5 py-1 outline-none focus:border-[#3d1018] tabular-nums"
                  />
                </div>
              </div>

              {/* Penjualan Tunai */}
              <div className="p-3 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-[#1c1c19] block">
                    Penjualan Tunai ({formatIDDate(startDate)})
                  </span>
                  <span className="text-[10px] text-[#847374]">
                    {tunaiTrx.length} transaksi tunai terbayar
                  </span>
                </div>
                <span className="font-bold text-sm text-[#1c1c19] tabular-nums">
                  Rp {tunaiTotal.toLocaleString('id-ID')}
                </span>
              </div>

              {/* Total Kas Seharusnya */}
              <div className="p-3 bg-[#3d1018]/5 flex items-center justify-between">
                <span className="font-bold text-xs text-[#3d1018] uppercase tracking-wider">
                  Total Kas Seharusnya
                </span>
                <span className="font-serif font-bold text-base text-[#3d1018] tabular-nums">
                  Rp {totalKasSeharusnya.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Input Fisik Riil Kasir */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#1c1c19]">
                Hitungan Uang Fisik Nyata di Laci
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-bold text-sm text-[#847374]">
                  Rp
                </span>
                <input
                  type="number"
                  placeholder="Ketik total uang fisik di laci saat ini..."
                  value={uangFisikKasir}
                  onChange={(e) => {
                    const val = e.target.value.replace(/^0+(?=\d)/, '');
                    setUangFisikKasir(val === '' ? '' : Number(val));
                  }}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#ebe8e3] font-bold text-base text-[#1c1c19] outline-none focus:border-[#3d1018] focus:ring-1 focus:ring-[#3d1018] transition tabular-nums bg-white shadow-2xs"
                />
              </div>
            </div>

            {/* Hasil Selisih Status */}
            {uangFisikKasir !== '' && (
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-150 ${
                  selisihKas === 0
                    ? 'bg-[#fcf9f4] border-[#d8d1c7] text-[#3d1018]'
                    : selisihKas > 0
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">
                    {selisihKas === 0 ? 'verified' : selisihKas > 0 ? 'trending_up' : 'warning'}
                  </span>
                  <div>
                    <span className="font-bold block">
                      {selisihKas === 0
                        ? 'Kas Seimbang (Balans)'
                        : selisihKas > 0
                        ? 'Kas Surplus / Berlebih'
                        : 'Kas Defisit / Kurang'}
                    </span>
                    <span className="text-[10px] opacity-80">
                      {selisihKas === 0
                        ? 'Uang fisik di laci sesuai dengan perhitungan sistem'
                        : selisihKas > 0
                        ? 'Terdapat kelebihan saldo fisik dibanding sistem'
                        : 'Uang fisik kurang dari saldo sistem yang tercatat'}
                    </span>
                  </div>
                </div>
                <span className="font-bold text-sm tabular-nums shrink-0 ml-2">
                  {selisihKas >= 0
                    ? `+Rp ${selisihKas.toLocaleString('id-ID')}`
                    : `-Rp ${Math.abs(selisihKas).toLocaleString('id-ID')}`}
                </span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ebe8e3]">
              <button
                type="button"
                onClick={() => setShiftModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#524344] hover:bg-[#f6f3ee] cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                  showToast('Slip tutup kasir dicetak', 'success');
                  setShiftModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-[#3d1018] text-white text-xs font-semibold hover:bg-[#58252c] transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Cetak Slip Rekap Kasir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
