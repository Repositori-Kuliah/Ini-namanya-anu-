import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MenuItem } from '../types';
import { useLockBodyScroll } from '../../lib/useLockBodyScroll';
import { publicAsset } from '../../lib/publicAsset';
import { useScrollDirection } from '../../lib/useScrollDirection';

const KelolaMenuViewInner: React.FC = () => {
  const {
    menuItems,
    menuCategories,
    updateMenuItem,
    addMenuItem,
    deleteMenuItem,
    showToast,
  } = useApp();

  const isHeaderVisible = useScrollDirection();

  // --- State Katalog Menu ---
  const [searchMenuQuery, setSearchMenuQuery] = useState('');
  const [filterMenuCategory, setFilterMenuCategory] = useState('Semua');
  const [filterMenuAvailability, setFilterMenuAvailability] = useState<'semua' | 'tersedia' | 'habis'>('semua');

  // Modal Tambah Menu
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<string>(menuCategories[0] || 'Menu Nusantara');
  const [newPrice, setNewPrice] = useState('25000');
  const [newDescription, setNewDescription] = useState('');
  const [newImage, setNewImage] = useState('');
  const [newIsRecommended, setNewIsRecommended] = useState(false);
  const [isDraggingNew, setIsDraggingNew] = useState(false);
  const [showNewUrlInput, setShowNewUrlInput] = useState(false);
  const fileInputNewRef = useRef<HTMLInputElement>(null);

  // Modal Edit Menu
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editIsRecommended, setEditIsRecommended] = useState(false);
  const [editIsAvailable, setEditIsAvailable] = useState(true);
  const [isDraggingEdit, setIsDraggingEdit] = useState(false);
  const [showEditUrlInput, setShowEditUrlInput] = useState(false);
  const fileInputEditRef = useRef<HTMLInputElement>(null);

  const handleImageFile = (file: File, setter: (url: string) => void) => {
    if (!file.type.startsWith('image/')) {
      showToast('Harap pilih file gambar (JPG, PNG, WebP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        setter(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Modals Peringatan Konfirmasi Hapus
  const [deleteMenuConfirm, setDeleteMenuConfirm] = useState<MenuItem | null>(null);

  // Active action menu id
  const [openMenuActionId, setOpenMenuActionId] = useState<string | number | null>(null);

  // Kunci scroll background saat modal apa pun terbuka
  const isAnyModalOpen = Boolean(showAddMenuModal || editingItem || deleteMenuConfirm);
  useLockBodyScroll(isAnyModalOpen);

  // Hitung jumlah menu favorit
  const favoriteMenuCount = useMemo(
    () => menuItems.filter((i) => i.isFavorite || i.isRecommended).length,
    [menuItems]
  );

  // --- Filter Logic: Menu ---
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch =
      (item.name || '').toLowerCase().includes(searchMenuQuery.toLowerCase()) ||
      (item.code || '').toLowerCase().includes(searchMenuQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterMenuCategory === 'Favorit') {
      if (!item.isFavorite && !item.isRecommended) return false;
    } else if (filterMenuCategory !== 'Semua' && item.category !== filterMenuCategory) {
      return false;
    }

    if (filterMenuAvailability === 'tersedia' && !item.isAvailable) return false;
    if (filterMenuAvailability === 'habis' && item.isAvailable) return false;

    return true;
  });

  // --- Handlers: Menu ---
  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditPrice(item.price.toString());
    setEditDescription(item.description || '');
    setEditImage(item.image || '');
    setEditIsRecommended(Boolean(item.isRecommended || item.isFavorite));
    setEditIsAvailable(item.isAvailable !== false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const priceNum = parseInt(editPrice.replace(/[^0-9]/g, ''), 10);
    if (!editName.trim() || isNaN(priceNum) || priceNum < 0) {
      showToast('Nama wajib diisi dan harga harus angka positif', 'warning');
      return;
    }

    const updated: MenuItem = {
      ...editingItem,
      name: editName.trim(),
      category: editCategory,
      price: priceNum,
      description: editDescription.trim(),
      image: editImage.trim() || editingItem.image || publicAsset('logo-rawon.png'),
      isRecommended: editIsRecommended,
      isFavorite: editIsRecommended,
      isAvailable: editIsAvailable,
    };

    updateMenuItem(updated);
    setEditingItem(null);
    showToast(`Menu "${updated.name}" berhasil diperbarui`, 'success');
  };

  const handleToggleAvailability = (item: MenuItem) => {
    const updated: MenuItem = { ...item, isAvailable: !item.isAvailable };
    updateMenuItem(updated);
    showToast(`Status "${item.name}" diubah jadi ${updated.isAvailable ? 'Tersedia' : 'Habis'}`, 'info');
  };

  const handleDeleteMenu = async (item: MenuItem) => {
    const ok = await deleteMenuItem(item.dbId || item.id);
    if (ok) {
      showToast(`Menu "${item.name}" berhasil dihapus`, 'success');
    }
  };

  const handleCreateMenu = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseInt(newPrice.replace(/[^0-9]/g, ''), 10);
    if (!newName.trim() || isNaN(priceNum) || priceNum < 0) {
      showToast('Nama menu wajib diisi dan harga harus angka positif', 'warning');
      return;
    }

    const generatedCode = `MN${String(menuItems.length + 1).padStart(3, '0')}`;
    const newItem: MenuItem = {
      id: `menu-custom-${Date.now()}`,
      code: generatedCode,
      name: newName.trim(),
      category: newCategory,
      price: priceNum,
      description: newDescription.trim(),
      image: newImage.trim() || publicAsset('logo-rawon.png'),
      isAvailable: true,
      isFavorite: newIsRecommended,
      isRecommended: newIsRecommended,
    };

    addMenuItem(newItem);
    setShowAddMenuModal(false);
    setNewName('');
    setNewPrice('25000');
    setNewDescription('');
    setNewImage('');
    setNewIsRecommended(false);
    showToast(`Menu "${newItem.name}" berhasil ditambahkan!`, 'success');
  };

  return (
    <div className="flex flex-col w-full pb-4 md:pb-8 max-w-[1600px] mx-auto px-4 sm:px-6 pt-3 space-y-4">
      {/* Header Halaman & Tombol Aksi */}
      <div className="flex items-center justify-end pb-1">
        <button
          type="button"
          onClick={() => setShowAddMenuModal(true)}
          className="inline-flex items-center px-3.5 py-2 rounded-xl bg-[#3d1018] hover:bg-[#58252c] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <span>Tambah Menu</span>
        </button>
      </div>

      {/* =========================================================================
          KATALOG MENU RESTORAN (Tersedia / Habis On-Off Toggle Cepat)
         ========================================================================= */}
      <section aria-label="Katalog Menu" className="space-y-3">
        {/* Baris Filter & Search Menu (Sticky di Mobile: Hide on Scroll Down, Show on Scroll Up; Normal Static di Desktop) */}
        <div className={`bg-white/95 backdrop-blur-md p-3 rounded-xl border border-[#ebe8e3] flex flex-col md:flex-row md:items-center justify-between gap-3 sticky top-16 md:static z-20 shadow-xs transition-all duration-200 ease-out ${
          isHeaderVisible
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : 'max-md:-translate-y-36 max-md:opacity-0 max-md:pointer-events-none'
        }`}>
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#847374] text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchMenuQuery}
              onChange={(e) => setSearchMenuQuery(e.target.value)}
              placeholder="Cari nama menu atau kode..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#fcf9f4] rounded-lg text-xs text-[#1c1c19] outline-none border border-[#ebe8e3] focus:border-[#3d1018]"
              aria-label="Cari menu"
            />
          </div>

          <div className="flex items-center gap-2 text-xs w-full md:w-auto">
            {/* Filter Kategori */}
            <div className="flex-1 md:flex-initial flex items-center gap-1.5">
              <span className="text-[#847374] text-[11px] font-medium hidden sm:inline">Kategori:</span>
              <select
                value={filterMenuCategory}
                onChange={(e) => setFilterMenuCategory(e.target.value)}
                className="w-full md:w-auto bg-[#fcf9f4] border border-[#ebe8e3] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#1c1c19] outline-none cursor-pointer focus:border-[#3d1018]"
              >
                <option value="Semua">Semua Kategori</option>
                <option value="Favorit">Favorit</option>
                {menuCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Ketersediaan */}
            <div className="flex-1 md:flex-initial flex items-center gap-1.5">
              <span className="text-[#847374] text-[11px] font-medium hidden sm:inline">Status:</span>
              <select
                value={filterMenuAvailability}
                onChange={(e) => setFilterMenuAvailability(e.target.value as any)}
                className="w-full md:w-auto bg-[#fcf9f4] border border-[#ebe8e3] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#1c1c19] outline-none cursor-pointer focus:border-[#3d1018]"
              >
                <option value="semua">Semua Status</option>
                <option value="tersedia">Tersedia</option>
                <option value="habis">Habis</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabel Menu Compact */}
        <div className="bg-white rounded-xl border border-[#ebe8e3] shadow-xs overflow-hidden">
          <div className="max-h-none md:max-h-[calc(100vh-270px)] overflow-y-auto custom-scrollbar">
            {/* Desktop View (Tampil pada layar >= md) */}
            <table className="hidden md:table w-full text-left text-xs border-collapse">
              <thead className="bg-[#f6f3ee] text-[#524344] uppercase tracking-wider text-[10px] font-bold border-b border-[#ebe8e3] sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-4">Nama Menu</th>
                  <th className="py-2.5 px-4">Kategori</th>
                  <th className="py-2.5 px-4">Harga Jual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebe8e3]">
                {filteredMenuItems.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-xs text-[#847374]">
                      Tidak ada menu yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredMenuItems.map((item) => {
                    return (
                      <tr
                        key={item.id}
                        onClick={() => handleOpenEdit(item)}
                        className="hover:bg-[#fcf9f4] transition-colors cursor-pointer"
                        title="Klik untuk edit &amp; kelola menu"
                      >
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#1c1c19] block leading-tight">
                              {item.name}
                            </span>
                            {!item.isAvailable && (
                              <span className="px-1.5 py-0.2 rounded bg-[#ffdadc] text-[#ba1a1a] text-[10px] font-bold shrink-0">
                                Habis
                              </span>
                            )}
                            {Boolean(item.isRecommended || item.isFavorite) && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-bold shrink-0 flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[11px] text-amber-600">star</span>
                                <span>Favorit</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-[#524344] font-medium">{item.category}</td>
                        <td className="py-2.5 px-4 font-bold text-[#3d1018] tabular-nums">
                          Rp {item.price.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Mobile View (Tampil pada layar < md) */}
            <div className="md:hidden divide-y divide-[#ebe8e3]">
              {filteredMenuItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#847374] px-4">
                  Tidak ada menu yang sesuai dengan filter.
                </div>
              ) : (
                filteredMenuItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleOpenEdit(item)}
                    className="p-3.5 space-y-1.5 hover:bg-[#fcf9f4] transition-colors cursor-pointer active:bg-[#f5efe6]"
                    title="Klik untuk edit & kelola menu"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-[#1c1c19] leading-tight">
                          {item.name}
                        </span>
                        {!item.isAvailable && (
                          <span className="px-1.5 py-0.2 rounded bg-[#ffdadc] text-[#ba1a1a] text-[10px] font-bold shrink-0">
                            Habis
                          </span>
                        )}
                        {Boolean(item.isRecommended || item.isFavorite) && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-bold shrink-0 flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[11px] text-amber-600">star</span>
                            <span>Favorit</span>
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-xs text-[#3d1018] tabular-nums shrink-0">
                        Rp {item.price.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#847374] font-medium">
                      {item.category}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          MODALS
         ========================================================================= */}

      {/* Modal Tambah Menu */}
      {showAddMenuModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-menu-title"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 lg:cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget && typeof window !== 'undefined' && window.innerWidth >= 1024) {
              setShowAddMenuModal(false);
            }
          }}
        >
          <form
            onSubmit={handleCreateMenu}
            className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl border border-[#ebe8e3] flex flex-col gap-3.5 cursor-default"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#ebe8e3]">
              <h3 id="add-menu-title" className="font-bold text-base text-[#1c1c19]">
                Tambah Menu Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowAddMenuModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#524344] hover:bg-[#f0ede9]"
                aria-label="Tutup modal"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#1c1c19] block mb-1">Nama Menu *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Nasi Rawon Daging Spesial"
                  className="w-full px-3 py-2 bg-[#fcf9f4] rounded-lg border border-[#ebe8e3] outline-none focus:border-[#3d1018]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-[#1c1c19] block mb-1">Kategori *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#fcf9f4] rounded-lg border border-[#ebe8e3] outline-none cursor-pointer focus:border-[#3d1018]"
                  >
                    {menuCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#1c1c19] block mb-1">Harga Jual (Rp) *</label>
                  <input
                    type="text"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="25000"
                    className="w-full px-3 py-2 bg-[#fcf9f4] rounded-lg border border-[#ebe8e3] outline-none tabular-nums focus:border-[#3d1018]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#1c1c19] block mb-1">Deskripsi Singkat</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={2}
                  placeholder="Deskripsi bahan atau keistimewaan hidangan..."
                  className="w-full px-3 py-2 bg-[#fcf9f4] rounded-lg border border-[#ebe8e3] outline-none resize-none focus:border-[#3d1018]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-[#1c1c19] text-xs">Foto / Gambar Hidangan</label>
                  <button
                    type="button"
                    onClick={() => setShowNewUrlInput(!showNewUrlInput)}
                    className="text-[11px] text-[#994703] hover:underline font-semibold cursor-pointer"
                  >
                    {showNewUrlInput ? 'Gunakan Upload File' : 'Gunakan Tautan URL'}
                  </button>
                </div>

                <input
                  ref={fileInputNewRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleImageFile(e.target.files[0], setNewImage);
                  }}
                />

                {showNewUrlInput ? (
                  <input
                    type="text"
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    placeholder="https://... atau /assets/... (Opsional)"
                    className="w-full px-3 py-2 bg-[#fcf9f4] rounded-lg border border-[#ebe8e3] text-xs outline-none focus:border-[#3d1018]"
                  />
                ) : newImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-[#ebe8e3] bg-stone-100 h-28 flex items-center justify-center group">
                    <img src={newImage} alt="Preview Menu" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                      <button
                        type="button"
                        onClick={() => fileInputNewRef.current?.click()}
                        className="px-2.5 py-1 rounded-md bg-white text-xs font-bold text-[#1c1c19] hover:bg-stone-100 cursor-pointer shadow"
                      >
                        Ganti Foto
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewImage('')}
                        className="px-2.5 py-1 rounded-md bg-[#ba1a1a] text-xs font-bold text-white hover:bg-[#93000a] cursor-pointer shadow"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingNew(true);
                    }}
                    onDragLeave={() => setIsDraggingNew(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingNew(false);
                      if (e.dataTransfer.files?.[0]) handleImageFile(e.dataTransfer.files[0], setNewImage);
                    }}
                    onClick={() => fileInputNewRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                      isDraggingNew
                        ? 'border-[#3d1018] bg-[#3d1018]/5'
                        : 'border-[#ebe8e3] hover:border-[#994703] bg-[#fcf9f4]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl text-[#994703] block mb-1">
                      cloud_upload
                    </span>
                    <p className="text-xs font-bold text-[#1c1c19]">Tarik &amp; lepas gambar hidangan di sini</p>
                    <p className="text-[11px] text-[#847374] mt-0.5">atau klik untuk memilih file dari komputer</p>
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={newIsRecommended}
                  onChange={(e) => setNewIsRecommended(e.target.checked)}
                  className="w-4 h-4 rounded text-[#3d1018] accent-[#3d1018] cursor-pointer"
                />
                <span className="font-semibold text-[#1c1c19]">Menu Favorit (Tandai Masuk Kategori Favorit)</span>
              </label>
            </div>

            <div className="pt-2 border-t border-[#ebe8e3]">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#3d1018] text-white text-xs font-bold hover:bg-[#58252c] cursor-pointer shadow-xs"
              >
                Simpan Menu
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Edit Menu */}
      {editingItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-menu-title"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 lg:cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget && typeof window !== 'undefined' && window.innerWidth >= 1024) {
              setEditingItem(null);
            }
          }}
        >
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl border border-[#ebe8e3] flex flex-col gap-3.5 cursor-default"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#ebe8e3]">
              <h3 id="edit-menu-title" className="font-bold text-base text-[#1c1c19]">
                Edit Menu: {editingItem.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#524344] hover:bg-[#f0ede9]"
                aria-label="Tutup modal"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#1c1c19] block mb-1">Nama Menu *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#fcf9f4] rounded-lg border border-[#ebe8e3] outline-none focus:border-[#3d1018]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-[#1c1c19] block mb-1">Kategori *</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#fcf9f4] rounded-lg border border-[#ebe8e3] outline-none cursor-pointer focus:border-[#3d1018]"
                  >
                    {menuCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#1c1c19] block mb-1">Harga (Rp) *</label>
                  <input
                    type="text"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-[#fcf9f4] rounded-lg border border-[#ebe8e3] outline-none tabular-nums focus:border-[#3d1018]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#1c1c19] block mb-1">Deskripsi</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-[#fcf9f4] rounded-lg border border-[#ebe8e3] outline-none resize-none focus:border-[#3d1018]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-[#1c1c19] text-xs">Foto / Gambar Hidangan</label>
                  <button
                    type="button"
                    onClick={() => setShowEditUrlInput(!showEditUrlInput)}
                    className="text-[11px] text-[#994703] hover:underline font-semibold cursor-pointer"
                  >
                    {showEditUrlInput ? 'Gunakan Upload File' : 'Gunakan Tautan URL'}
                  </button>
                </div>

                <input
                  ref={fileInputEditRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleImageFile(e.target.files[0], setEditImage);
                  }}
                />

                {showEditUrlInput ? (
                  <input
                    type="text"
                    value={editImage}
                    onChange={(e) => setEditImage(e.target.value)}
                    placeholder="https://... atau /assets/... (Opsional)"
                    className="w-full px-3 py-2 bg-[#fcf9f4] rounded-lg border border-[#ebe8e3] text-xs outline-none focus:border-[#3d1018]"
                  />
                ) : editImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-[#ebe8e3] bg-stone-100 h-28 flex items-center justify-center group">
                    <img src={editImage} alt="Preview Menu" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                      <button
                        type="button"
                        onClick={() => fileInputEditRef.current?.click()}
                        className="px-2.5 py-1 rounded-md bg-white text-xs font-bold text-[#1c1c19] hover:bg-stone-100 cursor-pointer shadow"
                      >
                        Ganti Foto
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditImage('')}
                        className="px-2.5 py-1 rounded-md bg-[#ba1a1a] text-xs font-bold text-white hover:bg-[#93000a] cursor-pointer shadow"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingEdit(true);
                    }}
                    onDragLeave={() => setIsDraggingEdit(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingEdit(false);
                      if (e.dataTransfer.files?.[0]) handleImageFile(e.dataTransfer.files[0], setEditImage);
                    }}
                    onClick={() => fileInputEditRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                      isDraggingEdit
                        ? 'border-[#3d1018] bg-[#3d1018]/5'
                        : 'border-[#ebe8e3] hover:border-[#994703] bg-[#fcf9f4]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl text-[#994703] block mb-1">
                      cloud_upload
                    </span>
                    <p className="text-xs font-bold text-[#1c1c19]">Tarik &amp; lepas gambar hidangan di sini</p>
                    <p className="text-[11px] text-[#847374] mt-0.5">atau klik untuk memilih file dari komputer</p>
                  </div>
                )}
              </div>

              {/* Saklar Toggle 1: Status Ketersediaan Menu */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#fcf9f4] border border-[#ebe8e3]">
                <div>
                  <span className="font-bold text-xs text-[#1c1c19] block">
                    Status Ketersediaan
                  </span>
                  <span className="text-[11px] text-[#524344]">
                    {editIsAvailable ? 'Menu Tersedia (dapat dipesan)' : 'Menu Habis (tidak dapat dipesan)'}
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={editIsAvailable}
                  onClick={() => setEditIsAvailable(!editIsAvailable)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    editIsAvailable ? 'bg-[#3d1018]' : 'bg-[#d8d4ce]'
                  }`}
                  aria-label="Ubah status ketersediaan"
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      editIsAvailable ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Saklar Toggle 2: Menu Favorit */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#fcf9f4] border border-[#ebe8e3]">
                <div>
                  <span className="font-bold text-xs text-[#1c1c19] block">
                    Menu Favorit
                  </span>
                  <span className="text-[11px] text-[#524344]">
                    {editIsRecommended ? 'Ditandai sebagai hidangan favorit (tampil di kategori Favorit)' : 'Menu reguler standar'}
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={editIsRecommended}
                  onClick={() => setEditIsRecommended(!editIsRecommended)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    editIsRecommended ? 'bg-[#3d1018]' : 'bg-[#d8d4ce]'
                  }`}
                  aria-label="Tandai menu favorit"
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      editIsRecommended ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#ebe8e3]">
              <button
                type="button"
                onClick={() => {
                  const itm = editingItem;
                  setEditingItem(null);
                  setDeleteMenuConfirm(itm);
                }}
                className="px-3 py-2 rounded-lg text-xs font-bold text-white bg-[#ba1a1a] hover:bg-[#93000a] cursor-pointer flex items-center gap-1 transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>Hapus Menu</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#3d1018] text-white text-xs font-bold hover:bg-[#58252c] cursor-pointer shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Modal Peringatan Konfirmasi Hapus Menu */}
      {deleteMenuConfirm && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs lg:cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget && typeof window !== 'undefined' && window.innerWidth >= 1024) {
              setDeleteMenuConfirm(null);
            }
          }}
        >
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-[#ebe8e3] animate-in fade-in zoom-in-95 duration-150 cursor-default">
            <h3 className="text-base font-bold text-[#ba1a1a] text-center mb-1">
              Peringatan Konfirmasi Hapus
            </h3>
            <p className="text-xs text-[#524344] text-center mb-5 leading-relaxed">
              Apakah Anda yakin ingin menghapus menu <strong className="text-[#1c1c19]">{deleteMenuConfirm.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteMenuConfirm(null)}
                className="flex-1 py-2 rounded-xl bg-[#f0ede9] hover:bg-[#ebe8e3] text-[#1c1c19] text-xs font-semibold cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteMenu(deleteMenuConfirm);
                  setDeleteMenuConfirm(null);
                }}
                className="flex-1 py-2 rounded-xl bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold cursor-pointer shadow-xs transition-colors"
              >
                Hapus Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const KelolaMenuView: React.FC = () => {
  const { menuItems } = useApp();
  if (!menuItems.length) {
    return (
      <div className="p-10 text-center text-sm text-[#524344]">
        Belum ada menu yang dimuat. Hubungkan database atau periksa katalog outlet.
      </div>
    );
  }
  return <KelolaMenuViewInner />;
};
