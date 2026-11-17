import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { StaffUser, UserRole } from '../types';
import { supabase } from '../../lib/supabase';
import { useLockBodyScroll } from '../../lib/useLockBodyScroll';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3001';

const callStaffApi = async (method: string, query: string, body?: unknown): Promise<{ data?: any; error?: string }> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) return { error: 'Sesi berakhir, silakan login ulang.' };
  try {
    const res = await fetch(`${API_BASE}/api/admin/staff${query}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { error: json.error ?? `Permintaan gagal (${res.status})` };
    return { data: json };
  } catch {
    return { error: 'Tidak dapat terhubung ke server.' };
  }
};

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
  const { showToast, currentUser } = useApp();
  type Row = StaffUser & { active: boolean; lastLogin?: string };
  const [staffList, setStaffList] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);

  const loadStaff = useCallback(async () => {
    const res = await callStaffApi('GET', '');
    if (res.error) {
      showToast(res.error, 'warning');
      return;
    }
    setStaffList(
      res.data.staff.map((s: any) => ({
        id: s.id,
        name: s.full_name || 'Tanpa Nama',
        email: s.username || '-',
        role: s.role as UserRole,
        avatar: '',
        shift: '',
        terminal: '',
        active: s.is_active,
        lastLogin: s.last_login ? formatLastLogin(s.last_login) : 'Belum pernah login',
      }))
    );
  }, [showToast]);

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
    const res = await callStaffApi('POST', '', {
      full_name: newName.trim(),
      email: newEmail.trim(),
      password: newPassword,
      role: newRole,
    });
    setSaving(false);
    if (res.error) {
      showToast(res.error, 'warning');
      return;
    }
    setShowAddModal(false);
    showToast(`Akun staf ${newName} berhasil ditambahkan`, 'success');
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setShowPassword(false);
    loadStaff();
  };

  const toggleActive = async (staf: Row) => {
    if (staf.id === currentUser?.id) {
      showToast('Tidak dapat menonaktifkan akun yang sedang digunakan saat ini', 'warning');
      return;
    }
    const res = await callStaffApi('PATCH', `?id=${encodeURIComponent(staf.id)}`, { is_active: !staf.active });
    if (res.error) {
      showToast(res.error, 'warning');
      return;
    }
    showToast(`${staf.name} berhasil ${staf.active ? 'dinonaktifkan' : 'diaktifkan kembali'}`, 'info');
    loadStaff();
  };

  const handleOpenEdit = (staf: Row) => {
    setEditingStaff(staf);
    setEditName(staf.name);
    setEditEmail(staf.email);
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
      editingStaff.id === currentUser?.id ||
      editingStaff.id === 'usr-admin' ||
      editingStaff.email.includes('admin');
    const finalRole = isStaffAdmin ? 'admin' : editRole;
    const finalActive = isStaffAdmin ? true : editActive;

    const password = editPassword.trim();
    if (password && password.length < 6) {
      showToast('Kata sandi baru minimal 6 karakter', 'warning');
      return;
    }

    setSaving(true);
    const res = await callStaffApi('PATCH', `?id=${encodeURIComponent(editingStaff.id)}`, {
      full_name: editName.trim(),
      email: editEmail.trim(),
      role: finalRole,
      is_active: finalActive,
      ...(password ? { password } : {}),
    });
    setSaving(false);

    if (res.error) {
      showToast(res.error, 'warning');
      return;
    }
    showToast(`Akun ${editName} berhasil diperbarui`, 'success');
    setEditingStaff(null);
    loadStaff();
  };

  return (
    <div className="flex flex-col w-full p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1540px] mx-auto pb-4 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-end gap-4 pb-1 border-b border-[#ebe8e3]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#3d1018] hover:bg-[#58252c] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            <span>Tambah Akun Staf</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-[#ebe8e3] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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
              <option value="cashier">Kasir</option>
              <option value="kitchen">Dapur</option>
              <option value="admin">Admin</option>
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
        <div className="overflow-x-auto max-h-[calc(100vh-320px)] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
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
                      className={`hover:bg-[#fcfaf7] transition-colors cursor-pointer ${
                        staf.active ? '' : 'bg-[#faf8f5]/60 text-[#847374]'
                      }`}
                      title="Klik untuk edit &amp; kelola akun staf"
                    >
                      <td className="py-3 px-4 font-semibold text-[#1c1c19]">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                              staf.role === 'admin'
                                ? 'bg-[#3d1018] text-white'
                                : staf.role === 'kitchen'
                                ? 'bg-[#994703] text-white'
                                : 'bg-[#f0ede9] text-[#3d1018]'
                            }`}
                          >
                            {staf.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-[#1c1c19] block">{staf.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            staf.role === 'admin'
                              ? 'bg-neutral-100 text-neutral-800 border-neutral-300'
                              : staf.role === 'kitchen'
                              ? 'bg-amber-50 text-amber-900 border-amber-200'
                              : 'bg-rose-50 text-[#3d1018] border-rose-200'
                          }`}
                        >
                          {staf.role === 'admin' ? 'Admin' : staf.role === 'kitchen' ? 'Dapur' : 'Kasir'}
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
                  Nama Lengkap <span className="text-red-500">*</span>
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
                  Email / User ID Login <span className="text-red-500">*</span>
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
                  Kata Sandi Awal <span className="text-red-500">*</span>
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
                  Hak Akses (Role) <span className="text-red-500">*</span>
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-[#f6f3ee] rounded-lg border border-[#ebe8e3] text-xs text-[#1c1c19] outline-none focus:border-[#3d1018] focus:bg-white cursor-pointer"
                >
                  <option value="cashier">Kasir</option>
                  <option value="kitchen">Dapur</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ebe8e3]">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-[#524344] hover:bg-[#f6f3ee] cursor-pointer"
              >
                Batal
              </button>
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
                  Nama Lengkap <span className="text-red-500">*</span>
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
                  Email / User ID Login <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f6f3ee] rounded-lg border border-[#ebe8e3] text-xs text-[#1c1c19] outline-none focus:border-[#3d1018] focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1c1c19] mb-1">Hak Akses (Role)</label>
                {editingStaff.role === 'admin' ||
                editingStaff.id === currentUser?.id ||
                editingStaff.id === 'usr-admin' ||
                editingStaff.email.includes('admin') ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#f6f3ee] rounded-lg border border-[#ebe8e3] text-xs text-[#524344]">
                    <span className="material-symbols-outlined text-[16px] text-[#3d1018]">lock</span>
                    <span className="font-semibold text-[#1c1c19]">Admin Outlet (Permanen)</span>
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
                  </select>
                )}
              </div>

              {/* Status Akun */}
              <div>
                <label className="block font-semibold text-[#1c1c19] mb-1">Status Akun</label>
                {editingStaff.role === 'admin' ||
                editingStaff.id === currentUser?.id ||
                editingStaff.id === 'usr-admin' ||
                editingStaff.email.includes('admin') ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-800">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span className="font-semibold">Aktif (Akun Admin Utama tidak dapat dinonaktifkan)</span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditActive(true)}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        editActive
                          ? 'bg-[#3d1018] text-white border-[#3d1018]'
                          : 'bg-[#f6f3ee] text-[#524344] border-[#ebe8e3]'
                      }`}
                    >
                      Aktif
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditActive(false)}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        !editActive
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-[#f6f3ee] text-[#524344] border-[#ebe8e3]'
                      }`}
                    >
                      Nonaktif
                    </button>
                  </div>
                )}
              </div>

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
              {!(
                editingStaff.role === 'admin' ||
                editingStaff.id === currentUser?.id ||
                editingStaff.id === 'usr-admin' ||
                editingStaff.email.includes('admin')
              ) ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditActive(!editActive);
                    showToast(editActive ? 'Status diatur ke Nonaktif' : 'Status diatur ke Aktif', 'info');
                  }}
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                    editActive
                      ? 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100'
                      : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">{editActive ? 'block' : 'check_circle'}</span>
                  <span>{editActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}</span>
                </button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-[#524344] hover:bg-[#f6f3ee] cursor-pointer"
                >
                  Batal
                </button>
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
