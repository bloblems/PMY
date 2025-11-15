/**
 * Storage Service Abstraction
 * 
 * Provides a unified interface for storage operations that works across
 * web (sessionStorage) and iOS native (Capacitor SecureStorage/Keychain).
 * 
 * This abstraction enables seamless transition from web to iOS without
 * changing application code.
 */

export interface StorageService {
  /**
   * Retrieve a value from storage
   * @param key Storage key
   * @returns Promise resolving to the value, or null if not found
   */
  getItem(key: string): Promise<string | null>;

  /**
   * Store a value
   * @param key Storage key
   * @param value Value to store (will be stringified if object)
   */
  setItem(key: string, value: string): Promise<void>;

  /**
   * Remove a value from storage
   * @param key Storage key
   */
  removeItem(key: string): Promise<void>;

  /**
   * Clear all storage (use with caution)
   */
  clear(): Promise<void>;

  /**
   * Check if storage is available
   * Useful for detecting iOS private browsing mode
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Web implementation using sessionStorage
 * Falls back to in-memory storage if sessionStorage is unavailable
 * (e.g., iOS private browsing mode, Safari with strict settings)
 */
class WebStorageService implements StorageService {
  private memoryFallback: Map<string, string> = new Map();
  private usingFallback: boolean = false;

  constructor() {
    this.checkAvailability();
  }

  private checkAvailability() {
    try {
      const testKey = '__storage_test__';
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      this.usingFallback = false;
    } catch (e) {
      console.warn('[WebStorage] sessionStorage unavailable, using in-memory fallback');
      this.usingFallback = true;
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      if (this.usingFallback) {
        return this.memoryFallback.get(key) || null;
      }
      return sessionStorage.getItem(key);
    } catch (e) {
      console.error('[WebStorage] getItem failed:', e);
      return this.memoryFallback.get(key) || null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (this.usingFallback) {
        this.memoryFallback.set(key, value);
        return;
      }
      sessionStorage.setItem(key, value);
    } catch (e) {
      console.error('[WebStorage] setItem failed, falling back to memory:', e);
      this.memoryFallback.set(key, value);
      this.usingFallback = true;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (this.usingFallback) {
        this.memoryFallback.delete(key);
        return;
      }
      sessionStorage.removeItem(key);
    } catch (e) {
      console.error('[WebStorage] removeItem failed:', e);
      this.memoryFallback.delete(key);
    }
  }

  async clear(): Promise<void> {
    try {
      if (this.usingFallback) {
        this.memoryFallback.clear();
        return;
      }
      sessionStorage.clear();
    } catch (e) {
      console.error('[WebStorage] clear failed:', e);
      this.memoryFallback.clear();
    }
  }

  async isAvailable(): Promise<boolean> {
    return !this.usingFallback;
  }
}

/**
 * iOS Secure Storage implementation (placeholder for Capacitor integration)
 * 
 * When Capacitor is installed, this will use:
 * - @capacitor/preferences for general key-value storage
 * - capacitor-secure-storage-plugin for sensitive data (iOS Keychain)
 * 
 * Installation:
 *   npm install @capacitor/preferences
 *   npm install capacitor-secure-storage-plugin
 * 
 * Usage in Capacitor app:
 *   import { Preferences } from '@capacitor/preferences';
 *   import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';
 */
class SecureStorageService implements StorageService {
  async getItem(key: string): Promise<string | null> {
    // TODO: Implement when Capacitor is installed
    // const { value } = await Preferences.get({ key });
    // return value;
    throw new Error('SecureStorageService not yet implemented - install Capacitor first');
  }

  async setItem(key: string, value: string): Promise<void> {
    // TODO: Implement when Capacitor is installed
    // await Preferences.set({ key, value });
    throw new Error('SecureStorageService not yet implemented - install Capacitor first');
  }

  async removeItem(key: string): Promise<void> {
    // TODO: Implement when Capacitor is installed
    // await Preferences.remove({ key });
    throw new Error('SecureStorageService not yet implemented - install Capacitor first');
  }

  async clear(): Promise<void> {
    // TODO: Implement when Capacitor is installed
    // await Preferences.clear();
    throw new Error('SecureStorageService not yet implemented - install Capacitor first');
  }

  async isAvailable(): Promise<boolean> {
    // TODO: Implement when Capacitor is installed
    // Check if Capacitor plugins are available
    return false;
  }
}

/**
 * Platform detection
 */
function isCapacitorPlatform(): boolean {
  // Check if running in Capacitor environment
  return typeof window !== 'undefined' && 
         window.hasOwnProperty('Capacitor') && 
         // @ts-ignore - Capacitor global added by Capacitor runtime
         window.Capacitor?.isNativePlatform?.();
}

/**
 * Factory function to create appropriate storage service based on platform
 */
export function createStorageService(): StorageService {
  if (isCapacitorPlatform()) {
    // When running on iOS/Android via Capacitor, use native secure storage
    return new SecureStorageService();
  }
  
  // Default to web storage (sessionStorage with fallback)
  return new WebStorageService();
}

/**
 * Singleton instance - use this throughout the application
 */
export const storage: StorageService = createStorageService();

/**
 * Development/testing utility to check current platform
 */
export function getStoragePlatform(): 'web' | 'ios' | 'android' | 'unknown' {
  if (typeof window === 'undefined') return 'unknown';
  
  // @ts-ignore
  const capacitor = window.Capacitor;
  if (!capacitor?.isNativePlatform?.()) return 'web';
  
  // @ts-ignore
  const platform = capacitor.getPlatform?.();
  if (platform === 'ios') return 'ios';
  if (platform === 'android') return 'android';
  
  return 'unknown';
}
