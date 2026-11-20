/**
 * Authentication and CORS helpers for Admin API.
 * Adheres to SRP (Single Responsibility Principle) and Clean Code standards.
 */

import { createClient } from '@supabase/supabase-js';

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };

export const allowedOrigins = (process.env.STAFF_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const defaultDevOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

export const isOriginAllowed = (origin) => {
  if (!origin) return false;
  if (allowedOrigins.length > 0) {
    return allowedOrigins.includes(origin);
  }
  // In development, allow localhost origins
  if (process.env.NODE_ENV !== 'production') {
    return defaultDevOrigins.includes(origin);
  }
  return false;
};

export const corsHeaders = (origin) => {
  const headers = {
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type',
  };
  if (origin && isOriginAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
};

export const jsonResponse = (data, status = 200, origin = null) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-store',
      ...corsHeaders(origin),
    },
  });

/**
 * Authenticates bearer token and confirms admin role in profiles.
 * @param {Request} request
 * @param {string|null} origin
 * @returns {Promise<{ user?: any, admin?: any, response?: Response }>}
 */
export const authenticateAdmin = async (request, origin) => {
  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    return { response: jsonResponse({ error: 'Authentication required' }, 401, origin) };
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !secretKey) {
    return { response: jsonResponse({ error: 'Konfigurasi server belum lengkap.' }, 500, origin) };
  }

  const userClient = createClient(url, anonKey, {
    ...clientOptions,
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userData?.user) {
    return { response: jsonResponse({ error: 'Authentication required' }, 401, origin) };
  }

  const { data: caller } = await userClient
    .from('profiles')
    .select('role, is_active')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (!caller || caller.role !== 'admin' || !caller.is_active) {
    return { response: jsonResponse({ error: 'Hanya admin aktif yang dapat mengelola staf.' }, 403, origin) };
  }

  return {
    user: userData.user,
    admin: createClient(url, secretKey, clientOptions),
  };
};
