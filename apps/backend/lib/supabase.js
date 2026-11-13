/**
 * Supabase Client Factory for Next.js FP Backend (JavaScript).
 * Pure factory function without class instantiations.
 */

import { createClient } from '@supabase/supabase-js';

const getEnv = (key, fallback = '') =>
  process.env[key] || process.env[`NEXT_PUBLIC_${key}`] || process.env[`VITE_${key}`] || fallback;

const supabaseUrl = getEnv('SUPABASE_URL', 'https://mock-project.supabase.co');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY', 'mock-anon-key');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});
