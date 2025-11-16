/**
 * Data Retention Service
 * Automatically deletes user data based on their retention policy settings
 * Supports policies: 30days, 90days, 1year, forever
 */

import { storage } from "./storage";

interface RetentionPolicy {
  value: string;
  days: number | null; // null means keep forever
}

const RETENTION_POLICIES: Record<string, RetentionPolicy> = {
  "30days": { value: "30days", days: 30 },
  "90days": { value: "90days", days: 90 },
  "1year": { value: "1year", days: 365 },
  "forever": { value: "forever", days: null },
};

/**
 * Calculate the cutoff date for a retention policy
 * Data older than this date should be deleted
 */
function getCutoffDate(policy: string): Date | null {
  const policyConfig = RETENTION_POLICIES[policy];
  
  if (!policyConfig || policyConfig.days === null) {
    // Keep forever - no cutoff date
    return null;
  }
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - policyConfig.days);
  return cutoffDate;
}

/**
 * Clean up expired data for all users based on their retention policies
 * This function should be called periodically (e.g., daily via cron job)
 */
export async function cleanupExpiredData(): Promise<{
  totalUsersProcessed: number;
  totalRecordingsDeleted: number;
  totalContractsDeleted: number;
}> {
  console.log("[DataRetention] Starting automatic data cleanup...");
  
  let totalUsersProcessed = 0;
  let totalRecordingsDeleted = 0;
  let totalContractsDeleted = 0;

  try {
    // Get all users (we could optimize this to only fetch users with non-forever policies)
    const users = await storage.getAllUsers();
    
    for (const user of users) {
      // Skip users with "forever" retention policy
      if (!user.dataRetentionPolicy || user.dataRetentionPolicy === "forever") {
        continue;
      }
      
      const cutoffDate = getCutoffDate(user.dataRetentionPolicy);
      
      if (!cutoffDate) {
        continue; // Safety check
      }
      
      // Get user's recordings and contracts
      const recordings = await storage.getRecordingsByUserId(user.id);
      const contracts = await storage.getContractsByUserId(user.id);
      
      // Delete recordings older than cutoff date
      for (const recording of recordings) {
        if (new Date(recording.createdAt) < cutoffDate) {
          const deleted = await storage.deleteRecording(recording.id, user.id);
          if (deleted) {
            totalRecordingsDeleted++;
            console.log(`[DataRetention] Deleted recording ${recording.id} for user ${user.id} (created: ${recording.createdAt})`);
          }
        }
      }
      
      // Delete contracts older than cutoff date
      for (const contract of contracts) {
        if (new Date(contract.createdAt) < cutoffDate) {
          const deleted = await storage.deleteContract(contract.id, user.id);
          if (deleted) {
            totalContractsDeleted++;
            console.log(`[DataRetention] Deleted contract ${contract.id} for user ${user.id} (created: ${contract.createdAt})`);
          }
        }
      }
      
      totalUsersProcessed++;
    }
    
    console.log(`[DataRetention] Cleanup complete: ${totalUsersProcessed} users processed, ${totalRecordingsDeleted} recordings deleted, ${totalContractsDeleted} contracts deleted`);
    
    return {
      totalUsersProcessed,
      totalRecordingsDeleted,
      totalContractsDeleted,
    };
  } catch (error) {
    console.error("[DataRetention] Error during cleanup:", error);
    throw error;
  }
}

// Singleton guard to prevent duplicate initialization
let isInitialized = false;

/**
 * Initialize automatic data retention cleanup
 * Runs cleanup immediately on startup and then every 24 hours
 * Protected by singleton guard to prevent duplicate intervals in dev hot reload
 */
export function initializeDataRetention(): void {
  if (isInitialized) {
    console.log("[DataRetention] Already initialized, skipping duplicate initialization");
    return;
  }
  
  isInitialized = true;
  console.log("[DataRetention] Initializing automatic data retention cleanup...");
  
  // Run cleanup on startup (after a short delay to ensure DB is ready)
  setTimeout(() => {
    cleanupExpiredData().catch((error) => {
      console.error("[DataRetention] Failed to run initial cleanup:", error);
    });
  }, 10000); // 10 second delay
  
  // Schedule cleanup to run daily (every 24 hours)
  const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  setInterval(() => {
    cleanupExpiredData().catch((error) => {
      console.error("[DataRetention] Failed to run scheduled cleanup:", error);
    });
  }, CLEANUP_INTERVAL);
  
  console.log("[DataRetention] Automatic cleanup scheduled (runs every 24 hours)");
}
