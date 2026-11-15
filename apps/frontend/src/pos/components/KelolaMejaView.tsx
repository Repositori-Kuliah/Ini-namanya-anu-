import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TableItem, TableStatus } from '../types';
import { useLockBodyScroll } from '../../lib/useLockBodyScroll';

const KelolaMejaViewInner: React.FC = () => {
  const { tables, updateTable, addTable, deleteTable, openQrModal, showToast } = useApp();

  const [filterMode, setFilterMode] = useState<'Semua' | 'Terisi' | 'Kosong'>('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Tambah Meja
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableNum, setNewTableNum] = useState('');

  // Modal / Panel Edit Meja
  const [editingTable, setEditingTable] = useState<TableItem | null>(null);
  const [editNumber, setEditNumber] = useState('');
  const [editStatus, setEditStatus] = useState<TableStatus>('kosong');

  // Action dropdown & Delete confirm modal state
  const [openTableActionId, setOpenTableActionId] = useState<string | null>(null);
  const [deleteTableConfirm, setDeleteTableConfirm] = useState<TableItem | null>(null);

  // Kunci scroll background saat modal apa pun terbuka
  useLockBodyScroll(Boolean(showAddModal || editingTable || deleteTableConfirm));

  const openEditModal = (tbl: TableItem) => {
    setEditingTable(tbl);
    setEditNumber(tbl.number);
    setEditStatus(tbl.status);
  };

  const handleSaveTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable) return;
    if (!editNumber.trim()) {
      showToast('Nomor meja wajib diisi', 'warning');
      return;
    }

    const updated: TableItem = {
      ...editingTable,
      number: editNumber.trim(),
      capacity: 4,
      area: 'Lantai 1',
      status: editStatus,
      statusLabel:
        editStatus === 'kosong'
          ? 'Kosong'
          : editStatus === 'checkout'
          ? 'Minta Checkout'
          : editStatus === 'diproses'
          ? 'Diproses'
          : 'Terisi',
    };

    updateTable(updated);
    showToast(`Meja ${updated.number} berhasil diperbarui`, 'success');
    setEditingTable(null);
  };

  const handleCreateNewTable = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(newTableNum, 10);
    if (!num || num <= 0) {
      showToast('Masukkan nomor meja yang valid (angka positif)', 'warning');
      return;
    }
    if (tables.some((t) => parseInt(t.number, 10) === num)) {
      showToast(`Nomor meja ${num} sudah terdaftar`, 'warning');
      return;
    }
    const ok = await addTable(num, 4, 'Lantai 1');
    if (ok) {
      setShowAddModal(false);
      setNewTableNum('');
    }
  };

  const confirmDeleteTableAction = async (tbl: TableItem) => {
    const ok = await deleteTable(tbl.dbId || parseInt(tbl.number, 10));
    if (ok) {
      showToast(`Meja ${tbl.number} berhasil dihapus`, 'success');
    }
    setDeleteTableConfirm(null);
  };

  const handlePrintAllQr = () => {
    showToast('Semua stiker QR Meja siap dikirim ke printer label.', 'success');
  };

  // Filter Meja
  const filtered = tables.filter((t) => {
    const matchSearch =
      t.number.includes(searchQuery) ||
      t.qrCodeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.area && t.area.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchSearch) return false;
    if (filterMode === 'Semua') return true;
    if (filterMode === 'Kosong') return t.status === 'kosong';
    if (filterMode === 'Terisi') return t.status !== 'kosong';
    return true;
  });

  return (
    <div className="flex flex-col w-full pb-4 md:pb-8 max-w-[1600px] mx-auto px-4 sm:px-6 pt-3 space-y-4">
      {/* Header Halaman & Aksi Utama */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ebe8e3]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1c1c19] tracking-tight">
            Kelola Meja &amp; QR Code
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#3d1018] hover:bg-[#58252c] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Tambah Meja</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-[#ebe8e3] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#847374] text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor meja atau kode QR..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#fcf9f4] rounded-lg text-xs text-[#1c1c19] outline-none border border-[#ebe8e3] focus:border-[#3d1018]"
            aria-label="Cari meja"
          />
        </div>

        {/* Filter Status Meja */}
        <div className="flex items-center bg-[#f0ede9] p-1 rounded-lg">
          {(['Semua', 'Kosong', 'Terisi'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                filterMode === mode
                  ? 'bg-white text-[#3d1018] shadow-xs'
                  : 'text-[#524344] hover:text-[#1c1c19]'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Tabel Meja Compact dengan Scroll Mandiri */}
      <div className="bg-white rounded-xl border border-[#ebe8e3] shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#f6f3ee] text-[#524344] uppercase tracking-wider text-[10px] font-bold border-b border-[#ebe8e3] sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-4">No. Meja</th>
                <th className="py-2.5 px-4">Status Meja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebe8e3]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-8 text-center text-xs text-[#847374]">
                    Tidak ada meja yang cocok dengan pencarian &ldquo;{searchQuery}&rdquo;.
                  </td>
                </tr>
              ) : (
                filtered.map((tbl, idx) => {
                  const isOccupied = tbl.status !== 'kosong';
                  const isCheckout = tbl.status === 'checkout';

                  return (
                    <tr
                      key={tbl.dbId ? `row-${tbl.dbId}` : `row-${tbl.number}-${idx}`}
                      onClick={() => openEditModal(tbl)}
                      className="hover:bg-[#fcf9f4] transition-colors cursor-pointer"
                      title="Klik untuk edit &amp; kelola meja"
                    >
                      <td className="py-2.5 px-4 font-bold text-[#1c1c19] text-sm tabular-nums">
                        {tbl.number}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            isCheckout
                              ? 'bg-[#ffdbc9] text-[#753400]'
                              : isOccupied
                              ? 'bg-[#58252c] text-white'
                              : 'bg-[#f0ede9] text-[#524344]'
                          }`}
                        >
                          {tbl.statusLabel || (isOccupied ? 'Terisi' : 'Kosong')}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Meja */}
      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-table-title"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleCreateNewTable}
            className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl border border-[#ebe8e3] flex flex-col gap-3.5"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#ebe8e3]">
              <h3 id="add-table-title" className="font-bold text-base text-[#1c1c19]">
                Tambah Meja Restoran
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#524344] hover:bg-[#f0ede9]"
                aria-label="Tutup modal"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#1c1c19] block mb-1">Nomor Meja *</label>
                <input
                  type="number"
                  required
                  value={newTableNum}
                  onChange={(e) => setNewTableNum(e.target.value)}
                  placeholder="Contoh: 13"
                  className="w-full px-3 py-2 bg-[#fcf9f4] rounded-lg border border-[#ebe8e3] outline-none font-bold text-sm focus:border-[#3d1018]"
                />
                <p className="text-[11px] text-[#847374] mt-1.5">
                  Setiap meja otomatis dikonfigurasi dengan kapasitas standar 4 orang (tata letak lantai 1).
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#ebe8e3]">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 rounded-lg bg-[#f0ede9] text-[#1c1c19] text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-lg bg-[#3d1018] text-white text-xs font-bold hover:bg-[#58252c] cursor-pointer shadow-xs"
              >
                Simpan Meja
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Edit Meja */}
      {editingTable && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-table-title"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 touch-none"
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <form
            onSubmit={handleSaveTable}
            className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl border border-[#ebe8e3] flex flex-col gap-3.5"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#ebe8e3]">
              <h3 id="edit-table-title" className="font-bold text-base text-[#1c1c19]">
                Edit Meja {editingTable.number}
              </h3>
              <button
                type="button"
                onClick={() => setEditingTable(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#524344] hover:bg-[#f0ede9]"
                aria-label="Tutup modal"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#1c1c19] block mb-1">Nomor Meja</label>
                <input
                  type="text"
                  required
                  value={editNumber}
                  onChange={(e) => setEditNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-[#fcf9f4] rounded-lg border border-[#ebe8e3] outline-none font-bold text-sm focus:border-[#3d1018]"
                />
              </div>

              <div>
                <label className="font-bold text-[#1c1c19] block mb-1">Status Operasional</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as TableStatus)}
                  className="w-full px-3 py-2 bg-[#fcf9f4] rounded-lg border border-[#ebe8e3] outline-none cursor-pointer focus:border-[#3d1018]"
                >
                  <option value="kosong">Kosong (Tersedia)</option>
                  <option value="terisi">Terisi (Sedang Makan)</option>
                  <option value="diproses">Diproses</option>
                  <option value="checkout">Minta Checkout</option>
                </select>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const newQrId = `RG-M${editingTable.number}-${Math.floor(1000 + Math.random() * 9000)}`;
                    const updated = { ...editingTable, qrCodeId: newQrId };
                    showToast(`QR Code Meja ${editingTable.number} berhasil di-generate ulang!`, 'success');
                    setEditingTable(null);
                    openQrModal(updated);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#fcf9f4] hover:bg-[#f0ede9] border border-[#ebe8e3] text-xs font-semibold text-[#3d1018] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#994703]">sync</span>
                  <span>Generate Ulang QR Code Meja</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#ebe8e3]">
              <button
                type="button"
                onClick={() => {
                  if (editingTable.status !== 'kosong') {
                    showToast('Tidak bisa menghapus meja yang masih memiliki transaksi/tamu aktif!', 'warning');
                    return;
                  }
                  const tbl = editingTable;
                  setEditingTable(null);
                  setDeleteTableConfirm(tbl);
                }}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>Hapus Meja</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTable(null)}
                  className="px-3.5 py-2 rounded-lg bg-[#f0ede9] text-[#1c1c19] text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#3d1018] text-white text-xs font-bold hover:bg-[#58252c] cursor-pointer shadow-xs"
                >
                  Simpan
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Modal Peringatan Konfirmasi Hapus Meja */}
      {deleteTableConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-[#ebe8e3] animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>
            <h3 className="text-base font-bold text-[#1c1c19] text-center mb-1">
              Peringatan Konfirmasi Hapus
            </h3>
            <p className="text-xs text-[#524344] text-center mb-5 leading-relaxed">
              Apakah Anda yakin ingin menghapus <strong className="text-[#1c1c19]">Meja {deleteTableConfirm.number}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteTableConfirm(null)}
                className="flex-1 py-2 rounded-xl bg-[#f0ede9] hover:bg-[#ebe8e3] text-[#1c1c19] text-xs font-semibold cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => confirmDeleteTableAction(deleteTableConfirm)}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer shadow-xs transition-colors"
              >
                Hapus Meja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const KelolaMejaView: React.FC = () => {
  const { tables } = useApp();
  if (!tables.length) {
    return (
      <div className="p-10 text-center text-sm text-[#524344]">
        Belum ada meja aktif. Hubungkan database atau periksa data outlet.
      </div>
    );
  }
  return <KelolaMejaViewInner />;
};
