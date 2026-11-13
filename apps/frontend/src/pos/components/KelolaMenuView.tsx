import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MenuItem, RawIngredient } from '../types';

const KelolaMenuViewInner: React.FC = () => {
  const {
    menuItems,
    menuCategories,
    updateMenuItem,
    addMenuItem,
    deleteMenuItem,
    rawIngredients,
    restockIngredient,
    updateIngredientMinimum,
    addRawIngredient,
    deleteRawIngredient,
    showToast,
  } = useApp();

  // Tab utama: 'katalog' | 'stok'
  const [activeTab, setActiveTab] = useState<'katalog' | 'stok'>('katalog');

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

  // Modal Edit Menu
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsAvailable, setEditIsAvailable] = useState(true);

  // --- State Stok Bahan Baku ---
  const [searchStockQuery, setSearchStockQuery] = useState('');
  const [stockCategoryFilter, setStockCategoryFilter] = useState('Semua');
  const [stockStatusFilter, setStockStatusFilter] = useState<'semua' | 'aman' | 'menipis' | 'kritis'>('semua');

  // Modal Restock
  const [restockItem, setRestockItem] = useState<RawIngredient | null>(null);
  const [restockQty, setRestockQty] = useState('5');
  const [restockNote, setRestockNote] = useState('Penerimaan rutin supplier');

  // Modal Ubah Stok Minimum
  const [editMinItem, setEditMinItem] = useState<RawIngredient | null>(null);
  const [editMinVal, setEditMinVal] = useState('5');

  // Modal Tambah Bahan Baku
  const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);
  const [newIngCode, setNewIngCode] = useState('');
  const [newIngName, setNewIngName] = useState('');
  const [newIngCategory, setNewIngCategory] = useState<RawIngredient['category']>('Bumbu & Rempah');
  const [newIngStock, setNewIngStock] = useState('10');
  const [newIngMin, setNewIngMin] = useState('5');
  const [newIngUnit, setNewIngUnit] = useState('kg');
  const [newIngSupplier, setNewIngSupplier] = useState('');

  // Modals Peringatan Konfirmasi Hapus
  const [deleteMenuConfirm, setDeleteMenuConfirm] = useState<MenuItem | null>(null);
  const [deleteIngConfirm, setDeleteIngConfirm] = useState<RawIngredient | null>(null);

  // Active action menu id
  const [openMenuActionId, setOpenMenuActionId] = useState<string | number | null>(null);
  const [openIngActionId, setOpenIngActionId] = useState<string | number | null>(null);

  // --- Filter Logic: Menu ---
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchMenuQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchMenuQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterMenuCategory !== 'Semua' && item.category !== filterMenuCategory) return false;

    if (filterMenuAvailability === 'tersedia' && !item.isAvailable) return false;
    if (filterMenuAvailability === 'habis' && item.isAvailable) return false;

    return true;
  });

  // --- Filter Logic: Bahan Baku ---
  const filteredIngredients = rawIngredients.filter((ing) => {
    const matchesSearch =
      ing.name.toLowerCase().includes(searchStockQuery.toLowerCase()) ||
      ing.code.toLowerCase().includes(searchStockQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (stockCategoryFilter !== 'Semua' && ing.category !== stockCategoryFilter) return false;

    const isCritical = ing.currentStock <= 0;
    const isLow = ing.currentStock <= ing.minimumStock && ing.currentStock > 0;
    const isSafe = ing.currentStock > ing.minimumStock;

    if (stockStatusFilter === 'kritis' && !isCritical) return false;
    if (stockStatusFilter === 'menipis' && !isLow) return false;
    if (stockStatusFilter === 'aman' && !isSafe) return false;

    return true;
  });

  // --- Handlers: Menu ---
  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditPrice(item.price.toString());
    setEditDescription(item.description || '');
    setEditIsAvailable(item.isAvailable);
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
      image: '/logo-rawon.png',
      isAvailable: true,
      isFavorite: false,
    };

    addMenuItem(newItem);
    setShowAddMenuModal(false);
    setNewName('');
    setNewPrice('25000');
    setNewDescription('');
    showToast(`Menu "${newItem.name}" berhasil ditambahkan!`, 'success');
  };

  // --- Handlers: Bahan Baku ---
  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem) return;
    const qty = parseFloat(restockQty);
    if (isNaN(qty) || qty <= 0) {
      showToast('Jumlah restock harus angka positif', 'warning');
      return;
    }
    restockIngredient(restockItem.id, qty);
    showToast(`Stok ${restockItem.name} bertambah ${qty} ${restockItem.unit}`, 'success');
    setRestockItem(null);
  };

  const handleEditMinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMinItem) return;
    const minVal = parseFloat(editMinVal);
    if (isNaN(minVal) || minVal < 0) {
      showToast('Stok minimum harus angka non-negatif', 'warning');
      return;
    }
    updateIngredientMinimum(editMinItem.id, minVal);
    showToast(`Batas minimum ${editMinItem.name} diubah menjadi ${minVal} ${editMinItem.unit}`, 'success');
    setEditMinItem(null);
  };

  const handleDeleteIngredient = async (ing: RawIngredient) => {
    const ok = await deleteRawIngredient(ing.id);
    if (ok) {
      showToast(`Bahan baku "${ing.name}" berhasil dihapus`, 'success');
    }
  };

  const handleCreateIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    const stockVal = parseFloat(newIngStock);
    const minVal = parseFloat(newIngMin);
    if (!newIngName.trim() || isNaN(stockVal) || isNaN(minVal)) {
      showToast('Lengkapi data bahan baku dengan benar', 'warning');
      return;
    }

    const newIng: RawIngredient = {
      id: `ing-${Date.now()}`,
      code: newIngCode.trim() || `BAHAN-${String(rawIngredients.length + 1).padStart(2, '0')}`,
      name: newIngName.trim(),
      category: newIngCategory,
      currentStock: stockVal,
      minimumStock: minVal,
      unit: newIngUnit.trim() || 'kg',
      costPerUnit: 0,
      supplier: newIngSupplier.trim() || '-',
      lastRestocked: new Date().toLocaleDateString('id-ID'),
      linkedMenuItems: [],
    };

    addRawIngredient(newIng);
    setShowAddIngredientModal(false);
    setNewIngName('');
    setNewIngCode('');
    setNewIngSupplier('');
    showToast(`Bahan baku "${newIng.name}" berhasil didaftarkan!`, 'success');
  };

  return (
    <div className="flex flex-col w-full pb-20 md:pb-8 max-w-[1600px] mx-auto px-4 sm:px-6 pt-3 space-y-4">
      {/* Header Halaman & Tombol Aksi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ebe8e3]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1c1c19] tracking-tight">
            Kelola Menu &amp; Bahan Baku
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'katalog' ? (
            <button
              type="button"
              onClick={() => setShowAddMenuModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#3d1018] hover:bg-[#58252c] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Tambah Menu</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddIngredientModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#3d1018] hover:bg-[#58252c] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Tambah Bahan Baku</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher: Katalog Menu vs Stok Bahan Baku */}
      <div className="flex items-center bg-[#f0ede9] p-1 rounded-xl max-w-sm">
        <button
          type="button"
          onClick={() => setActiveTab('katalog')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'katalog'
              ? 'bg-white text-[#3d1018] shadow-xs'
              : 'text-[#524344] hover:text-[#1c1c19]'
          }`}
        >
          Katalog Menu ({menuItems.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('stok')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'stok'
              ? 'bg-white text-[#3d1018] shadow-xs'
              : 'text-[#524344] hover:text-[#1c1c19]'
          }`}
        >
          Stok Bahan Baku ({rawIngredients.length})
        </button>
      </div>

      {/* =========================================================================
          SUB-BAGIAN A: KATALOG MENU
         ========================================================================= */}
      {activeTab === 'katalog' && (
        <section aria-label="Katalog Menu" className="space-y-3">
          {/* Baris Filter & Search Menu */}
          <div className="bg-white p-3 rounded-xl border border-[#ebe8e3] flex flex-col md:flex-row md:items-center justify-between gap-3">
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

            <div className="flex flex-wrap items-center gap-2">
              {/* Filter Kategori */}
              <div className="flex items-center gap-1.5 text-xs text-[#524344]">
                <span>Kategori:</span>
                <select
                  value={filterMenuCategory}
                  onChange={(e) => setFilterMenuCategory(e.target.value)}
                  className="bg-[#fcf9f4] border border-[#ebe8e3] rounded-lg px-2.5 py-1 text-xs font-semibold text-[#1c1c19] outline-none cursor-pointer focus:border-[#3d1018]"
                >
                  <option value="Semua">Semua Kategori</option>
                  {menuCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Ketersediaan */}
              <div className="flex items-center gap-1.5 text-xs text-[#524344]">
                <span>Status:</span>
                <select
                  value={filterMenuAvailability}
                  onChange={(e) => setFilterMenuAvailability(e.target.value as any)}
                  className="bg-[#fcf9f4] border border-[#ebe8e3] rounded-lg px-2.5 py-1 text-xs font-semibold text-[#1c1c19] outline-none cursor-pointer focus:border-[#3d1018]"
                >
                  <option value="semua">Semua Status</option>
                  <option value="tersedia">Tersedia</option>
                  <option value="habis">Habis</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabel Menu Compact */}
          <div className="bg-white rounded-xl border border-[#ebe8e3] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#f6f3ee] text-[#524344] uppercase tracking-wider text-[10px] font-bold border-b border-[#ebe8e3]">
                  <tr>
                    <th className="py-2.5 px-4">Nama Menu</th>
                    <th className="py-2.5 px-4">Kategori</th>
                    <th className="py-2.5 px-4">Harga Jual</th>
                    <th className="py-2.5 px-4">Ketersediaan</th>
                    <th className="py-2.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebe8e3]">
                  {filteredMenuItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-[#847374]">
                        Tidak ada menu yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredMenuItems.map((item) => (
                      <tr key={item.id} className="hover:bg-[#fcf9f4] transition-colors">
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2.5">
                            {item.image && (
                              <img
                                src={item.image}
                                alt=""
                                className="w-8 h-8 rounded-lg object-cover bg-[#f0ede9] shrink-0 border border-[#ebe8e3]"
                                loading="lazy"
                              />
                            )}
                            <div>
                              <span className="font-bold text-[#1c1c19] block leading-tight">
                                {item.name}
                              </span>
                              <span className="text-[10px] text-[#847374] font-mono">
                                {item.code}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-[#524344]">{item.category}</td>
                        <td className="py-2.5 px-4 font-bold text-[#3d1018] tabular-nums">
                          Rp {item.price.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.isAvailable
                                ? 'bg-[#f0ede9] text-[#1c1c19] border border-[#ebe8e3]'
                                : 'bg-[#ffdadc] text-[#ba1a1a]'
                            }`}
                          >
                            {item.isAvailable ? 'Tersedia' : 'Habis'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center relative">
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={() => setOpenMenuActionId(openMenuActionId === item.id ? null : item.id)}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#f6f3ee] hover:bg-[#ebe8e3] text-[#1c1c19] border border-[#ebe8e3] text-xs font-semibold cursor-pointer transition-colors"
                            >
                              <span>Aksi</span>
                              <span className="material-symbols-outlined text-[14px] text-[#524344]">
                                {openMenuActionId === item.id ? 'expand_less' : 'expand_more'}
                              </span>
                            </button>

                            {openMenuActionId === item.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-20"
                                  onClick={() => setOpenMenuActionId(null)}
                                />
                                <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-xl border border-[#ebe8e3] py-1 z-30 text-left divide-y divide-[#ebe8e3] animate-in fade-in zoom-in-95 duration-100">
                                  <div className="py-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuActionId(null);
                                        handleOpenEdit(item);
                                      }}
                                      className="w-full px-3 py-1.5 text-xs font-medium text-[#1c1c19] hover:bg-[#f6f3ee] flex items-center gap-2 cursor-pointer"
                                    >
                                      <span className="material-symbols-outlined text-[15px] text-[#524344]">edit</span>
                                      <span>Edit Menu</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuActionId(null);
                                        handleToggleAvailability(item);
                                      }}
                                      className="w-full px-3 py-1.5 text-xs font-medium text-[#1c1c19] hover:bg-[#f6f3ee] flex items-center gap-2 cursor-pointer"
                                    >
                                      <span className="material-symbols-outlined text-[15px] text-[#994703]">
                                        {item.isAvailable ? 'unpublished' : 'check_circle'}
                                      </span>
                                      <span>{item.isAvailable ? 'Tandai Habis' : 'Tandai Tersedia'}</span>
                                    </button>
                                  </div>
                                  <div className="py-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuActionId(null);
                                        setDeleteMenuConfirm(item);
                                      }}
                                      className="w-full px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                                    >
                                      <span className="material-symbols-outlined text-[15px] text-red-700">delete</span>
                                      <span>Hapus Menu</span>
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          SUB-BAGIAN B: STOK BAHAN BAKU
         ========================================================================= */}
      {activeTab === 'stok' && (
        <section aria-label="Stok Bahan Baku" className="space-y-3">
          {/* Baris Filter & Search Bahan Baku */}
          <div className="bg-white p-3 rounded-xl border border-[#ebe8e3] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#847374] text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchStockQuery}
                onChange={(e) => setSearchStockQuery(e.target.value)}
                placeholder="Cari nama bahan atau kode..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#fcf9f4] rounded-lg text-xs text-[#1c1c19] outline-none border border-[#ebe8e3] focus:border-[#3d1018]"
                aria-label="Cari bahan baku"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filter Kategori Bahan */}
              <div className="flex items-center gap-1.5 text-xs text-[#524344]">
                <span>Kategori:</span>
                <select
                  value={stockCategoryFilter}
                  onChange={(e) => setStockCategoryFilter(e.target.value)}
                  className="bg-[#fcf9f4] border border-[#ebe8e3] rounded-lg px-2.5 py-1 text-xs font-semibold text-[#1c1c19] outline-none cursor-pointer focus:border-[#3d1018]"
                >
                  <option value="Semua">Semua Kategori</option>
                  <option value="Daging & Unggas">Daging &amp; Unggas</option>
                  <option value="Bumbu & Rempah">Bumbu &amp; Rempah</option>
                  <option value="Beras & Pokok">Beras &amp; Pokok</option>
                  <option value="Sayur & Pelengkap">Sayur &amp; Pelengkap</option>
                  <option value="Minuman">Minuman</option>
                </select>
              </div>

              {/* Filter Status Stok */}
              <div className="flex items-center gap-1.5 text-xs text-[#524344]">
                <span>Status:</span>
                <select
                  value={stockStatusFilter}
                  onChange={(e) => setStockStatusFilter(e.target.value as any)}
                  className="bg-[#fcf9f4] border border-[#ebe8e3] rounded-lg px-2.5 py-1 text-xs font-semibold text-[#1c1c19] outline-none cursor-pointer focus:border-[#3d1018]"
                >
                  <option value="semua">Semua Status</option>
                  <option value="aman">Aman</option>
                  <option value="menipis">Menipis</option>
                  <option value="kritis">Kritis (Habis)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabel Bahan Baku Compact */}
          <div className="bg-white rounded-xl border border-[#ebe8e3] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#f6f3ee] text-[#524344] uppercase tracking-wider text-[10px] font-bold border-b border-[#ebe8e3]">
                  <tr>
                    <th className="py-2.5 px-4">Bahan Baku</th>
                    <th className="py-2.5 px-4">Kategori</th>
                    <th className="py-2.5 px-4">Stok Saat Ini</th>
                    <th className="py-2.5 px-4">Stok Min.</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Supplier</th>
                    <th className="py-2.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebe8e3]">
                  {filteredIngredients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-[#847374]">
                        Tidak ada bahan baku yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredIngredients.map((ing) => {
                      const isCritical = ing.currentStock <= 0;
                      const isLow = ing.currentStock <= ing.minimumStock && ing.currentStock > 0;

                      return (
                        <tr key={ing.id} className="hover:bg-[#fcf9f4] transition-colors">
                          <td className="py-2.5 px-4">
                            <span className="font-bold text-[#1c1c19] block leading-tight">
                              {ing.name}
                            </span>
                            <span className="text-[10px] text-[#847374] font-mono">
                              {ing.code}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-[#524344]">{ing.category}</td>
                          <td className="py-2.5 px-4 font-bold text-[#1c1c19] tabular-nums">
                            {ing.currentStock} {ing.unit}
                          </td>
                          <td className="py-2.5 px-4 text-[#524344] tabular-nums">
                            {ing.minimumStock} {ing.unit}
                          </td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                isCritical
                                  ? 'bg-[#ffdadc] text-[#ba1a1a]'
                                  : isLow
                                  ? 'bg-[#ffdbc9] text-[#753400]'
                                  : 'bg-[#f0ede9] text-[#1c1c19]'
                              }`}
                            >
                              {isCritical ? 'Kritis' : isLow ? 'Menipis' : 'Aman'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-[#524344] truncate max-w-[140px]">
                            {ing.supplier}
                          </td>
                        <td className="py-2.5 px-4 text-center relative">
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={() => setOpenIngActionId(openIngActionId === ing.id ? null : ing.id)}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#f6f3ee] hover:bg-[#ebe8e3] text-[#1c1c19] border border-[#ebe8e3] text-xs font-semibold cursor-pointer transition-colors"
                            >
                              <span>Aksi</span>
                              <span className="material-symbols-outlined text-[14px] text-[#524344]">
                                {openIngActionId === ing.id ? 'expand_less' : 'expand_more'}
                              </span>
                            </button>

                            {openIngActionId === ing.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-20"
                                  onClick={() => setOpenIngActionId(null)}
                                />
                                <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-[#ebe8e3] py-1 z-30 text-left divide-y divide-[#ebe8e3] animate-in fade-in zoom-in-95 duration-100">
                                  <div className="py-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenIngActionId(null);
                                        setRestockItem(ing);
                                        setRestockQty('5');
                                      }}
                                      className="w-full px-3 py-1.5 text-xs font-medium text-[#1c1c19] hover:bg-[#f6f3ee] flex items-center gap-2 cursor-pointer"
                                    >
                                      <span className="material-symbols-outlined text-[15px] text-[#994703]">add_box</span>
                                      <span>Restock Stok</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenIngActionId(null);
                                        setEditMinItem(ing);
                                        setEditMinVal(ing.minimumStock.toString());
                                      }}
                                      className="w-full px-3 py-1.5 text-xs font-medium text-[#1c1c19] hover:bg-[#f6f3ee] flex items-center gap-2 cursor-pointer"
                                    >
                                      <span className="material-symbols-outlined text-[15px] text-[#524344]">tune</span>
                                      <span>Edit Stok Min.</span>
                                    </button>
                                  </div>
                                  <div className="py-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenIngActionId(null);
                                        setDeleteIngConfirm(ing);
                                      }}
                                      className="w-full px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                                    >
                                      <span className="material-symbols-outlined text-[15px] text-red-700">delete</span>
                                      <span>Hapus Bahan</span>
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          MODALS
         ========================================================================= */}

      {/* Modal Tambah Menu */}
      {showAddMenuModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-menu-title"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleCreateMenu}
            className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl border border-[#ebe8e3] flex flex-col gap-3.5"
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
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#ebe8e3]">
              <button
                type="button"
                onClick={() => setShowAddMenuModal(false)}
                className="flex-1 py-2 rounded-lg bg-[#f0ede9] text-[#1c1c19] text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-lg bg-[#3d1018] text-white text-xs font-bold hover:bg-[#58252c] cursor-pointer shadow-xs"
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
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl border border-[#ebe8e3] flex flex-col gap-3.5"
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

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={editIsAvailable}
                  onChange={(e) => setEditIsAvailable(e.target.checked)}
                  className="w-4 h-4 rounded text-[#3d1018] accent-[#3d1018] cursor-pointer"
                />
                <span className="font-semibold text-[#1c1c19]">Menu siap disajikan (Tersedia)</span>
              </label>
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#ebe8e3]">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="flex-1 py-2 rounded-lg bg-[#f0ede9] text-[#1c1c19] text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-lg bg-[#3d1018] text-white text-xs font-bold hover:bg-[#58252c] cursor-pointer shadow-xs"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Restock Bahan */}
      {restockItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="restock-title"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleRestockSubmit}
            className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl border border-[#ebe8e3] flex flex-col gap-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#ebe8e3]">
              <h3 id="restock-title" className="font-bold text-base text-[#1c1c19]">
                Restock: {restockItem.name}
              </h3>
              <button
                type="button"
                onClick={() => setRestockItem(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#524344] hover:bg-[#f0ede9]"
                aria-label="Tutup modal"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-xs text-[#524344]">
              Stok saat ini: <strong>{restockItem.currentStock} {restockItem.unit}</strong>
            </p>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="font-bold text-[#1c1c19] block mb-1">
                  Jumlah Tambahan ({restockItem.unit}) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full px-3 py-2 bg-[#fcf9f4] rounded-lg border border-[#ebe8e3] outline-none font-bold text-sm focus:border-[#3d1018]"
                />
              </div>

              <div>
                <label className="font-bold text-[#1c1c19] block mb-1">Catatan Pengiriman</label>
                <input
                  type="text"
                  value={restockNote}
                  onChange={(e) => setRestockNote(e.target.value)}
                  className="w-full px-3 py-2 bg-[#fcf9f4] rounded-lg border border-[#ebe8e3] outline-none focus:border-[#3d1018]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#ebe8e3]">
              <button
                type="button"
                onClick={() => setRestockItem(null)}
                className="flex-1 py-2 rounded-lg bg-[#f0ede9] text-[#1c1c19] text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-lg bg-[#3d1018] text-white text-xs font-bold hover:bg-[#58252c] cursor-pointer shadow-xs"
              >
                Tambah Stok
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Ubah Stok Minimum */}
      {editMinItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-min-title"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleEditMinSubmit}
            className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl border border-[#ebe8e3] flex flex-col gap-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#ebe8e3]">
              <h3 id="edit-min-title" className="font-bold text-base text-[#1c1c19]">
                Ambang Batas Minimum: {editMinItem.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditMinItem(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#524344] hover:bg-[#f0ede9]"
                aria-label="Tutup modal"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="text-xs">
              <label className="font-bold text-[#1c1c19] block mb-1">
                Batas Peringatan ({editMinItem.unit}) *
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={editMinVal}
                onChange={(e) => setEditMinVal(e.target.value)}
                className="w-full px-3 py-2 bg-[#fcf9f4] rounded-lg border border-[#ebe8e3] outline-none font-bold text-sm focus:border-[#3d1018]"
              />
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#ebe8e3]">
              <button
                type="button"
                onClick={() => setEditMinItem(null)}
                className="flex-1 py-2 rounded-lg bg-[#f0ede9] text-[#1c1c19] text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-lg bg-[#3d1018] text-white text-xs font-bold hover:bg-[#58252c] cursor-pointer shadow-xs"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Tambah Bahan Baku Baru */}
      {showAddIngredientModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-ing-title"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleCreateIngredient}
            className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl border border-[#ebe8e3] flex flex-col gap-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#ebe8e3]">
              <h3 id="add-ing-title" className="font-bold text-base text-[#1c1c19]">
                Tambah Bahan Baku Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowAddIngredientModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#524344] hover:bg-[#f0ede9]"
                aria-label="Tutup modal"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-[#1c1c19] block mb-1">Kode Bahan</label>
                  <input
                    type="text"
                    value={newIngCode}
                    onChange={(e) => setNewIngCode(e.target.value)}
                    placeholder="Contoh: BAHAN-12"
                    className="w-full px-3 py-1.5 bg-[#fcf9f4] rounded-lg border border-[#ebe8e3] outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#1c1c19] block mb-1">Kategori *</label>
                  <select
                    value={newIngCategory}
                    onChange={(e) => setNewIngCategory(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-[#fcf9f4] rounded-lg border border-[#ebe8e3] outline-none cursor-pointer"
                  >
                    <option value="Daging & Unggas">Daging &amp; Unggas</option>
                    <option value="Bumbu & Rempah">Bumbu &amp; Rempah</option>
                    <option value="Beras & Pokok">Beras &amp; Pokok</option>
                    <option value="Sayur & Pelengkap">Sayur &amp; Pelengkap</option>
                    <option value="Minuman">Minuman</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#1c1c19] block mb-1">Nama Bahan Baku *</label>
                <input
                  type="text"
                  required
                  value={newIngName}
                  onChange={(e) => setNewIngName(e.target.value)}
                  placeholder="Contoh: Daging Kisi Sapi"
                  className="w-full px-3 py-1.5 bg-[#fcf9f4] rounded-lg border border-[#ebe8e3] outline-none focus:border-[#3d1018]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-[#1c1c19] block mb-1">Stok Awal *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newIngStock}
                    onChange={(e) => setNewIngStock(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#fcf9f4] rounded-lg border border-[#ebe8e3] outline-none tabular-nums"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#1c1c19] block mb-1">Stok Min *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newIngMin}
                    onChange={(e) => setNewIngMin(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#fcf9f4] rounded-lg border border-[#ebe8e3] outline-none tabular-nums"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#1c1c19] block mb-1">Satuan *</label>
                  <input
                    type="text"
                    required
                    value={newIngUnit}
                    onChange={(e) => setNewIngUnit(e.target.value)}
                    placeholder="kg / butir"
                    className="w-full px-3 py-1.5 bg-[#fcf9f4] rounded-lg border border-[#ebe8e3] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#1c1c19] block mb-1">Nama Supplier</label>
                <input
                  type="text"
                  value={newIngSupplier}
                  onChange={(e) => setNewIngSupplier(e.target.value)}
                  placeholder="Contoh: UD Jagal Pegirian"
                  className="w-full px-3 py-1.5 bg-[#fcf9f4] rounded-lg border border-[#ebe8e3] outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#ebe8e3]">
              <button
                type="button"
                onClick={() => setShowAddIngredientModal(false)}
                className="flex-1 py-2 rounded-lg bg-[#f0ede9] text-[#1c1c19] text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-lg bg-[#3d1018] text-white text-xs font-bold hover:bg-[#58252c] cursor-pointer shadow-xs"
              >
                Simpan Bahan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Peringatan Konfirmasi Hapus Menu */}
      {deleteMenuConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-[#ebe8e3] animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>
            <h3 className="text-base font-bold text-[#1c1c19] text-center mb-1">
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
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer shadow-xs transition-colors"
              >
                Hapus Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Peringatan Konfirmasi Hapus Bahan Baku */}
      {deleteIngConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-[#ebe8e3] animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>
            <h3 className="text-base font-bold text-[#1c1c19] text-center mb-1">
              Peringatan Konfirmasi Hapus
            </h3>
            <p className="text-xs text-[#524344] text-center mb-5 leading-relaxed">
              Apakah Anda yakin ingin menghapus bahan baku <strong className="text-[#1c1c19]">{deleteIngConfirm.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteIngConfirm(null)}
                className="flex-1 py-2 rounded-xl bg-[#f0ede9] hover:bg-[#ebe8e3] text-[#1c1c19] text-xs font-semibold cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteIngredient(deleteIngConfirm);
                  setDeleteIngConfirm(null);
                }}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer shadow-xs transition-colors"
              >
                Hapus Bahan
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
