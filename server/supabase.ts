import { createClient } from '@supabase/supabase-js';

// Supabase V3 API (2025) - Updated environment variable names
const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_PUBLIC;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_SECRET;

if (!supabaseUrl) {
  throw new Error('SUPABASE_PROJECT_URL environment variable is required');
}

if (!supabaseAnonKey) {
  throw new Error('SUPABASE_ANON_PUBLIC environment variable is required');
}

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_SECRET environment variable is required');
}

// Admin client for server-side operations with service role (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Client for server-side operations with anon key (respects RLS, uses PKCE)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: false,
    persistSession: false,
  },
});
