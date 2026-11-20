import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RESTAURANT_INFO } from '../data/menuData';
import { placeholderImage } from '../../lib/placeholder';
import confetti from 'canvas-confetti';

const PEDAS_TEXT: Record<string, string> = {
  '0': 'Tanpa sambal',
  '1': 'Pedas sedang',
  '2': 'Pedas mantap',
};

export const CartScreen: React.FC = () => {
  const {
    selectedTable,
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

  const [paymentMethod, setPaymentMethod] = useState<'cashier' | 'qris'>('cashier');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOrderSubmission = async () => {
    if (isSubmitting || cartItems.length === 0) return;
    setIsSubmitting(true);

    const ok = await submitOrder(paymentMethod, tableNotes);
    if (!ok) {
      setIsSubmitting(false);
      return;
    }

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#3d1018', '#994703', '#fc934f', '#ffdbc9'],
      });
    } catch {
      // abaikan
    }

    setTimeout(() => {
      setIsSubmitting(false);
      navigate('status');
    }, 400);
  };

  const getCustomizationSummary = (item: typeof cartItems[number]) => {
    const parts: string[] = [];
    if (item.customization?.kuah === 'pisah') parts.push('Kuah pisah');
    if (item.customization?.pedas && PEDAS_TEXT[item.customization.pedas]) {
      parts.push(PEDAS_TEXT[item.customization.pedas]);
    }
    if (item.customization?.sayur === 'pisah') parts.push('Sayur pisah');
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

  // State Keranjang Kosong
  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-16 pb-20 bg-[#fcf9f4] text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#f0ede9] text-[#3d1018] flex items-center justify-center mb-4 border border-[#ebe8e3]">
          <span className="material-symbols-outlined text-3xl">shopping_basket</span>
        </div>
        <h2 className="font-serif text-lg font-bold text-[#1c1c19]">
          Keranjang Masih Kosong
        </h2>
        <p className="font-sans text-xs text-[#6b5a5b] max-w-xs mt-1 mb-6">
          Anda belum memilih hidangan apapun. Silakan pilih hidangan lezat di menu kami.
        </p>
        <button
          type="button"
          onClick={() => navigate('menu')}
          className="h-11 px-6 rounded-2xl bg-[#3d1018] hover:bg-[#58252c] text-white font-bold text-xs flex items-center gap-2 active:scale-95 transition-all cursor-pointer shadow-xs"
        >
          <span className="material-symbols-outlined text-[18px]">restaurant_menu</span>
          <span>Buka Menu</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full pt-16 pb-32 min-h-screen bg-[#fcf9f4]">
      <div className="px-4 md:px-6 py-4 max-w-2xl mx-auto w-full space-y-4">
        {/* Banner Tombol Tambah Menu Lain */}
        <div className="flex items-center justify-between pb-1">
          <div>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#3d1018] tracking-tight">
              Ringkasan Pesanan
            </h2>
            <p className="font-sans text-xs text-[#6b5a5b]">
              Meja {selectedTable} • {cartCount} Porsi
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('menu')}
            className="h-9 px-3.5 rounded-xl bg-white border border-[#ebe8e3] text-[#3d1018] hover:bg-[#f0ede9] text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Tambah Menu</span>
          </button>
        </div>

        {/* Daftar Item di Keranjang */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#ebe8e3] shadow-xs divide-y divide-[#f0ede9]">
          {cartItems.map((item) => {
            const summary = getCustomizationSummary(item);
            return (
              <div key={item.cartItemId} className="py-4 first:pt-0 last:pb-0 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-[#f6f3ee] overflow-hidden shrink-0 border border-[#ebe8e3]">
                    <img
                      src={item.image || placeholderImage(item.name)}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = placeholderImage(item.name);
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif font-bold text-xs sm:text-sm text-[#1c1c19] truncate">
                        {item.name}
                      </h3>
                      <span className="font-serif font-extrabold text-xs sm:text-sm text-[#3d1018] tabular-nums shrink-0">
                        {formatRupiah(item.totalPrice)}
                      </span>
                    </div>

                    {/* Rincian Kustomisasi */}
                    {summary ? (
                      <p className="font-sans text-[11px] text-[#6b5a5b] mt-0.5 line-clamp-2">
                        {summary}
                      </p>
                    ) : (
                      <p className="font-sans text-[11px] text-[#847374] mt-0.5">Porsi Standar</p>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-2">
                      <button
                        type="button"
                        onClick={() => editCartItem(item)}
                        className="text-[11px] font-bold text-[#994703] hover:text-[#753400] underline underline-offset-2 cursor-pointer font-sans"
                      >
                        Ubah Racikan
                      </button>

                      {/* Stepper Jumlah */}
                      <div className="flex items-center bg-[#f0ede9] rounded-xl p-0.5 border border-[#ebe8e3]">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.quantity === 1) {
                              removeCartItem(item.cartItemId);
                            } else {
                              updateCartItemQty(item.cartItemId, -1);
                            }
                          }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#3d1018] hover:bg-white active:scale-95 cursor-pointer"
                          aria-label="Kurangi kuantitas"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {item.quantity === 1 ? 'delete' : 'remove'}
                          </span>
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-[#1c1c19] tabular-nums font-sans">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartItemQty(item.cartItemId, 1)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#3d1018] hover:bg-white active:scale-95 cursor-pointer"
                          aria-label="Tambah kuantitas"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pilihan Metode Pembayaran Kiosk */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#ebe8e3] shadow-xs space-y-3">
          <label className="block text-xs font-bold text-[#1c1c19] uppercase tracking-wider font-sans">
            Metode Pembayaran
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setPaymentMethod('cashier')}
              className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                paymentMethod === 'cashier'
                  ? 'border-[#3d1018] bg-[#3d1018] text-white shadow-xs'
                  : 'border-[#ebe8e3] bg-[#fcf9f4] hover:bg-[#f0ede9] text-[#1c1c19]'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="material-symbols-outlined text-[20px]">point_of_sale</span>
                {paymentMethod === 'cashier' && (
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                )}
              </div>
              <div>
                <div className="text-xs font-bold font-sans">Bayar di Kasir</div>
                <div className={`text-[10px] mt-0.5 ${paymentMethod === 'cashier' ? 'text-[#ffdbc9]' : 'text-[#6b5a5b]'}`}>
                  Tunai / Kartu
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('qris')}
              className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                paymentMethod === 'qris'
                  ? 'border-[#3d1018] bg-[#3d1018] text-white shadow-xs'
                  : 'border-[#ebe8e3] bg-[#fcf9f4] hover:bg-[#f0ede9] text-[#1c1c19]'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                {paymentMethod === 'qris' && (
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                )}
              </div>
              <div>
                <div className="text-xs font-bold font-sans">QRIS Instan</div>
                <div className={`text-[10px] mt-0.5 ${paymentMethod === 'qris' ? 'text-[#ffdbc9]' : 'text-[#6b5a5b]'}`}>
                  Gopay, BCA, OVO, dll
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Catatan Meja */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#ebe8e3] shadow-xs">
          <label className="block text-xs font-bold text-[#1c1c19] uppercase tracking-wider mb-2 font-sans">
            Catatan untuk Pesanan Ini (Opsional)
          </label>
          <input
            type="text"
            value={tableNotes}
            onChange={(e) => setTableNotes(e.target.value)}
            placeholder="Contoh: Minta sendok lebih / tisu tambahan..."
            className="w-full h-11 px-3.5 rounded-xl bg-[#fcf9f4] border border-[#ebe8e3] text-xs text-[#1c1c19] placeholder-[#847374] focus:outline-none focus:ring-2 focus:ring-[#3d1018] focus:bg-white font-sans"
          />
        </div>

        {/* Rincian Biaya */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#ebe8e3] shadow-xs space-y-2.5 text-xs text-[#6b5a5b] font-sans">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-[#1c1c19] tabular-nums">
              {formatRupiah(cartSubtotal)}
            </span>
          </div>
          {cartServiceFee > 0 && (
            <div className="flex justify-between">
              <span>Biaya Layanan</span>
              <span className="font-semibold text-[#1c1c19] tabular-nums">
                {formatRupiah(cartServiceFee)}
              </span>
            </div>
          )}
          {cartTax > 0 && (
            <div className="flex justify-between">
              <span>PB1 / Pajak Restoran (10%)</span>
              <span className="font-semibold text-[#1c1c19] tabular-nums">
                {formatRupiah(cartTax)}
              </span>
            </div>
          )}
          <div className="pt-2 border-t border-[#f0ede9] flex justify-between items-center text-sm">
            <span className="font-extrabold text-[#1c1c19]">Total Pembayaran</span>
            <span className="font-serif font-black text-[#3d1018] text-base tabular-nums">
              {formatRupiah(cartTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Sticky Bottom CTA Checkout */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-[#fcf9f4]/95 backdrop-blur-md border-t border-[#ebe8e3] p-4 pb-safe">
        <div className="w-full max-w-2xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={handleOrderSubmission}
            disabled={isSubmitting}
            className="w-full h-12 rounded-2xl bg-[#3d1018] hover:bg-[#58252c] disabled:bg-[#847374] text-white font-extrabold text-xs sm:text-sm flex items-center justify-between px-5 shadow-xs active:scale-98 transition-all cursor-pointer"
          >
            <span className="font-sans">{isSubmitting ? 'Mengirim Pesanan…' : 'Kirim Pesanan Sekarang'}</span>
            <span className="tabular-nums font-serif font-black">{formatRupiah(cartTotal)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
