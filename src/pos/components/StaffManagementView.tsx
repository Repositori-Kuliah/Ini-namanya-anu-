import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { StaffUser, UserRole } from '../types';
import { supabase } from '../../lib/supabase';
import { useLockBodyScroll } from '../../lib/useLockBodyScroll';
import { useScrollDirection } from '../../lib/useScrollDirection';

const formatLastLogin = (iso: string) =>
  `${new Date(iso).toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  })} WIB`;

export const StaffManagementView: React.FC = () => {
  const isHeaderVisible = useScrollDirection();
  const { showToast, currentUser, updateCurrentUserName } = useApp();
  type Row = StaffUser & { active: boolean; lastLogin?: string };
  const [staffList, setStaffList] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);

  const loadStaff = useCallback(async () => {
    // 1. Coba baca dari Supabase profiles terlebih dahulu (Direct Client-Side Query)
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && profiles && profiles.length > 0) {
        const seenIds = new Set<string>();
        const seenEmails = new Set<string>();
        const mapped: Row[] = [];

        for (const p of profiles) {
          const emailKey = (p.email || p.username || '').toLowerCase().trim();
          if (seenIds.has(p.id) || (emailKey && seenEmails.has(emailKey))) {
            continue;
          }
          seenIds.add(p.id);
          if (emailKey) seenEmails.add(emailKey);

          mapped.push({
            id: p.id,
            name: p.full_name || 'Tanpa Nama',
            email: p.email || p.username || '-',
            role: (p.role === 'staff' ? 'cashier' : p.role) as UserRole,
            avatar: '',
            shift: p.shift || '',
            terminal: p.terminal || '',
            active: p.is_active ?? true,
            lastLogin: p.updated_at ? formatLastLogin(p.updated_at) : 'Belum pernah login',
          });
        }
        setStaffList(mapped);
        return;
      }
    } catch { }

    // 2. Jika database kosong atau terjadi error, inisialisasi daftar kosong
    setStaffList([]);
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>('cashier');

  // Edit Modal State
  const [editingStaff, setEditingStaff] = useState<Row | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('cashier');
  const [editActive, setEditActive] = useState(true);
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Kunci scroll background saat modal apa pun terbuka
  useLockBodyScroll(Boolean(showAddModal || editingStaff));

  const filtered = staffList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.role.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && s.active) ||
      (statusFilter === 'inactive' && !s.active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPassword || saving) return;
    if (newPassword.length < 6) {
      showToast('Kata sandi minimal 6 karakter', 'warning');
      return;
    }
    setSaving(true);

    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-0000-0000-' + Date.now().toString(16).padStart(12, '0');
    const newStaffItem: Row = {
      id: newId,
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      role: newRole,
      avatar: '',
      shift: 'Shift Siang 10.00 - 18.00',
      terminal: 'Terminal #01',
      active: true,
      lastLogin: 'Baru ditambahkan',
    };

    // 1. Simpan langsung ke Supabase profiles
    try {
      const { error: insErr } = await supabase.from('profiles').insert({
        id: newId,
        full_name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        role: newRole,
        is_active: true,
      });
      if (insErr) {
        showToast('Gagal simpan ke database: ' + insErr.message, 'warning');
        setSaving(false);
        return;
      }
    } catch (err: any) {
      showToast('Gagal simpan ke database: ' + (err?.message || 'Error'), 'warning');
      setSaving(false);
      return;
    }

    // 2. Update state lokal (Optimistic)
    setStaffList((prev) => [newStaffItem, ...prev]);

    setSaving(false);
    setShowAddModal(false);
    showToast(`Akun staf ${newName} berhasil ditambahkan`, 'success');
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setShowPassword(false);
  };

  const toggleActive = async (staf: Row) => {
    if (staf.id === currentUser?.id) {
      showToast('Tidak dapat menonaktifkan akun yang sedang digunakan saat ini', 'warning');
      return;
    }

    const nextActive = !staf.active;

    // 1. Sync Supabase
    try {
      await supabase.from('profiles').update({ is_active: nextActive }).eq('id', staf.id);
    } catch { }

    // 2. Update state
    setStaffList((prev) => prev.map((s) => (s.id === staf.id ? { ...s, active: nextActive } : s)));

    showToast(`${staf.name} berhasil ${nextActive ? 'diaktifkan kembali' : 'dinonaktifkan'}`, 'info');
  };

  const handleDeleteStaff = async (staf: Row) => {
    if (staf.role === 'admin' || staf.id === currentUser?.id) {
      showToast('Akun Admin outlet tidak dapat dihapus', 'warning');
      return;
    }

    if (!window.confirm(`Yakin ingin menghapus akun staf "${staf.name}" secara permanen?`)) {
      return;
    }

    setSaving(true);

    // 1. Sync Supabase
    try {
      await supabase.from('profiles').delete().eq('id', staf.id);
    } catch (e) {
      console.warn('Supabase delete error:', e);
    }

    // 2. Update state
    setStaffList((prev) => prev.filter((s) => s.id !== staf.id));

    setSaving(false);
    setEditingStaff(null);
    showToast(`Akun staf ${staf.name} berhasil dihapus`, 'success');
  };

  const handleOpenEdit = (staf: Row) => {
    setEditingStaff(staf);
    setEditName(staf.name);
    setEditEmail(staf.email && staf.email !== '-' ? staf.email : staf.id);
    setEditRole(staf.role);
    setEditActive(staf.active);
    setEditPassword('');
    setShowEditPassword(false);
  };

  const handleSaveEditStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    if (!editName.trim()) {
      showToast('Nama staf tidak boleh kosong', 'warning');
      return;
    }

    const isStaffAdmin =
      editingStaff.role === 'admin' ||
      editingStaff.id === currentUser?.id;
    const finalRole = isStaffAdmin ? 'admin' : editRole;
    const finalActive = isStaffAdmin ? true : editActive;

    const password = editPassword.trim();
    if (password && password.length < 6) {
      showToast('Kata sandi baru minimal 6 karakter', 'warning');
      return;
    }

    setSaving(true);

    // 1. Sync Supabase profiles table
    try {
      await supabase
        .from('profiles')
        .update({
          full_name: editName.trim(),
          email: editEmail.trim(),
          role: finalRole,
          is_active: finalActive,
        })
        .eq('id', editingStaff.id);
    } catch (e) {
      console.warn('Update profiles error:', e);
    }

    // 2. Sync Auth User Metadata jika yang diedit adalah akun yang sedang aktif login
    // Ini krusial agar saat relog (login ulang), metadata auth tidak menimpa kembali nama baru
    if (
      editingStaff.id === currentUser?.id ||
      editingStaff.email?.toLowerCase() === currentUser?.email?.toLowerCase()
    ) {
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: editName.trim(),
            role: finalRole,
          },
        });
        updateCurrentUserName(editName.trim());
      } catch (err) {
        console.warn('Update auth user metadata error:', err);
      }
    }

    // 3. Update state
    setStaffList((prev) =>
      prev.map((s) =>
        s.id === editingStaff.id
          ? {
            ...s,
            name: editName.trim(),
            email: editEmail.trim(),
            role: finalRole,
            active: finalActive,
          }
          : s
      )
    );

    setSaving(false);
    showToast(`Akun ${editName} berhasil diperbarui`, 'success');
    setEditingStaff(null);
  };

  return (
    <div className="flex flex-col w-full p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1540px] mx-auto pb-4 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-end gap-4 pb-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-3.5 py-2 bg-[#3d1018] hover:bg-[#58252c] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <span>Tambah Akun Staf</span>
          </button>
        </div>
      </div>

      {/* Filter Bar (Sticky di Mobile: Hide on Scroll Down, Show on Scroll Up; Normal Static di Desktop) */}
      <div className={`bg-white/95 backdrop-blur-md p-3 rounded-xl border border-[#ebe8e3] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sticky top-16 sm:static z-20 shadow-xs transition-all duration-200 ease-out ${
        isHeaderVisible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'max-sm:-translate-y-36 max-sm:opacity-0 max-sm:pointer-events-none'
      }`}>
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#847374] text-[18px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau email staf..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#f6f3ee] rounded-lg text-xs text-[#1c1c19] border border-transparent focus:border-[#3d1018] focus:bg-white outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[#847374] text-[11px] font-medium hidden sm:inline">Peran:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="py-1.5 px-2.5 rounded-lg border border-[#ebe8e3] bg-[#f6f3ee] text-[#1c1c19] font-medium text-xs outline-none focus:border-[#3d1018] cursor-pointer"
            >
              <option value="all">Semua Peran</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="cashier">Kasir</option>
              <option value="kitchen">Dapur</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[#847374] text-[11px] font-medium hidden sm:inline">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-2.5 rounded-lg border border-[#ebe8e3] bg-[#f6f3ee] text-[#1c1c19] font-medium text-xs outline-none focus:border-[#3d1018] cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif Saja</option>
              <option value="inactive">Nonaktif Saja</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Table dengan Scroll Mandiri */}
      <div className="bg-white rounded-xl border border-[#ebe8e3] overflow-hidden shadow-2xs">
        <div className="max-h-none sm:max-h-[calc(100vh-320px)] overflow-y-auto custom-scrollbar">
          {/* Desktop View (Tampil pada layar >= md) */}
          <table className="hidden md:table w-full text-left text-xs">
            <thead className="bg-[#f6f3ee] border-b border-[#ebe8e3] text-[11px] font-bold text-[#847374] uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-4">Nama Staf</th>
                <th className="py-2.5 px-4">Hak Akses (Role)</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Terakhir Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebe8e3]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-xs text-[#847374]">
                    Tidak ada akun staf yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filtered.map((staf) => {
                  return (
                    <tr
                      key={staf.id}
                      onClick={() => handleOpenEdit(staf)}
                      className={`hover:bg-[#fcfaf7] transition-colors cursor-pointer ${staf.active ? '' : 'bg-[#faf8f5]/60 text-[#847374]'
                        }`}
                      title="Klik untuk edit &amp; kelola akun staf"
                    >
                      <td className="py-3 px-4 font-semibold text-[#1c1c19]">
                        <span className="font-bold text-[#1c1c19] block">{staf.name}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-semibold text-[#1c1c19]">
                          {staf.role === 'owner' ? 'Owner' : staf.role === 'admin' ? 'Admin' : staf.role === 'kitchen' ? 'Dapur' : 'Kasir'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <span
                            className={`text-xs font-semibold ${staf.active ? 'text-[#1c1c19]' : 'text-[#847374]'}`}
                          >
                            {staf.active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] text-[#524344]">
                          {staf.lastLogin || 'Belum pernah login'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Mobile View (Tampil pada layar < md) */}
          <div className="md:hidden divide-y divide-[#ebe8e3]">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#847374] px-4">
                Tidak ada akun staf yang cocok dengan kriteria pencarian.
              </div>
            ) : (
              filtered.map((staf) => (
                <div
                  key={staf.id}
                  onClick={() => handleOpenEdit(staf)}
                  className={`p-3.5 space-y-1.5 hover:bg-[#fcfaf7] transition-colors cursor-pointer active:bg-[#f5efe6] ${
                    staf.active ? '' : 'bg-[#faf8f5]/60 text-[#847374]'
                  }`}
                  title="Klik untuk edit & kelola akun staf"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-[#1c1c19]">
                      {staf.name}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-semibold text-[#1c1c19]">
                        {staf.role === 'owner' ? 'Owner' : staf.role === 'admin' ? 'Admin' : staf.role === 'kitchen' ? 'Dapur' : 'Kasir'}
                      </span>
                      <span className="text-[#d7c2c2]">·</span>
                      <span className={`text-xs font-medium ${staf.active ? 'text-emerald-700' : 'text-[#847374]'}`}>
                        {staf.active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                  </div>
                  <div className="text-[11px] text-[#847374] font-mono">
                    Login: {staf.lastLogin || 'Belum pernah login'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddStaff}
            className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-xl border border-[#ebe8e3] flex flex-col gap-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#ebe8e3]">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1c1c19]">Tambah Akun Staf Baru</h3>
                <p className="text-xs text-[#847374]">Buat kredensial login untuk staf restoran</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-lg text-[#847374] hover:bg-[#f6f3ee] flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#1c1c19] mb-1">
                  Nama Lengkap <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Rian Pratama"
                  className="w-full px-3 py-2 bg-[#f6f3ee] rounded-lg border border-[#ebe8e3] text-xs text-[#1c1c19] outline-none focus:border-[#3d1018] focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1c1c19] mb-1">
                  Email <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="rian@rawongusti.com"
                  className="w-full px-3 py-2 bg-[#f6f3ee] rounded-lg border border-[#ebe8e3] text-xs text-[#1c1c19] outline-none focus:border-[#3d1018] focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1c1c19] mb-1">
                  Kata Sandi Awal <span className="text-[#ba1a1a]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-3 pr-9 py-2 bg-[#f6f3ee] rounded-lg border border-[#ebe8e3] text-xs text-[#1c1c19] outline-none focus:border-[#3d1018] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#847374] hover:text-[#1c1c19] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                <p className="text-[10px] text-[#847374] mt-1">Staf dapat mengubah kata sandi setelah login pertama kali.</p>
              </div>

              <div>
                <label className="block font-semibold text-[#1c1c19] mb-1">
                  Hak Akses (Role) <span className="text-[#ba1a1a]">*</span>
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-[#f6f3ee] rounded-lg border border-[#ebe8e3] text-xs text-[#1c1c19] outline-none focus:border-[#3d1018] focus:bg-white cursor-pointer"
                >
                  <option value="cashier">Kasir</option>
                  <option value="kitchen">Dapur</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ebe8e3]">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-[#3d1018] hover:bg-[#58252c] text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Menyimpan…' : 'Simpan Akun Staf'}
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Modal Edit Staff */}
      {editingStaff && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingStaff(null);
          }}
        >
          <form
            onSubmit={handleSaveEditStaff}
            className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-[#ebe8e3] flex flex-col gap-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#ebe8e3]">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1c1c19]">Edit Akun Staf</h3>
                <p className="text-xs text-[#847374]">Kelola informasi dan hak akses staf</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="w-7 h-7 rounded-lg text-[#847374] hover:bg-[#f6f3ee] flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#1c1c19] mb-1">
                  Nama Lengkap <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f6f3ee] rounded-lg border border-[#ebe8e3] text-xs text-[#1c1c19] outline-none focus:border-[#3d1018] focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1c1c19] mb-1">
                  Email <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editEmail || editingStaff?.id || ''}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder={editingStaff?.id || 'email@contoh.com'}
                  className="w-full px-3 py-2 bg-[#f6f3ee] rounded-lg border border-[#ebe8e3] text-xs text-[#1c1c19] outline-none focus:border-[#3d1018] focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1c1c19] mb-1">Hak Akses (Role)</label>
                {editingStaff.role === 'admin' || editingStaff.id === currentUser?.id ? (
                  <div className="flex items-center px-3 py-2 bg-[#f6f3ee] rounded-lg border border-[#ebe8e3] text-xs text-[#524344] select-none cursor-not-allowed">
                    <span className="font-semibold text-[#1c1c19]">-</span>
                  </div>
                ) : (
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-[#f6f3ee] rounded-lg border border-[#ebe8e3] text-xs text-[#1c1c19] outline-none focus:border-[#3d1018] focus:bg-white cursor-pointer"
                  >
                    <option value="cashier">Kasir</option>
                    <option value="kitchen">Dapur</option>
                    <option value="admin">Admin</option>
                    <option value="owner">Owner</option>
                  </select>
                )}
              </div>

              {/* Status Akun: hanya ditampilkan untuk staf biasa */}
              {!(editingStaff.role === 'admin' || editingStaff.id === currentUser?.id) && (
                <div>
                  <label className="block font-semibold text-[#1c1c19] mb-1">Status Akun</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditActive(true)}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${editActive
                        ? 'bg-[#3d1018] text-white border-[#3d1018]'
                        : 'bg-[#f6f3ee] text-[#524344] border-[#ebe8e3]'
                        }`}
                    >
                      Aktif
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditActive(false)}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${!editActive
                        ? 'bg-[#ba1a1a] text-white border-[#ba1a1a]'
                        : 'bg-[#f6f3ee] text-[#524344] border-[#ebe8e3]'
                        }`}
                    >
                      Nonaktif
                    </button>
                  </div>
                </div>
              )}

              {/* Reset Password (Khusus Admin) */}
              <div>
                <label className="block font-semibold text-[#1c1c19] mb-1">
                  Ubah Kata Sandi Baru{' '}
                  <span className="text-[#847374] font-normal">(Kosongkan jika tidak diubah)</span>
                </label>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    minLength={6}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Masukkan sandi baru (min. 6 karakter)"
                    className="w-full pl-3 pr-9 py-2 bg-[#f6f3ee] rounded-lg border border-[#ebe8e3] text-xs text-[#1c1c19] outline-none focus:border-[#3d1018] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#847374] hover:text-[#1c1c19] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {showEditPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Log Terakhir Login */}
              <div className="p-2.5 rounded-lg bg-[#fcf9f4] border border-[#ebe8e3] flex items-center justify-between text-[11px]">
                <span className="text-[#847374]">Terakhir Login:</span>
                <span className="font-mono font-semibold text-[#1c1c19]">
                  {editingStaff.lastLogin || 'Belum pernah login'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#ebe8e3]">
              {!(editingStaff.role === 'admin' || editingStaff.id === currentUser?.id) ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleDeleteStaff(editingStaff)}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#ba1a1a] hover:bg-[#93000a] text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  aria-label="Hapus Akun Staf"
                >
                  <span className="material-symbols-outlined text-[15px]" aria-hidden="true">delete</span>
                  <span>Hapus Akun</span>
                </button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-[#3d1018] hover:bg-[#58252c] text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
