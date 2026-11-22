/**
 * Staff Management Business Logic Service.
 * Decoupled from HTTP routing per Single Responsibility Principle (SRP).
 */

const ROLES = ['admin', 'owner', 'cashier', 'kitchen'];
const MIN_PASSWORD_LENGTH = 6;

export const toStaffDto = (profile, email, lastSignIn) => ({
  id: profile.id,
  full_name: profile.full_name,
  username: email,
  role: profile.role,
  is_active: profile.is_active,
  last_login: lastSignIn ?? undefined,
  created_at: profile.created_at,
});

export const parseCreateStaffInput = (body) => {
  const full_name = typeof body?.full_name === 'string' ? body.full_name.trim() : '';
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const role = body?.role;
  const is_active = body?.is_active ?? true;

  if (!full_name || full_name.length > 100) return { error: 'Nama lengkap wajib diisi (maks. 100 karakter).' };
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) return { error: 'Masukkan email login yang valid.' };
  if (password.length < MIN_PASSWORD_LENGTH || password.length > 128) {
    return { error: `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.` };
  }
  if (!ROLES.includes(role)) return { error: 'Role tidak valid.' };
  if (typeof is_active !== 'boolean') return { error: 'Status akun tidak valid.' };

  return { value: { full_name, email, password, role, is_active } };
};

export const parseUpdateStaffInput = (body) => {
  const update = {};
  if (body?.full_name !== undefined) {
    const full_name = typeof body.full_name === 'string' ? body.full_name.trim() : '';
    if (!full_name || full_name.length > 100) return { error: 'Nama lengkap wajib diisi (maks. 100 karakter).' };
    update.full_name = full_name;
  }
  if (body?.email !== undefined) {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) return { error: 'Masukkan email login yang valid.' };
    update.email = email;
  }
  if (body?.password !== undefined) {
    if (typeof body.password !== 'string' || body.password.length < MIN_PASSWORD_LENGTH || body.password.length > 128) {
      return { error: `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.` };
    }
    update.password = body.password;
  }
  if (body?.role !== undefined) {
    if (!ROLES.includes(body.role)) return { error: 'Role tidak valid.' };
    update.role = body.role;
  }
  if (body?.is_active !== undefined) {
    if (typeof body.is_active !== 'boolean') return { error: 'Status akun tidak valid.' };
    update.is_active = body.is_active;
  }
  if (Object.keys(update).length === 0) return { error: 'Tidak ada perubahan yang diberikan.' };

  return { value: update };
};

export const listStaff = async (adminClient) => {
  const [profilesResult, authResult] = await Promise.all([
    adminClient.from('profiles').select('id, full_name, role, is_active, created_at').order('created_at', { ascending: false }),
    adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  if (profilesResult.error || authResult.error) {
    throw new Error('Gagal memuat akun staf dari database.');
  }

  const users = new Map((authResult.data?.users ?? []).map((u) => [u.id, u]));
  return (profilesResult.data ?? []).map((profile) => {
    const account = users.get(profile.id);
    return toStaffDto(profile, account?.email ?? '', account?.last_sign_in_at);
  });
};

export const createStaff = async (adminClient, input) => {
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    app_metadata: { role: input.role },
    user_metadata: { full_name: input.full_name },
  });

  if (createError || !created?.user) {
    throw new Error(createError?.message ?? 'Gagal membuat akun autentikasi.');
  }

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .insert({ id: created.user.id, full_name: input.full_name, role: input.role, is_active: input.is_active })
    .select('id, full_name, role, is_active, created_at')
    .single();

  if (profileError || !profile) {
    await adminClient.auth.admin.deleteUser(created.user.id);
    throw new Error(profileError?.message ?? 'Gagal membuat profil staf.');
  }

  return toStaffDto(profile, input.email);
};

export const updateStaff = async (adminClient, id, input) => {
  const authUpdate = {};
  if (input.email !== undefined) {
    authUpdate.email = input.email;
    authUpdate.email_confirm = true;
  }
  if (input.password !== undefined) authUpdate.password = input.password;
  if (input.role !== undefined) authUpdate.app_metadata = { role: input.role };
  if (input.full_name !== undefined) authUpdate.user_metadata = { full_name: input.full_name };

  if (Object.keys(authUpdate).length > 0) {
    const { error } = await adminClient.auth.admin.updateUserById(id, authUpdate);
    if (error) throw new Error(error.message);
  }

  const profileUpdate = {};
  if (input.full_name !== undefined) profileUpdate.full_name = input.full_name;
  if (input.role !== undefined) profileUpdate.role = input.role;
  if (input.is_active !== undefined) profileUpdate.is_active = input.is_active;

  if (Object.keys(profileUpdate).length > 0) {
    const { error } = await adminClient.from('profiles').update(profileUpdate).eq('id', id);
    if (error) throw new Error(error.message);
  }

  const [profileResult, userResult] = await Promise.all([
    adminClient.from('profiles').select('id, full_name, role, is_active, created_at').eq('id', id).single(),
    adminClient.auth.admin.getUserById(id),
  ]);

  if (profileResult.error || userResult.error || !profileResult.data || !userResult.data?.user) {
    throw new Error('Gagal memuat akun staf setelah perubahan.');
  }

  return toStaffDto(profileResult.data, userResult.data.user.email ?? '', userResult.data.user.last_sign_in_at);
};

export const deleteStaff = async (adminClient, id, currentUserId) => {
  if (currentUserId === id) {
    throw new Error('Akun admin yang sedang dipakai tidak dapat dihapus.');
  }
  const { error } = await adminClient.auth.admin.deleteUser(id);
  if (error) throw new Error(error.message);
  return { success: true, id };
};
