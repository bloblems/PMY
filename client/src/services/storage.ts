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
 * iOS Secure Storage implementation (to be implemented in Phase 1, Task 5)
 * 
 * STATUS: Graceful fallback implementation - delegates to WebStorageService until Capacitor is installed
 * This ensures the app won't crash if somehow routed to SecureStorage before Task 5 is complete
 * 
 * IMPLEMENTATION PLAN (when Capacitor is installed - Task 5):
 * 1. Install Capacitor plugins:
 *    npm install @capacitor/preferences
 *    npm install capacitor-secure-storage-plugin
 * 
 * 2. Import and use Capacitor APIs:
 *    import { Preferences } from '@capacitor/preferences';
 *    import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';
 * 
 * 3. Replace fallback calls with native Capacitor storage methods
 *    Use Preferences API for general storage and SecureStorage for sensitive data
 * 
 * 4. Keep fallback to WebStorageService if plugins unavailable (graceful degradation)
 * 
 * SECURITY NOTE: When implemented, this will store consent flow data in
 * iOS Keychain via SecureStorage, providing encryption-at-rest and
 * protection against unauthorized access even on jailbroken devices.
 */
class SecureStorageService implements StorageService {
  private fallback: WebStorageService;

  constructor() {
    this.fallback = new WebStorageService();
    console.warn('[SecureStorageService] Using fallback to WebStorageService - Capacitor not installed');
  }

  async getItem(key: string): Promise<string | null> {
    // TODO: Replace with Capacitor implementation in Task 5
    // try {
    //   const { value } = await Preferences.get({ key });
    //   return value;
    // } catch (e) {
    //   console.error('[SecureStorage] getItem failed, falling back:', e);
    //   return this.fallback.getItem(key);
    // }
    return this.fallback.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    // TODO: Replace with Capacitor implementation in Task 5
    // try {
    //   await Preferences.set({ key, value });
    // } catch (e) {
    //   console.error('[SecureStorage] setItem failed, falling back:', e);
    //   return this.fallback.setItem(key, value);
    // }
    return this.fallback.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    // TODO: Replace with Capacitor implementation in Task 5
    // try {
    //   await Preferences.remove({ key });
    // } catch (e) {
    //   console.error('[SecureStorage] removeItem failed, falling back:', e);
    //   return this.fallback.removeItem(key);
    // }
    return this.fallback.removeItem(key);
  }

  async clear(): Promise<void> {
    // TODO: Replace with Capacitor implementation in Task 5
    // try {
    //   await Preferences.clear();
    // } catch (e) {
    //   console.error('[SecureStorage] clear failed, falling back:', e);
    //   return this.fallback.clear();
    // }
    return this.fallback.clear();
  }

  async isAvailable(): Promise<boolean> {
    // TODO: Replace with Capacitor plugin check in Task 5
    // Check if Capacitor plugins are available
    // For now, indicate we're using fallback
    return this.fallback.isAvailable();
  }
}

/**
 * Platform detection
 * 
 * CURRENT STATUS: Always returns false until Capacitor is installed
 * This is expected behavior for Phase 1, Task 1-4 (web implementation)
 * 
 * FUTURE: When Capacitor is installed (Task 5), window.Capacitor will be
 * available and this will correctly detect iOS/Android native platforms
 */
function isCapacitorPlatform(): boolean {
  // Check if running in Capacitor environment
  // Note: window.Capacitor only exists after Capacitor installation
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
