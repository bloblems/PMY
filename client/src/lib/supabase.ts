import { createClient } from '@supabase/supabase-js';

// Supabase V3 API (2025) - Updated environment variable names
const supabaseUrl = import.meta.env.VITE_SUPABASE_PROJECT_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_PUBLIC;

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_PROJECT_URL environment variable is required');
}

if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_PUBLIC environment variable is required');
}

// Create Supabase client for frontend with PKCE flow
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});
