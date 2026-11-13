import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { today } from '../../lib/domain';
import { fetchPaid } from '../../lib/report';
import { TransactionRecord } from '../types';
import { DashboardDatePicker } from './DashboardDatePicker';

const toWIBDate = (iso: string) =>
  new Date(iso).toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });

export const DashboardView: React.FC = () => {
  const { transactions, setActiveView, menuItems } = useApp();
  const todayStr = today();
  const [dateFrom, setDateFrom] = useState(todayStr);
  const [dateTo, setDateTo] = useState(todayStr);
  const [customRangeTrx, setCustomRangeTrx] = useState<TransactionRecord[] | null>(null);
  const [isLoadingRange, setIsLoadingRange] = useState(false);

  // Period presets
  type Period = '1hari' | '1minggu' | '1bulan' | '1tahun' | 'custom';
  const [period, setPeriod] = useState<Period>('1hari');

  const getDaysAgo = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
  };

  const getYearStart = (): string => {
    const d = new Date();
    const wib = d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
    return `${wib.slice(0, 4)}-01-01`;
  };

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
    if (p === '1hari') {
      setDateFrom(todayStr);
      setDateTo(todayStr);
    } else if (p === '1minggu') {
      setDateFrom(getDaysAgo(6));
      setDateTo(todayStr);
    } else if (p === '1bulan') {
      setDateFrom(getDaysAgo(29));
      setDateTo(todayStr);
    } else if (p === '1tahun') {
      setDateFrom(getYearStart());
      setDateTo(todayStr);
    }
  };

  // If viewing past date range, query Supabase for historical records
  useEffect(() => {
    if (dateFrom === todayStr && dateTo === todayStr) {
      setCustomRangeTrx(null);
      return;
    }
    let isCurrent = true;
    setIsLoadingRange(true);
    fetchPaid(dateFrom, dateTo)
      .then((rows) => {
        if (!isCurrent) return;
        const mapped: TransactionRecord[] = rows.map((r, idx) => {
          const hhmm = new Date(r.at)
            .toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
            .replace('.', ':');
          return {
            id: `paid-range-${idx}-${r.no}`,
            code: `#${r.no}`,
            time: hhmm,
            at: r.at,
            typeMeja: r.table ? `Meja ${String(r.table).padStart(2, '0')}` : 'Bawa Pulang',
            source: r.src === 'qr' ? 'QR meja' : 'Manual',
            method: r.method === 'cash' ? 'Tunai' : r.method === 'qris' ? 'QRIS' : 'Kartu Debit',
            subtotal: r.subtotal,
            tax: r.total - r.subtotal,
            total: r.total,
            status: 'Lunas'
          };
        });
        setCustomRangeTrx(mapped);
      })
      .catch((err) => {
        console.warn('Dashboard fetchPaid error:', err);
      })
      .finally(() => {
        if (isCurrent) setIsLoadingRange(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [dateFrom, dateTo, todayStr]);

  const activeTransactions = customRangeTrx !== null ? customRangeTrx : transactions;

  const filteredTrx = useMemo(() => {
    return activeTransactions.filter((t) => {
      const d = toWIBDate(t.at ?? new Date().toISOString());
      return d >= dateFrom && d <= dateTo;
    });
  }, [activeTransactions, dateFrom, dateTo]);

  const totalPenjualan = filteredTrx.reduce((acc, t) => acc + t.total, 0);
  const totalSubtotal = filteredTrx.reduce((acc, t) => acc + t.subtotal, 0);
  const totalPajak = filteredTrx.reduce((acc, t) => acc + t.tax, 0);
  const avgTransaksi = Math.round(totalPenjualan / (filteredTrx.length || 1));

  const tunaiTrx = filteredTrx.filter((t) => t.method === 'Tunai');
  const qrisTrx = filteredTrx.filter((t) => t.method === 'QRIS');

  const tunaiTotal = tunaiTrx.reduce((acc, t) => acc + t.total, 0);
  const qrisTotal = qrisTrx.reduce((acc, t) => acc + t.total, 0);

  const tunaiPct = totalPenjualan ? Math.round((tunaiTotal / totalPenjualan) * 1000) / 10 : 0;
  const qrisPct = totalPenjualan ? Math.round((qrisTotal / totalPenjualan) * 1000) / 10 : 0;

  const isToday = dateFrom === todayStr && dateTo === todayStr;
  const dateLabel = isToday
    ? 'Hari ini'
    : dateFrom === dateTo
    ? new Date(dateFrom).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : `${new Date(dateFrom).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} – ${new Date(dateTo).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  // Dynamic Hourly Sales Trend from real transactions
  const hourlyBuckets = useMemo(() => {
    const buckets = [
      { label: '10–11', start: 10, end: 11, amount: 0 },
      { label: '11–12', start: 11, end: 12, amount: 0 },
      { label: '12–13', start: 12, end: 13, amount: 0 },
      { label: '13–14', start: 13, end: 14, amount: 0 },
      { label: '14–15', start: 14, end: 15, amount: 0 },
      { label: '17–20', start: 17, end: 20, amount: 0 },
    ];
    filteredTrx.forEach((t) => {
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
  }, [filteredTrx]);

  const maxBucketAmount = Math.max(...hourlyBuckets.map((b) => b.amount), 0);

  // Dynamic Best Selling Menu Items from real transactions
  const bestSellers = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number; image?: string }>();
    filteredTrx.forEach((t) => {
      if (t.billData?.items) {
        t.billData.items.forEach((item) => {
          const existing = map.get(item.name) || {
            name: item.name,
            qty: 0,
            revenue: 0,
            image: menuItems.find((m) => m.name.toLowerCase() === item.name.toLowerCase())?.image,
          };
          existing.qty += item.quantity || 1;
          existing.revenue += (item.price || 0) * (item.quantity || 1);
          map.set(item.name, existing);
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [filteredTrx, menuItems]);

  const totalItemsSold = bestSellers.reduce((acc, curr) => acc + curr.qty, 0);

  return (
    <div className="flex flex-col w-full p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1540px] mx-auto pb-24 md:pb-8">
      {/* Top Action Bar & Title Block */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#3d1018] tracking-tight">
            Dashboard
          </h1>
        </div>

        {/* Unified Date & Period Selector (1 Hari, 1 Minggu, 1 Bulan, 1 Tahun + 1 Unified Date Picker) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Presets */}
          <div className="inline-flex items-center bg-white p-1 rounded-xl border border-[#ebe8e3] shadow-xs">
            {(
              [
                { id: '1hari', label: '1 Hari' },
                { id: '1minggu', label: '1 Minggu' },
                { id: '1bulan', label: '1 Bulan' },
                { id: '1tahun', label: '1 Tahun' },
              ] as const
            ).map((p) => {
              const active = period === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handlePeriodChange(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-[#3d1018] text-white shadow-xs'
                      : 'text-[#524344] hover:text-[#1c1c19] hover:bg-[#f6f3ee]'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Single Date Picker Box (Kiri ke Kanan & Kalender Popover) */}
          <DashboardDatePicker
            dateFrom={dateFrom}
            dateTo={dateTo}
            maxDate={todayStr}
            onSelectDate={(iso) => {
              setDateFrom(iso);
              setDateTo(iso);
              setPeriod('custom');
            }}
          />
        </div>
      </div>

      {/* 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#ebe8e3] flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-[#524344] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#524344]">
              Penjualan Lunas
            </span>
            <span className="w-8 h-8 rounded-full bg-[#f0ede9] flex items-center justify-center text-[#3d1018]">
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            </span>
          </div>
          <div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#3d1018] tabular-nums">
              Rp {totalPenjualan.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#ebe8e3] flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-[#524344] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#524344]">
              Transaksi Lunas
            </span>
            <span className="w-8 h-8 rounded-full bg-[#f0ede9] flex items-center justify-center text-[#3d1018]">
              <span className="material-symbols-outlined text-[18px]">checklist</span>
            </span>
          </div>
          <div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#3d1018] tabular-nums">
              {transactions.length}
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#ebe8e3] flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-[#524344] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#524344]">
              Rata-rata Transaksi
            </span>
            <span className="w-8 h-8 rounded-full bg-[#f0ede9] flex items-center justify-center text-[#3d1018]">
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            </span>
          </div>
          <div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#3d1018] tabular-nums">
              Rp {avgTransaksi.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#ebe8e3] flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-[#524344] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#524344]">
              Pajak Terkumpul
            </span>
            <span className="w-8 h-8 rounded-full bg-[#f0ede9] flex items-center justify-center text-[#3d1018]">
              <span className="material-symbols-outlined text-[18px]">percent</span>
            </span>
          </div>
          <div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#3d1018] tabular-nums">
              Rp {totalPajak.toLocaleString('id-ID')}
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Chart Tren Penjualan & Metode Pembayaran */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Chart: Tren Penjualan (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-[#ebe8e3] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-[#1c1c19]">
                  Tren penjualan
                </h2>
                <p className="text-xs text-[#524344]">
                  {dateLabel} • total Rp {totalPenjualan.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {/* Bar Chart Visualization */}
            <div className="mt-6 pt-4 pb-2">
              <div className="h-48 w-full flex items-end justify-between gap-2 sm:gap-4 px-2 sm:px-6">
                {hourlyBuckets.map((b) => {
                  const heightPx =
                    maxBucketAmount > 0
                      ? Math.max(6, Math.round((b.amount / maxBucketAmount) * 140))
                      : 4;
                  const hasSales = b.amount > 0;

                  return (
                    <div key={b.label} className="flex-1 flex flex-col items-center gap-2 group">
                      <span
                        className={`text-[10px] tabular-nums transition-colors ${
                          hasSales
                            ? 'font-bold text-[#3d1018]'
                            : 'text-[#847374] group-hover:text-[#1c1c19]'
                        }`}
                      >
                        Rp{b.amount.toLocaleString('id-ID')}
                      </span>
                      <div
                        style={{ height: `${heightPx}px` }}
                        className={`w-full max-w-[48px] rounded-t transition-all ${
                          hasSales
                            ? 'bg-[#58252c] group-hover:bg-[#3d1018]'
                            : 'bg-[#f0ede9]'
                        }`}
                      />
                      <span
                        className={`text-[11px] ${
                          hasSales ? 'font-bold text-[#1c1c19]' : 'text-[#524344]'
                        }`}
                      >
                        {b.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Card (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-[#ebe8e3] flex flex-col justify-between">
          <div>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#1c1c19]">
              Metode pembayaran
            </h2>
            <div className="mt-3">
              <span className="text-[11px] font-bold text-[#524344] uppercase tracking-wider block">
                Total Penerimaan
              </span>
              <div className="font-serif text-2xl font-bold text-[#3d1018] tracking-tight mt-0.5 tabular-nums">
                Rp {totalPenjualan.toLocaleString('id-ID')}
              </div>
            </div>

            {/* Proportion Progress Bar */}
            <div className="w-full h-3 rounded-full bg-[#f0ede9] overflow-hidden flex my-4">
              <div
                className="h-full bg-[#58252c] transition-all"
                style={{ width: `${tunaiPct}%` }}
              ></div>
              <div
                className="h-full bg-[#fc934f] transition-all"
                style={{ width: `${qrisPct}%` }}
              ></div>
            </div>

            {/* Breakdown List */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl hover:bg-[#f6f3ee] transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#58252c] inline-block"></span>
                  <span className="text-[#1c1c19] font-medium">
                    Tunai • {tunaiTrx.length} transaksi ({tunaiPct}%)
                  </span>
                </div>
                <span className="font-bold text-[#1c1c19] tabular-nums">
                  Rp {tunaiTotal.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl hover:bg-[#f6f3ee] transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#fc934f] inline-block"></span>
                  <span className="text-[#1c1c19] font-medium">
                    QRIS • {qrisTrx.length} transaksi ({qrisPct}%)
                  </span>
                </div>
                <span className="font-bold text-[#1c1c19] tabular-nums">
                  Rp {qrisTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Menu Terlaris & Transaksi Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Menu Terlaris (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-[#ebe8e3] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-serif text-lg font-bold text-[#1c1c19]">Menu terlaris</h2>
                <p className="text-xs text-[#524344]">Berdasarkan kuantitas transaksi lunas</p>
              </div>
            </div>

            {bestSellers.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined text-3xl text-[#c5bcb5]">restaurant_menu</span>
                <p className="text-xs font-semibold text-[#524344]">Belum ada menu terjual pada periode ini</p>
                <p className="text-[11px] text-[#847374] max-w-xs">Data menu terlaris otomatis terisi saat transaksi lunas diselesaikan.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#ebe8e3] space-y-3 mt-3">
                {bestSellers.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between pt-2.5 first:pt-0">
                    <div className="flex items-center gap-3">
                      {item.image ? (
                        <img
                          className="w-11 h-11 rounded-xl object-cover shadow-xs border border-[#ebe8e3]"
                          src={item.image}
                          alt={item.name}
                          width={44}
                          height={44}
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-[#f0ede9] flex items-center justify-center text-[#994703] font-serif font-bold text-sm">
                          {item.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-sm text-[#1c1c19]">{item.name}</h3>
                        <span className="text-xs text-[#524344]">{item.qty} porsi terjual</span>
                      </div>
                    </div>
                    <span className="font-bold text-sm text-[#3d1018] tabular-nums">
                      Rp {item.revenue.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 space-y-2 border-t border-[#ebe8e3]">
            <div className="flex items-center justify-between text-xs text-[#524344]">
              <span>Total item terjual</span>
              <span className="font-bold text-[#1c1c19]">{totalItemsSold} item</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveView('kelola-menu')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#f0ede9] hover:bg-[#ebe8e3] text-[#1c1c19] text-xs font-semibold transition-colors flex items-center justify-center gap-1 active:scale-95"
            >
              <span>Lihat kelola menu</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Transaksi Terbaru (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-[#ebe8e3] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-bold text-[#1c1c19]">Transaksi terbaru</h2>
              <button
                onClick={() => setActiveView('laporan')}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#3d1018] hover:underline"
              >
                <span>Lihat laporan</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            {/* Transaction Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[#524344] uppercase tracking-wider bg-[#f6f3ee] text-[10px] font-bold">
                    <th scope="col" className="py-2.5 px-3 rounded-l-xl">Pesanan</th>
                    <th scope="col" className="py-2.5 px-3">Tipe / Meja</th>
                    <th scope="col" className="py-2.5 px-3">Metode</th>
                    <th scope="col" className="py-2.5 px-3">Total</th>
                    <th scope="col" className="py-2.5 px-3 rounded-r-xl text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebe8e3]">
                  {filteredTrx.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-xs text-[#524344]">
                        Belum ada transaksi pada periode ini
                      </td>
                    </tr>
                  ) : (
                    filteredTrx.slice(0, 6).map((trx, idx) => (
                      <tr
                        key={trx.id}
                        className={`hover:bg-[#f6f3ee] transition-colors ${
                          idx === 0 ? 'bg-[#ffdadc]/30 font-medium' : ''
                        }`}
                      >
                        <td className="py-3 px-3 font-bold text-[#3d1018]">{trx.code}</td>
                        <td className="py-3 px-3 text-[#1c1c19]">{trx.typeMeja}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              trx.method === 'Tunai'
                                ? 'bg-amber-50 text-amber-900 border border-amber-300'
                                : 'bg-[#58252c] text-white'
                            }`}
                          >
                            {trx.method}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-[#1c1c19] tabular-nums">
                          Rp {trx.total.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="px-2 py-0.5 rounded-full bg-[#f0ede9] text-[#524344] text-[10px] font-semibold">
                            {trx.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
