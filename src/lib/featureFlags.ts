/**
 * Feature Flags Configuration
 *
 * Controls experimental and beta features in the application.
 * Flags are controlled via environment variables prefixed with EXPO_PUBLIC_ENABLE_
 */

interface FeatureFlags {
  collaborativeContracts: boolean;
}

/**
 * Check if a feature flag is enabled
 * Features are disabled by default for safety
 */
function isFeatureEnabled(envVar: string): boolean {
  const value = process.env[envVar];
  return value === 'true' || value === '1';
}

/**
 * Global feature flags object
 */
export const featureFlags: FeatureFlags = {
  /**
   * Collaborative Contracts (BETA)
   *
   * Enables async collaborative contract creation where users can:
   * - Save drafts and share them with partners
   * - Invite partners via email to review and approve
   * - View pending approvals in Inbox tab
   * - Co-create consent documentation through mutual approval
   *
   * When disabled:
   * - Save/Share buttons are hidden from consent flow
   * - Only "Active Contracts" tab is shown in Files page
   * - Users can only create finalized contracts directly
   *
   * To enable: Set EXPO_PUBLIC_ENABLE_COLLABORATIVE_CONTRACTS=true in environment
   */
  collaborativeContracts: isFeatureEnabled('EXPO_PUBLIC_ENABLE_COLLABORATIVE_CONTRACTS'),
};

/**
 * Helper to check if collaborative contracts feature is enabled
 */
export function useCollaborativeContracts(): boolean {
  return featureFlags.collaborativeContracts;
}
