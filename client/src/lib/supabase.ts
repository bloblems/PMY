import { createClient, Session } from '@supabase/supabase-js';

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

// Global session reference that gets updated by onAuthStateChange
let currentSession: Session | null = null;

// Initialize session on app load
supabase.auth.getSession().then(({ data: { session } }) => {
  currentSession = session;
});

// Listen for auth state changes and update global session
supabase.auth.onAuthStateChange((_event, session) => {
  currentSession = session;
});

// Get current session (automatically refreshed by Supabase)
export function getCurrentSession(): Session | null {
  return currentSession;
}
