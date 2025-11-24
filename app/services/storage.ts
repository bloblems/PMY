/**
 * Storage Service for Expo
 * 
 * Uses Expo SecureStore for encrypted storage on iOS/Android
 */

import * as SecureStore from 'expo-secure-store';

export interface StorageService {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

class ExpoSecureStorageService implements StorageService {
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      console.error('[SecureStore] getItem failed:', e);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      console.error('[SecureStore] setItem failed:', e);
      throw e;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.error('[SecureStore] removeItem failed:', e);
    }
  }

  async clear(): Promise<void> {
    // SecureStore doesn't have a clear method, so we'd need to track keys
    // For now, just log a warning
    console.warn('[SecureStore] clear() not implemented - use removeItem for specific keys');
  }
}

export const storage: StorageService = new ExpoSecureStorageService();

