import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { StaffUser, UserRole } from '../types';
import { supabase } from '../../lib/supabase';

export const StaffManagementView: React.FC = () => {
  const { showToast, currentUser } = useApp();
  type Row = StaffUser & { active: boolean };
  const [staffList, setStaffList] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);
  const ROLE: Record<string, UserRole> = { admin: 'admin', staff: 'kasir', kitchen: 'kitchen' };

  const loadStaff = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['admin', 'staff', 'kitchen'])
        .order('created_at');
      if (error || !data || data.length === 0) {
        setStaffList([
          { id: 'usr-admin', name: 'Arif Gusti (Admin)', email: 'admin@rawongusti.test', role: 'admin', avatar: '', shift: 'Pagi', terminal: 'Main POS', active: true },
          { id: 'usr-kasir', name: 'Dewi Sartika (Kasir)', email: 'kasir@rawongusti.test', role: 'kasir', avatar: '', shift: 'Pagi', terminal: 'Terminal #01', active: true },
          { id: 'usr-kitchen', name: 'Chef Sam R. (Dapur)', email: 'dapur@rawongusti.test', role: 'kitchen', avatar: '', shift: 'Pagi', terminal: 'KDS Stasiun Panas', active: true },
        ]);
        return;
      }
      setStaffList(
        data.map((p: any) => ({
          id: p.id,
          name: p.full_name || 'Tanpa Nama',
          email: p.email || '-',
          role: ROLE[p.role] || 'kasir',
          avatar: '',
          shift: p.shift || 'Reguler',
          terminal: p.terminal || 'POS-01',
          active: p.is_active ?? true,
        }))
      );
    } catch {
      setStaffList([
        { id: 'usr-admin', name: 'Arif Gusti (Admin)', email: 'admin@rawongusti.test', role: 'admin', avatar: '', shift: 'Pagi', terminal: 'Main POS', active: true },
        { id: 'usr-kasir', name: 'Dewi Sartika (Kasir)', email: 'kasir@rawongusti.test', role: 'kasir', avatar: '', shift: 'Pagi', terminal: 'Terminal #01', active: true },
        { id: 'usr-kitchen', name: 'Chef Sam R. (Dapur)', email: 'dapur@rawongusti.test', role: 'kitchen', avatar: '', shift: 'Pagi', terminal: 'KDS Stasiun Panas', active: true },
      ]);
    }
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
  const [newRole, setNewRole] = useState<UserRole>('kasir');

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

  const activeStaffCount = staffList.filter((x) => x.active).length;
  const kasirCount = staffList.filter((x) => x.role === 'kasir' && x.active).length;
  const kitchenCount = staffList.filter((x) => x.role === 'kitchen' && x.active).length;
  const adminCount = staffList.filter((x) => x.role === 'admin' && x.active).length;

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPassword || saving) return;
    if (newPassword.length < 6) {
      showToast('Kata sandi minimal 6 karakter', 'warning');
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.rpc('admin_create_staff', {
      p_email: newEmail.trim(),
      p_password: newPassword,
      p_name: newName.trim(),
      p_role: newRole === 'kasir' ? 'staff' : newRole,
    });
    setSaving(false);
    if (error || data?.error) {
      showToast(error?.message || data?.error, 'warning');
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
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !staf.active, updated_at: new Date().toISOString() })
      .eq('id', staf.id);

    if (error) {
      showToast(error.message, 'warning');
      return;
    }
    showToast(`${staf.name} berhasil ${staf.active ? 'dinonaktifkan' : 'diaktifkan kembali'}`, 'info');
    loadStaff();
  };

  return (
    <div className="flex flex-col w-full p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1540px] mx-auto pb-28 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-[#ebe8e3]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1c1c19] tracking-tight">
            Akun Staf &amp; Hak Akses
          </h1>
        </div>

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

      {/* Inline Compact Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-[#ebe8e3]">
        <div className="px-2">
          <span className="text-[11px] font-semibold text-[#847374] uppercase tracking-wider">Total Staf Aktif</span>
          <div className="text-lg font-bold font-serif text-[#1c1c19] mt-0.5">
            {activeStaffCount} <span className="text-xs font-normal text-[#847374]">/ {staffList.length} orang</span>
          </div>
        </div>
        <div className="px-2 border-l border-[#ebe8e3]">
          <span className="text-[11px] font-semibold text-[#847374] uppercase tracking-wider">Kasir (POS)</span>
          <div className="text-lg font-bold font-serif text-[#3d1018] mt-0.5">
            {kasirCount} <span className="text-xs font-normal text-[#847374]">aktif</span>
          </div>
        </div>
        <div className="px-2 border-l border-[#ebe8e3]">
          <span className="text-[11px] font-semibold text-[#847374] uppercase tracking-wider">Dapur</span>
          <div className="text-lg font-bold font-serif text-[#994703] mt-0.5">
            {kitchenCount} <span className="text-xs font-normal text-[#847374]">aktif</span>
          </div>
        </div>
        <div className="px-2 border-l border-[#ebe8e3]">
          <span className="text-[11px] font-semibold text-[#847374] uppercase tracking-wider">Admin Outlet</span>
          <div className="text-lg font-bold font-serif text-[#1c1c19] mt-0.5">
            {adminCount} <span className="text-xs font-normal text-[#847374]">aktif</span>
          </div>
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
              <option value="kasir">Kasir</option>
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

      {/* Staff Table */}
      <div className="bg-white rounded-xl border border-[#ebe8e3] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f6f3ee] border-b border-[#ebe8e3] text-[11px] font-bold text-[#847374] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Nama Staf</th>
                <th className="py-2.5 px-4">Email / ID Pengguna</th>
                <th className="py-2.5 px-4">Hak Akses (Role)</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebe8e3]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-[#847374]">
                    Tidak ada akun staf yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filtered.map((staf) => {
                  const isCurrent = staf.id === currentUser?.id;
                  return (
                    <tr
                      key={staf.id}
                      className={`hover:bg-[#fcfaf7] transition-colors ${
                        staf.active ? '' : 'bg-[#faf8f5]/60 text-[#847374]'
                      }`}
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
                            {isCurrent && (
                              <span className="text-[10px] text-[#3d1018] font-bold tracking-tight">
                                (Akun Anda Saat Ini)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#524344]">{staf.email}</td>
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
                          {staf.role === 'admin'
                            ? 'Admin Outlet'
                            : staf.role === 'kitchen'
                            ? 'Dapur'
                            : 'Kasir POS'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              staf.active ? 'bg-[#3d1018]' : 'bg-[#c5bcb5]'
                            }`}
                          />
                          <span
                            className={`text-xs font-semibold ${
                              staf.active ? 'text-[#1c1c19]' : 'text-[#847374]'
                            }`}
                          >
                            {staf.active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isCurrent ? (
                          <span className="text-[11px] text-[#847374] italic">Tidak dapat diubah</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleActive(staf)}
                            className={`px-3 py-1 rounded text-xs font-semibold border transition-colors cursor-pointer inline-flex items-center justify-center ${
                              staf.active
                                ? 'border-[#ebe8e3] text-[#524344] hover:bg-neutral-100 hover:text-red-700'
                                : 'border-[#3d1018] text-[#3d1018] hover:bg-[#3d1018] hover:text-white'
                            }`}
                          >
                            {staf.active ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        )}
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
                <h3 className="font-serif text-lg font-bold text-[#1c1c19]">
                  Tambah Akun Staf Baru
                </h3>
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
                  <option value="kasir">Kasir — Akses POS, Meja, Pesanan &amp; Checkout</option>
                  <option value="kitchen">Dapur — Akses Pantau Pesanan &amp; Tiket Masak</option>
                  <option value="admin">Admin Outlet — Akses Penuh (Menu, Meja, Staf, Laporan)</option>
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
    </div>
  );
};
