/**
 * TypeScript Types for PMY
 * 
 * Plain TypeScript types extracted from Drizzle schema.
 * Used by both backend and frontend.
 */

// ================================================================
// Universities
// ================================================================

export interface University {
  id: string;
  name: string;
  state: string;
  titleIXInfo: string;
  titleIXUrl: string | null;
  lastUpdated: string;
  verifiedAt: string | null;
}

export interface InsertUniversity {
  name: string;
  state: string;
  titleIXInfo: string;
  titleIXUrl?: string | null;
}

// ================================================================
// State Laws
// ================================================================

export interface StateLaw {
  id: string;
  stateCode: string;
  stateName: string;
  consentLawInfo: string;
  ageOfConsent: number;
  romeoJulietLaw: string | null;
  affirmativeConsentRequired: string | null;
  reportingRequirements: string | null;
  sourceUrl: string | null;
  lastUpdated: string;
  verifiedAt: string | null;
}

export interface InsertStateLaw {
  stateCode: string;
  stateName: string;
  consentLawInfo: string;
  ageOfConsent: number;
  romeoJulietLaw?: string | null;
  affirmativeConsentRequired?: string | null;
  reportingRequirements?: string | null;
  sourceUrl?: string | null;
}

// ================================================================
// User Profiles
// ================================================================

export interface UserProfile {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  profilePictureUrl: string | null;
  bio: string | null;
  websiteUrl: string | null;
  savedSignature: string | null;
  savedSignatureType: string | null;
  savedSignatureText: string | null;
  dataRetentionPolicy: string;
  stripeCustomerId: string | null;
  referralCode: string | null;
  referralCount: number;
  referredBy: string | null;
  defaultUniversityId: string | null;
  stateOfResidence: string | null;
  defaultEncounterType: string | null;
  defaultContractDuration: number | null;
  isVerified: string;
  verificationProvider: string | null;
  verifiedAt: string | null;
  verificationLevel: string | null;
  emailNotificationsEnabled: string;
  createdAt: string;
  updatedAt: string;
}

export interface InsertUserProfile {
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  profilePictureUrl?: string | null;
  bio?: string | null;
  websiteUrl?: string | null;
  savedSignature?: string | null;
  savedSignatureType?: string | null;
  savedSignatureText?: string | null;
  dataRetentionPolicy?: '30days' | '90days' | '1year' | 'forever';
  stripeCustomerId?: string | null;
  referralCode?: string | null;
  referralCount?: number;
  referredBy?: string | null;
  defaultUniversityId?: string | null;
  stateOfResidence?: string | null;
  defaultEncounterType?: string | null;
  defaultContractDuration?: number | null;
  isVerified?: string;
  verificationProvider?: string | null;
  verifiedAt?: string | null;
  verificationLevel?: string | null;
  emailNotificationsEnabled?: string;
}

// ================================================================
// Consent Recordings
// ================================================================

export interface ConsentRecording {
  id: string;
  userId: string | null;
  universityId: string | null;
  encounterType: string | null;
  parties: string[] | null;
  filename: string;
  fileUrl: string;
  duration: string;
  createdAt: string;
}

export interface InsertConsentRecording {
  userId?: string | null;
  universityId?: string | null;
  encounterType?: string | null;
  parties?: string[] | null;
  filename: string;
  fileUrl: string;
  duration: string;
}

// ================================================================
// Consent Contracts
// ================================================================

export interface ConsentContract {
  id: string;
  userId: string | null;
  universityId: string | null;
  encounterType: string | null;
  parties: string[] | null;
  contractStartTime: string | null;
  contractDuration: number | null;
  contractEndTime: string | null;
  method: string | null;
  contractText: string | null;
  signature1: string | null;
  signature2: string | null;
  photoUrl: string | null;
  credentialId: string | null;
  credentialPublicKey: string | null;
  credentialCounter: string | null;
  credentialDeviceType: string | null;
  credentialBackedUp: string | null;
  authenticatedAt: string | null;
  verifiedAt: string | null;
  status: string;
  isCollaborative: string;
  lastEditedBy: string | null;
  intimateActs: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InsertConsentContract {
  userId?: string | null;
  universityId?: string | null;
  encounterType?: string | null;
  parties?: string[];
  contractStartTime?: string | null;
  contractDuration?: number | null;
  contractEndTime?: string | null;
  method?: 'signature' | 'voice' | 'photo' | 'biometric';
  contractText?: string | null;
  signature1?: string | null;
  signature2?: string | null;
  photoUrl?: string | null;
  credentialId?: string | null;
  credentialPublicKey?: string | null;
  credentialCounter?: string | null;
  credentialDeviceType?: string | null;
  credentialBackedUp?: string | null;
  authenticatedAt?: string | null;
  verifiedAt?: string | null;
  status?: 'draft' | 'pending_approval' | 'active' | 'paused' | 'completed' | 'rejected';
  isCollaborative?: 'true' | 'false';
  intimateActs?: string | null;
}

// ================================================================
// Contract Amendments
// ================================================================

export interface ContractAmendment {
  id: string;
  contractId: string;
  requestedBy: string;
  type: string;
  description: string | null;
  newValue: any;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ================================================================
// Notifications
// ================================================================

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: string;
  relatedContractId: string | null;
  relatedAmendmentId: string | null;
  createdAt: string;
}

// ================================================================
// User Contacts
// ================================================================

export interface UserContact {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  username: string | null;
  createdAt: string;
}

