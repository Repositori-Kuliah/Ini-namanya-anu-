import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TableItem, TableStatus } from '../types';
import { useLockBodyScroll } from '../../lib/useLockBodyScroll';
import { useScrollDirection } from '../../lib/useScrollDirection';

const MAX_BATCH_TABLES = 50;

const KelolaMejaViewInner: React.FC = () => {
  const isHeaderVisible = useScrollDirection();
  const { tables, updateTable, addTable, deleteTable, showToast } = useApp();

  const [filterMode, setFilterMode] = useState<'Semua' | 'Terisi' | 'Kosong'>('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Tambah Meja
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'single' | 'range'>('single');
  const [newTableNum, setNewTableNum] = useState('');
  const [addError, setAddError] = useState('');
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [isAddingTables, setIsAddingTables] = useState(false);

  // Modal / Panel Edit Meja
  const [editingTable, setEditingTable] = useState<TableItem | null>(null);
  const [editNumber, setEditNumber] = useState('');
  const [editStatus, setEditStatus] = useState<TableStatus>('kosong');
  const [editError, setEditError] = useState('');

  // Action dropdown & Delete confirm modal state
  const [openTableActionId, setOpenTableActionId] = useState<string | null>(null);
  const [deleteTableConfirm, setDeleteTableConfirm] = useState<TableItem | null>(null);

  // Kunci scroll background saat modal apa pun terbuka
  useLockBodyScroll(
    Boolean(showAddModal || editingTable || deleteTableConfirm)
  );

  const openEditModal = (tbl: TableItem) => {
    setEditingTable(tbl);
    setEditNumber(tbl.number);
    setEditStatus(tbl.status === 'kosong' ? 'kosong' : 'terisi');
    setEditError('');
  };

  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable) return;
    const trimmed = editNumber.trim();
    if (!trimmed) {
      setEditError('Nomor meja wajib diisi');
      showToast('Nomor meja wajib diisi', 'warning');
      return;
    }

    const num = parseInt(trimmed, 10);
    if (isNaN(num) || num <= 0) {
      setEditError('Nomor meja harus berupa angka minimal 1');
      showToast('Nomor meja harus berupa angka minimal 1', 'warning');
      return;
    }

    if (tables.some((t) => t.dbId !== editingTable.dbId && parseInt(t.number, 10) === num)) {
      setEditError(`Nomor meja ${num} sudah terdaftar`);
      showToast(`Nomor meja ${num} sudah terdaftar`, 'warning');
      return;
    }

    const updated: TableItem = {
      ...editingTable,
      number: trimmed.padStart(2, '0'),
      capacity: 4,
      area: 'Lantai 1',
      status: editStatus,
      statusLabel: editStatus === 'kosong' ? 'Tersedia' : 'Terisi',
    };

    const ok = await updateTable(updated, editStatus);
    if (ok) {
      setEditingTable(null);
    }
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setAddMode('single');
    setNewTableNum('');
    setAddError('');
    setRangeStart('');
    setRangeEnd('');
  };

  const handleCreateNewTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingTables) return;

    if (addMode === 'single') {
      const trimmed = newTableNum.trim();
      if (!trimmed) {
        setAddError('Nomor meja wajib diisi');
        showToast('Nomor meja wajib diisi', 'warning');
        return;
      }
      const num = parseInt(trimmed, 10);
      if (isNaN(num) || num <= 0) {
        setAddError('Nomor meja harus berupa angka minimal 1');
        showToast('Nomor meja harus berupa angka minimal 1', 'warning');
        return;
      }
      if (tables.some((t) => parseInt(t.number, 10) === num)) {
        setAddError(`Nomor meja ${num} sudah terdaftar`);
        showToast(`Nomor meja ${num} sudah terdaftar`, 'warning');
        return;
      }
      setIsAddingTables(true);
      try {
        const ok = await addTable(num, 4, 'Lantai 1');
        if (ok) closeAddModal();
      } finally {
        setIsAddingTables(false);
      }
      return;
    }

    const start = parseInt(rangeStart, 10);
    const end = parseInt(rangeEnd, 10);
    if (!start || start <= 0 || !end || end < start) {
      showToast('Masukkan rentang nomor meja yang valid (dari ≤ sampai)', 'warning');
      return;
    }
    const count = end - start + 1;
    if (count > MAX_BATCH_TABLES) {
      showToast(`Maksimal ${MAX_BATCH_TABLES} meja sekali tambah`, 'warning');
      return;
    }
    const existing = new Set(tables.map((t) => parseInt(t.number, 10)));
    const targets: number[] = [];
    for (let n = start; n <= end; n++) {
      if (!existing.has(n)) targets.push(n);
    }
    if (!targets.length) {
      showToast('Semua nomor meja dalam rentang sudah terdaftar', 'warning');
      return;
    }

    setIsAddingTables(true);
    let added = 0;
    try {
      for (const n of targets) {
        if (await addTable(n, 4, 'Lantai 1')) added++;
      }
    } finally {
      setIsAddingTables(false);
    }

    const skipped = count - targets.length;
    const failed = targets.length - added;
    const parts = [`${added} meja ditambahkan`];
    if (skipped) parts.push(`${skipped} dilewati (sudah ada)`);
    if (failed) parts.push(`${failed} gagal`);
    showToast(parts.join(', '), failed ? 'warning' : 'success');
    if (added > 0) closeAddModal();
  };

  const confirmDeleteTableAction = async (tbl: TableItem) => {
    const ok = await deleteTable(tbl.dbId || parseInt(tbl.number, 10));
    if (ok) {
      showToast(`Meja ${tbl.number} berhasil dihapus`, 'success');
    }
    setDeleteTableConfirm(null);
  };

  // Filter Meja
  const filtered = tables.filter((t) => {
    const matchSearch =
      t.number.includes(searchQuery) ||
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
      <div className="flex items-center justify-end gap-3 pb-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-3.5 py-2 rounded-xl bg-[#3d1018] hover:bg-[#58252c] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <span>Tambah Meja</span>
          </button>
        </div>
      </div>

      {/* Filter Bar (Sticky di Mobile: Hide on Scroll Down, Show on Scroll Up; Normal Static di Desktop) */}
      <div className={`bg-white/95 backdrop-blur-md p-3 rounded-xl border border-[#ebe8e3] flex flex-col md:flex-row md:items-center justify-between gap-3 sticky top-16 md:static z-20 shadow-xs transition-all duration-200 ease-out ${
        isHeaderVisible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'max-md:-translate-y-36 max-md:opacity-0 max-md:pointer-events-none'
      }`}>
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#847374] text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor meja..."
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
                  ? 'bg-[#3d1018] text-white shadow-xs'
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
        <div className="max-h-none md:max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar">
          {/* Tampilan Desktop Table */}
          <table className="hidden md:table w-full text-left text-xs border-collapse">
            <thead className="bg-[#f6f3ee] text-[#524344] uppercase tracking-wider text-[10px] font-bold border-b border-[#ebe8e3] sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-4 w-24">No. Meja</th>
                <th className="py-2.5 px-4 w-32">Status Meja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebe8e3]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-8 text-center text-xs text-[#847374]">
                    {searchQuery ? `Tidak ada meja yang cocok dengan pencarian ${searchQuery}.` : 'Tidak ada meja yang cocok.'}
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
                        <span className={`font-semibold text-xs ${isOccupied ? 'text-[#3d1018]' : 'text-[#847374]'}`}>
                          {isOccupied ? 'Terisi' : 'Tersedia'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Tampilan Mobile: Kartu Responsif */}
          <div className="md:hidden divide-y divide-[#ebe8e3]">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#847374] px-4">
                {searchQuery ? `Tidak ada meja yang cocok dengan pencarian ${searchQuery}.` : 'Tidak ada meja yang cocok.'}
              </div>
            ) : (
              filtered.map((tbl, idx) => {
                const isOccupied = tbl.status !== 'kosong';
                const isCheckout = tbl.status === 'checkout';

                return (
                  <div
                    key={tbl.dbId ? `mob-${tbl.dbId}` : `mob-${tbl.number}-${idx}`}
                    onClick={() => openEditModal(tbl)}
                    className="p-3.5 space-y-2 hover:bg-[#fcf9f4] transition-colors cursor-pointer active:bg-[#f5efe6]"
                    title="Klik untuk edit & kelola meja"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[11px] uppercase tracking-wider font-semibold text-[#847374]">Meja</span>
                        <span className="font-bold text-[#1c1c19] text-base tabular-nums">
                          {tbl.number}
                        </span>
                      </div>
                      <span className={`font-semibold text-xs ${isOccupied ? 'text-[#3d1018]' : 'text-[#847374]'}`}>
                        {isOccupied ? 'Terisi' : 'Tersedia'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
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
            noValidate
            className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl border border-[#ebe8e3] flex flex-col gap-3.5"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#ebe8e3]">
              <h3 id="add-table-title" className="font-bold text-base text-[#1c1c19]">
                Tambah Meja Restoran
              </h3>
              <button
                type="button"
                onClick={closeAddModal}
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
                  type="text"
                  inputMode="numeric"
                  value={newTableNum}
                  placeholder="Contoh: 15"
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '');
                    setNewTableNum(clean);
                    if (addError) setAddError('');
                  }}
                  className={`w-full px-3 py-2 bg-[#fcf9f4] rounded-lg border outline-none font-bold text-sm transition-colors ${
                    addError ? 'border-[#ba1a1a] bg-[#ffdadc]/20 focus:border-[#ba1a1a]' : 'border-[#ebe8e3] focus:border-[#3d1018]'
                  }`}
                />
                {addError && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-[#ba1a1a]">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    <span className="text-[11px] font-semibold">{addError}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-[#ebe8e3]">
              <button
                type="submit"
                disabled={isAddingTables}
                className="w-full py-2.5 rounded-xl bg-[#3d1018] text-white text-xs font-bold hover:bg-[#58252c] cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isAddingTables ? 'Menyimpan…' : 'Simpan Meja'}
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
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleSaveTable}
            noValidate
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
                  inputMode="numeric"
                  value={editNumber}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '');
                    setEditNumber(clean);
                    if (editError) setEditError('');
                  }}
                  className={`w-full px-3 py-2 bg-[#fcf9f4] rounded-lg border outline-none font-bold text-sm transition-colors ${
                    editError ? 'border-[#ba1a1a] bg-[#ffdadc]/20 focus:border-[#ba1a1a]' : 'border-[#ebe8e3] focus:border-[#3d1018]'
                  }`}
                />
                {editError && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-[#ba1a1a]">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    <span className="text-[11px] font-semibold">{editError}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-[#1c1c19] block mb-1">Status Operasional</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as TableStatus)}
                  className="w-full px-3 py-2 bg-[#fcf9f4] rounded-lg border border-[#ebe8e3] outline-none cursor-pointer focus:border-[#3d1018]"
                >
                  <option value="kosong">Tersedia</option>
                  <option value="terisi">Terisi</option>
                </select>
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
                className="px-3 py-2 rounded-lg text-xs font-bold text-white bg-[#ba1a1a] hover:bg-[#93000a] cursor-pointer flex items-center gap-1 transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>Hapus Meja</span>
              </button>
              <div className="flex items-center gap-2">
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
            <h3 className="text-base font-bold text-[#ba1a1a] text-center mb-1">
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
                className="flex-1 py-2 rounded-xl bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold cursor-pointer shadow-xs transition-colors"
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
