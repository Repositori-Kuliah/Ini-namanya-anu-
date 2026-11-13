import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RESTAURANT_INFO } from '../data/menuData';
import { placeholderImage } from '../../lib/placeholder';
import confetti from 'canvas-confetti';

const PEDAS_TEXT: Record<string, string> = {
  '0': 'Tidak pedas',
  '1': 'Pedas sedang',
  '2': 'Pedas mantap',
};

export const CartScreen: React.FC = () => {
  const {
    selectedTable,
    tableArea,
    cartItems,
    cartCount,
    cartSubtotal,
    cartServiceFee,
    cartTax,
    cartTotal,
    updateCartItemQty,
    removeCartItem,
    editCartItem,
    submitOrder,
    navigate,
    extraOptions,
    formatRupiah,
    tableNotes,
    setTableNotes,
  } = useApp();

  const [paymentMode, setPaymentMode] = useState<'qris' | 'cashier'>('cashier');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOrderSubmission = async () => {
    if (isSubmitting || cartItems.length === 0) return;
    setIsSubmitting(true);

    const ok = await submitOrder(paymentMode, tableNotes);
    if (!ok) {
      setIsSubmitting(false);
      return;
    }

    try {
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#3d1018', '#994703', '#fc934f', '#ffdbc9'],
      });
    } catch {
      // abaikan jika confetti tidak tersedia
    }

    setTimeout(() => {
      setIsSubmitting(false);
      navigate('status');
    }, 550);
  };

  const getCustomizationSummary = (item: typeof cartItems[number]) => {
    const parts: string[] = [];
    if (item.customization?.kuah === 'pisah') parts.push('Kuah dipisah');
    if (item.customization?.pedas && PEDAS_TEXT[item.customization.pedas]) {
      parts.push(PEDAS_TEXT[item.customization.pedas]);
    }
    if (item.customization?.sayur === 'pisah') parts.push('Sayur dipisah');
    if (item.customization?.extras?.length) {
      for (const ext of item.customization.extras) {
        const extraPrice = extraOptions.find((e) => e.name === ext)?.price ?? 0;
        parts.push(`+${ext}${extraPrice > 0 ? ` (${formatRupiah(extraPrice)})` : ''}`);
      }
    }
    if (item.customization?.kitchenNotes) {
      parts.push(`"${item.customization.kitchenNotes}"`);
    }
    return parts.join(' · ');
  };

  return (
    <div className="flex flex-col w-full pb-28 pt-16 bg-[#fcf9f4] min-h-screen">
      {/* Table & Branch Header Bar */}
      <div className="px-4 md:px-6 pt-3">
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-xs border border-[#ebe8e3]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#3d1018] text-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                table_restaurant
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-serif font-bold text-base text-[#1c1c19] truncate">
                Pesanan Meja {selectedTable}
              </p>
              <p className="font-sans text-xs text-[#524344] truncate">
                {RESTAURANT_INFO.branch}
              </p>
            </div>
          </div>
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className="px-4 md:px-6 pt-5">
          <div className="bg-white rounded-2xl p-8 sm:p-10 text-center border border-[#ebe8e3] shadow-xs space-y-3 max-w-lg mx-auto">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#f6f3ee] text-[#994703] flex items-center justify-center border border-[#ebe8e3]">
              <span className="material-symbols-outlined text-3xl" aria-hidden="true">
                shopping_bag
              </span>
            </div>
            <h2 className="font-serif font-bold text-lg text-[#1c1c19]">
              Keranjang Anda masih kosong
            </h2>
            <p className="font-sans text-xs text-[#524344] leading-relaxed">
              Pilih hidangan dan minuman favorit untuk dinikmati di Meja {selectedTable}.
            </p>
            <button
              type="button"
              onClick={() => navigate('menu')}
              className="mt-2 min-h-[44px] px-6 py-2.5 rounded-xl bg-[#3d1018] hover:bg-[#58252c] text-white font-sans font-bold text-xs shadow-xs cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none"
            >
              Buka Katalog Menu
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 md:px-6 pt-4 grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* Left Column: Cart Items + Table Notes */}
          <div className="md:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif font-bold text-base text-[#3d1018] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                  room_service
                </span>
                <span>Daftar Hidangan ({cartCount} Porsi)</span>
              </h2>
            </div>

            <div className="space-y-3">
              {cartItems.map((item) => {
                const summary = getCustomizationSummary(item);
                return (
                  <article
                    key={item.cartItemId}
                    className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-[#ebe8e3]"
                  >
                    <div className="flex gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        onError={(e) => {
                          const img = e.currentTarget;
                          if (!img.dataset.fallbackApplied) {
                            img.dataset.fallbackApplied = '1';
                            img.src = placeholderImage(item.name);
                          }
                        }}
                        className="w-20 h-20 rounded-xl object-cover shrink-0 bg-[#f6f3ee] border border-[#ebe8e3]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-serif font-bold text-sm sm:text-base text-[#1c1c19] leading-snug">
                            {item.name}
                          </h3>
                          <span className="font-serif font-bold text-sm sm:text-base text-[#3d1018] shrink-0 tabular-nums">
                            {formatRupiah(item.totalPrice)}
                          </span>
                        </div>
                        <p className="font-sans text-[11px] text-[#524344] mt-0.5 tabular-nums">
                          {item.subtitleDesc || `${item.quantity}x porsi (${formatRupiah(item.basePrice)})`}
                        </p>
                        {summary && (
                          <p className="font-sans text-[11px] text-[#994703] font-medium mt-1.5 leading-relaxed">
                            {summary}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Steppers & Action Links */}
                    <div className="mt-3 pt-2.5 flex items-center justify-between gap-2 border-t border-[#f0ede9]">
                      <div className="flex items-center gap-1.5 bg-[#fcf9f4] p-1 rounded-xl border border-[#ebe8e3]">
                        <button
                          type="button"
                          aria-label={`Kurangi jumlah ${item.name}`}
                          onClick={() => updateCartItemQty(item.cartItemId, -1)}
                          className="w-9 h-9 rounded-lg bg-[#f0ede9] hover:bg-[#ebe8e3] flex items-center justify-center text-[#1c1c19] active:scale-95 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none"
                        >
                          <span className="material-symbols-outlined text-[17px]" aria-hidden="true">
                            remove
                          </span>
                        </button>
                        <span
                          aria-live="polite"
                          className="font-sans font-bold text-sm text-[#3d1018] w-7 text-center tabular-nums"
                        >
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Tambah jumlah ${item.name}`}
                          onClick={() => updateCartItemQty(item.cartItemId, 1)}
                          className="w-9 h-9 rounded-lg bg-[#3d1018] hover:bg-[#58252c] flex items-center justify-center text-white active:scale-95 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none"
                        >
                          <span className="material-symbols-outlined text-[17px]" aria-hidden="true">
                            add
                          </span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => editCartItem(item)}
                          aria-label={`Ubah opsi ${item.name}`}
                          className="min-h-[44px] px-3 rounded-xl font-sans text-xs font-semibold text-[#524344] hover:text-[#3d1018] hover:bg-[#f0ede9] flex items-center gap-1 cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none"
                        >
                          <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                            tune
                          </span>
                          <span>Ubah</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCartItem(item.cartItemId)}
                          aria-label={`Hapus ${item.name} dari keranjang`}
                          className="min-h-[44px] px-3 rounded-xl font-sans text-xs font-semibold text-[#ba1a1a] hover:bg-[#ffdadc]/40 flex items-center gap-1 cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-[#ba1a1a] focus-visible:outline-none"
                        >
                          <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                            delete
                          </span>
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Catatan Meja untuk Dapur & Pelayan */}
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#ebe8e3] space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="table-notes"
                  className="font-serif font-bold text-sm text-[#1c1c19] flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[#994703] text-[18px]" aria-hidden="true">
                    edit_note
                  </span>
                  <span>Catatan Meja untuk Dapur &amp; Pelayan</span>
                </label>
                <span className="text-[11px] text-[#847374] tabular-nums">
                  {tableNotes.length}/100
                </span>
              </div>
              <textarea
                id="table-notes"
                value={tableNotes}
                onChange={(e) => setTableNotes(e.target.value)}
                maxLength={100}
                rows={2}
                placeholder="Contoh: Tolong pisahkan sendok garpu, tidak pakai daun bawang..."
                className="w-full bg-[#fcf9f4] rounded-xl p-3 font-sans text-xs text-[#1c1c19] placeholder:text-[#847374] border border-[#ebe8e3] focus:outline-none focus:ring-2 focus:ring-[#3d1018] transition-colors resize-none"
              />
              <p className="font-sans text-[11px] text-[#524344] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-[#994703]" aria-hidden="true">
                  info
                </span>
                <span>Catatan ini akan langsung diteruskan ke dapur bersama pesanan Anda.</span>
              </p>
            </div>
          </div>

          {/* Right Column: Payment Preference + POS Financial Breakdown + Submit CTA */}
          <div className="md:col-span-5 md:sticky md:top-20 space-y-4">
            {/* Preferensi Metode Pembayaran */}
            <fieldset className="bg-white rounded-2xl p-4 shadow-xs border border-[#ebe8e3] space-y-3">
              <legend className="font-serif font-bold text-sm text-[#3d1018] px-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  payments
                </span>
                <span>Preferensi Pembayaran</span>
              </legend>

              <div className="space-y-2.5">
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl cursor-pointer transition-colors border ${
                    paymentMode === 'qris'
                      ? 'bg-[#f0ede9] border-[#3d1018]'
                      : 'bg-[#fcf9f4] border-[#ebe8e3] hover:bg-[#f6f3ee]'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_mode"
                    value="qris"
                    checked={paymentMode === 'qris'}
                    onChange={() => setPaymentMode('qris')}
                    className="mt-0.5 w-4 h-4 accent-[#3d1018] cursor-pointer shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="font-sans font-bold text-xs text-[#1c1c19] block">
                      Bayar via QRIS (Konfirmasi Kasir)
                    </span>
                    <p className="font-sans text-[11px] text-[#524344] mt-1 leading-relaxed">
                      Pesanan langsung dikirim ke dapur. Kasir akan menyediakan kode QRIS untuk menyelesaikan pembayaran Anda.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl cursor-pointer transition-colors border ${
                    paymentMode === 'cashier'
                      ? 'bg-[#f0ede9] border-[#3d1018]'
                      : 'bg-[#fcf9f4] border-[#ebe8e3] hover:bg-[#f6f3ee]'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_mode"
                    value="cashier"
                    checked={paymentMode === 'cashier'}
                    onChange={() => setPaymentMode('cashier')}
                    className="mt-0.5 w-4 h-4 accent-[#3d1018] cursor-pointer shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="font-sans font-bold text-xs text-[#1c1c19] block">
                      Bayar Nanti di Kasir (Tunai / Kartu)
                    </span>
                    <p className="font-sans text-[11px] text-[#524344] mt-1 leading-relaxed">
                      Pesanan langsung dikirim ke dapur, pembayaran diselesaikan di kasir setelah Anda selesai bersantap.
                    </p>
                  </div>
                </label>
              </div>
            </fieldset>

            {/* Rincian Pembayaran (Selaras dengan POS CheckoutView) */}
            <section
              aria-label="Rincian Pembayaran"
              className="bg-white rounded-2xl shadow-xs border border-[#ebe8e3] overflow-hidden"
            >
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-sm text-[#3d1018]">
                    Rincian Tagihan
                  </h3>
                  <span className="font-sans text-[11px] text-[#524344] font-semibold">
                    Meja {selectedTable}
                  </span>
                </div>

                <div className="space-y-2 font-sans text-xs border-t border-[#f0ede9] pt-3">
                  <div className="flex justify-between items-center text-[#524344]">
                    <span>Subtotal Menu</span>
                    <span className="font-semibold text-[#1c1c19] tabular-nums">
                      {formatRupiah(cartSubtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[#524344]">
                    <span>Biaya Layanan Meja (5%)</span>
                    <span className="font-semibold text-[#1c1c19] tabular-nums">
                      {formatRupiah(cartServiceFee)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[#524344]">
                    <span>PB1 Pajak Daerah (10%)</span>
                    <span className="font-semibold text-[#1c1c19] tabular-nums">
                      {formatRupiah(cartTax)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#f6f3ee] px-4 py-3.5 flex items-center justify-between border-t border-[#ebe8e3]">
                <div>
                  <span className="font-sans text-[10px] text-[#524344] block uppercase tracking-wider font-bold">
                    Total Pembayaran
                  </span>
                  <span className="font-serif text-2xl font-bold text-[#3d1018] leading-tight tabular-nums">
                    {formatRupiah(cartTotal)}
                  </span>
                </div>
                <span className="material-symbols-outlined text-[#994703] text-[24px]" aria-hidden="true">
                  receipt_long
                </span>
              </div>
            </section>

            {/* Verification Info + Primary Submit CTA */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#f6f3ee] text-[#524344] border border-[#ebe8e3]">
                <span
                  className="material-symbols-outlined text-[#994703] text-[18px] shrink-0"
                  aria-hidden="true"
                >
                  verified_user
                </span>
                <p className="font-sans text-[11px] leading-snug">
                  Pesanan terhubung langsung ke <strong className="text-[#3d1018]">Meja {selectedTable}</strong> sesuai kode QR yang Anda pindai.
                </p>
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleOrderSubmission}
                className="w-full h-12 bg-[#3d1018] hover:bg-[#58252c] text-white rounded-xl font-sans font-bold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all cursor-pointer disabled:opacity-80 focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]" aria-hidden="true">
                      progress_activity
                    </span>
                    <span>Mengirim Pesanan...</span>
                  </>
                ) : (
                  <>
                    <span>Kirim Pesanan ke Dapur</span>
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                      arrow_forward
                    </span>
                  </>
                )}
              </button>

              <p className="text-center font-sans text-[11px] text-[#524344] flex items-center justify-center gap-1.5 font-medium">
                <span className="material-symbols-outlined text-[14px] text-[#994703]" aria-hidden="true">
                  schedule
                </span>
                <span>Estimasi penyajian: 12 – 18 menit</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
