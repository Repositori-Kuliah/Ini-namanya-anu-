/**
 * Route Handler: /api/admin/staff (JavaScript).
 * Kelola akun staf. Pemanggil wajib mengirim access token Supabase milik admin aktif;
 * service key hanya dipakai di server untuk operasi auth.admin.
 */

import { createClient } from '@supabase/supabase-js';

const ROLES = ['admin', 'cashier', 'kitchen'];
const MIN_PASSWORD_LENGTH = 6;

const allowedOrigins = (process.env.STAFF_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsHeaders = (origin) => {
  const headers = {
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type',
  };
  if (origin && allowedOrigins.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
};

const json = (data, status, origin) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store', ...corsHeaders(origin) },
  });

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };

const toStaff = (profile, email, lastSignIn) => ({
  id: profile.id,
  full_name: profile.full_name,
  username: email,
  role: profile.role,
  is_active: profile.is_active,
  last_login: lastSignIn ?? undefined,
  created_at: profile.created_at,
});

const parseCreate = (body) => {
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

const parseUpdate = (body) => {
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

const authenticateAdmin = async (request, origin) => {
  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return { response: json({ error: 'Authentication required' }, 401, origin) };

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !secretKey) {
    return { response: json({ error: 'Konfigurasi server belum lengkap.' }, 500, origin) };
  }

  const userClient = createClient(url, anonKey, {
    ...clientOptions,
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userData.user) return { response: json({ error: 'Authentication required' }, 401, origin) };

  const { data: caller } = await userClient
    .from('profiles')
    .select('role, is_active')
    .eq('id', userData.user.id)
    .maybeSingle();
  if (!caller || caller.role !== 'admin' || !caller.is_active) {
    return { response: json({ error: 'Hanya admin aktif yang dapat mengelola staf.' }, 403, origin) };
  }

  return {
    user: userData.user,
    admin: createClient(url, secretKey, clientOptions),
  };
};

const handle = async (request, method) => {
  const origin = request.headers.get('origin');
  if (origin && !allowedOrigins.includes(origin)) return json({ error: 'Origin tidak diizinkan.' }, 403, origin);

  const auth = await authenticateAdmin(request, origin);
  if (auth.response) return auth.response;
  const { user, admin } = auth;
  const id = new URL(request.url).searchParams.get('id');

  try {
    if (method === 'GET') {
      const [profilesResult, authResult] = await Promise.all([
        admin.from('profiles').select('id, full_name, role, is_active, created_at').order('created_at', { ascending: false }),
        admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      ]);
      if (profilesResult.error || authResult.error) return json({ error: 'Gagal memuat akun staf.' }, 503, origin);

      const users = new Map((authResult.data.users ?? []).map((u) => [u.id, u]));
      const staff = (profilesResult.data ?? []).map((profile) => {
        const account = users.get(profile.id);
        return toStaff(profile, account?.email ?? '', account?.last_sign_in_at);
      });
      return json({ staff }, 200, origin);
    }

    if (method === 'POST') {
      const parsed = parseCreate(await request.json().catch(() => null));
      if (parsed.error) return json({ error: parsed.error }, 400, origin);
      const input = parsed.value;

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true,
        app_metadata: { role: input.role },
        user_metadata: { full_name: input.full_name },
      });
      if (createError || !created.user) {
        return json({ error: createError?.message ?? 'Gagal membuat akun autentikasi.' }, 400, origin);
      }

      const { data: profile, error: profileError } = await admin
        .from('profiles')
        .insert({ id: created.user.id, full_name: input.full_name, role: input.role, is_active: input.is_active })
        .select('id, full_name, role, is_active, created_at')
        .single();
      if (profileError || !profile) {
        await admin.auth.admin.deleteUser(created.user.id);
        return json({ error: profileError?.message ?? 'Gagal membuat profil staf.' }, 500, origin);
      }
      return json({ staff: toStaff(profile, input.email) }, 201, origin);
    }

    if (method === 'PATCH') {
      if (!id) return json({ error: 'ID staf wajib disertakan.' }, 400, origin);
      const parsed = parseUpdate(await request.json().catch(() => null));
      if (parsed.error) return json({ error: parsed.error }, 400, origin);
      const input = parsed.value;

      const authUpdate = {};
      if (input.email !== undefined) {
        authUpdate.email = input.email;
        authUpdate.email_confirm = true;
      }
      if (input.password !== undefined) authUpdate.password = input.password;
      if (input.role !== undefined) authUpdate.app_metadata = { role: input.role };
      if (Object.keys(authUpdate).length > 0) {
        const { error } = await admin.auth.admin.updateUserById(id, authUpdate);
        if (error) return json({ error: error.message }, 400, origin);
      }

      const profileUpdate = {};
      if (input.full_name !== undefined) profileUpdate.full_name = input.full_name;
      if (input.role !== undefined) profileUpdate.role = input.role;
      if (input.is_active !== undefined) profileUpdate.is_active = input.is_active;
      if (Object.keys(profileUpdate).length > 0) {
        const { error } = await admin.from('profiles').update(profileUpdate).eq('id', id);
        if (error) return json({ error: error.message }, 500, origin);
      }

      const [profileResult, userResult] = await Promise.all([
        admin.from('profiles').select('id, full_name, role, is_active, created_at').eq('id', id).single(),
        admin.auth.admin.getUserById(id),
      ]);
      if (profileResult.error || userResult.error || !profileResult.data || !userResult.data.user) {
        return json({ error: 'Gagal memuat akun staf setelah perubahan.' }, 500, origin);
      }
      return json(
        { staff: toStaff(profileResult.data, userResult.data.user.email ?? '', userResult.data.user.last_sign_in_at) },
        200,
        origin
      );
    }

    if (method === 'DELETE') {
      if (!id) return json({ error: 'ID staf wajib disertakan.' }, 400, origin);
      if (user.id === id) {
        return json({ error: 'Akun admin yang sedang dipakai tidak dapat dihapus.' }, 409, origin);
      }
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) return json({ error: error.message }, 500, origin);
      return json({ success: true, id }, 200, origin);
    }

    return json({ error: 'Method tidak diizinkan.' }, 405, origin);
  } catch {
    return json({ error: 'Terjadi kesalahan pada server.' }, 500, origin);
  }
};

export async function OPTIONS(request) {
  const origin = request.headers.get('origin');
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export const GET = (request) => handle(request, 'GET');
export const POST = (request) => handle(request, 'POST');
export const PATCH = (request) => handle(request, 'PATCH');
export const DELETE = (request) => handle(request, 'DELETE');
