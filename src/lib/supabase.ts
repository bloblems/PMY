import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// Custom storage adapter for Expo SecureStore
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key);
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_PROJECT_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_PUBLIC || '';

// Validate Supabase configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials are missing! Please check your .env file.');
} else {
  // Validate URL format
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    console.warn('⚠️ Supabase URL format looks incorrect. Should be: https://xxxxx.supabase.co');
  }
  
  // Validate key format (can be JWT starting with 'eyJ' or service role key)
  if (supabaseAnonKey.length < 20) {
    console.warn('⚠️ Supabase anon key looks too short. Please verify your EXPO_PUBLIC_SUPABASE_ANON_PUBLIC in .env file.');
  }
  
  if (__DEV__) {
    console.log('✅ Supabase URL:', supabaseUrl);
    console.log('✅ Supabase Key (first 20 chars):', supabaseAnonKey.substring(0, 20) + '...');
  }
}

// Create Supabase client for React Native with PKCE flow
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: ExpoSecureStoreAdapter,
    // Handle refresh token errors gracefully
    debug: __DEV__,
  },
});

// Get current session
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

