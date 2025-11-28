/**
 * Supabase API Service
 * 
 * Direct Supabase client calls replacing Express API endpoints.
 * Uses Supabase REST API and Storage for all data operations.
 */

import { supabase, getSession } from '../lib/supabase';
import type {
  University,
  StateLaw,
  ConsentContract,
  ConsentRecording,
  UserProfile,
  ContractAmendment,
  Notification,
  UserContact,
} from '@shared/types';

// ================================================================
// Data Transformation Helpers
// ================================================================

function transformUniversity(data: any): University {
  return {
    id: data.id,
    name: data.name,
    state: data.state,
    domain: data.domain,
    titleIXInfo: data.title_ix_info,
    titleIXUrl: data.title_ix_url,
    logoUrl: data.logo_url,
    lastUpdated: data.last_updated,
    verifiedAt: data.verified_at,
  };
}

function transformStateLaw(data: any): StateLaw {
  return {
    id: data.id,
    stateCode: data.state_code,
    stateName: data.state_name,
    consentLawInfo: data.consent_law_info,
    ageOfConsent: data.age_of_consent,
    romeoJulietLaw: data.romeo_juliet_law,
    affirmativeConsentRequired: data.affirmative_consent_required,
    reportingRequirements: data.reporting_requirements,
    sourceUrl: data.source_url,
    lastUpdated: data.last_updated,
    verifiedAt: data.verified_at,
  };
}

// ================================================================
// Universities
// ================================================================

export async function getAllUniversities(): Promise<University[]> {
  const { data, error } = await supabase
    .from('universities')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return (data || []).map(transformUniversity);
}

export async function getUniversity(id: string): Promise<University | null> {
  const { data, error } = await supabase
    .from('universities')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data ? transformUniversity(data) : null;
}

// ================================================================
// State Laws
// ================================================================

export async function getAllStateLaws(): Promise<StateLaw[]> {
  const { data, error } = await supabase
    .from('state_laws')
    .select('*')
    .order('state_name');
  
  if (error) throw error;
  return (data || []).map(transformStateLaw);
}

export async function getStateLaw(stateCode: string): Promise<StateLaw | null> {
  const { data, error } = await supabase
    .from('state_laws')
    .select('*')
    .eq('state_code', stateCode.toUpperCase())
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data ? transformStateLaw(data) : null;
}

// ================================================================
// Contracts
// ================================================================

export async function getContracts(userId: string): Promise<ConsentContract[]> {
  const { data, error } = await supabase
    .from('consent_contracts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function getContract(id: string, userId: string): Promise<ConsentContract | null> {
  const { data, error } = await supabase
    .from('consent_contracts')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function createContract(contract: any): Promise<ConsentContract> {
  const { data, error } = await supabase
    .from('consent_contracts')
    .insert(contract)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateContract(id: string, userId: string, updates: any): Promise<ConsentContract | null> {
  const { data, error } = await supabase
    .from('consent_contracts')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function deleteContract(id: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('consent_contracts')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  
  if (error) throw error;
  return true;
}

export async function pauseContract(id: string, userId: string): Promise<ConsentContract | null> {
  return updateContract(id, userId, { status: 'paused', updated_at: new Date().toISOString() });
}

export async function resumeContract(id: string, userId: string): Promise<ConsentContract | null> {
  return updateContract(id, userId, { status: 'active', updated_at: new Date().toISOString() });
}

export async function getDrafts(userId: string): Promise<ConsentContract[]> {
  const { data, error } = await supabase
    .from('consent_contracts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'draft')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

// ================================================================
// Recordings
// ================================================================

export async function getRecordings(userId: string): Promise<ConsentRecording[]> {
  const { data, error } = await supabase
    .from('consent_recordings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function getRecording(id: string, userId: string): Promise<ConsentRecording | null> {
  const { data, error } = await supabase
    .from('consent_recordings')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function createRecording(recording: any): Promise<ConsentRecording> {
  const { data, error } = await supabase
    .from('consent_recordings')
    .insert(recording)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteRecording(id: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('consent_recordings')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  
  if (error) throw error;
  return true;
}

// ================================================================
// User Profile
// ================================================================

export async function getUserProfile(userId: string): Promise<any> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return data;
}

export async function updateUserProfile(userId: string, updates: any): Promise<any> {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return data;
}

export async function getUserPreferences(userId: string) {
  const profile = await getUserProfile(userId);
  if (!profile) return null;
  
  return {
    default_university_id: profile.default_university_id ?? null,
    state_of_residence: profile.state_of_residence ?? null,
    default_encounter_type: profile.default_encounter_type ?? null,
    default_contract_duration: profile.default_contract_duration ?? null,
  };
}

// ================================================================
// Notifications
// ================================================================

export async function getNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data || [];
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', 'false');
  
  if (error) throw error;
  return count || 0;
}

export async function markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: 'true' })
    .eq('id', notificationId)
    .eq('user_id', userId);
  
  if (error) throw error;
  return true;
}

export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: 'true' })
    .eq('user_id', userId);
  
  if (error) throw error;
  return true;
}

// ================================================================
// Amendments
// ================================================================

export async function getContractAmendments(contractId: string): Promise<ContractAmendment[]> {
  const { data, error } = await supabase
    .from('contract_amendments')
    .select('*')
    .eq('contract_id', contractId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function createAmendment(amendment: any): Promise<ContractAmendment> {
  const { data, error } = await supabase
    .from('contract_amendments')
    .insert(amendment)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ================================================================
// Contract Sharing / Collaboration
// ================================================================

export interface ContractCollaborator {
  id: string;
  contract_id: string;
  user_id: string | null;
  legal_name: string | null;
  contact_info: string | null;
  participant_type: string;
  role: string;
  status: string;
  last_viewed_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  confirmed_at: string | null;
  created_at: string;
}

export interface ContractInvitation {
  id: string;
  contract_id: string;
  sender_id: string;
  recipient_email: string;
  recipient_user_id: string | null;
  invitation_code: string;
  status: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

// Share contract with a PMY user (by user ID)
export async function shareContractWithUser(
  contractId: string,
  senderId: string,
  recipientUserId: string
): Promise<ContractCollaborator> {
  // First, update the contract to be collaborative
  await supabase
    .from('consent_contracts')
    .update({ is_collaborative: 'true' })
    .eq('id', contractId)
    .eq('user_id', senderId);

  // Add the collaborator
  const { data, error } = await supabase
    .from('contract_collaborators')
    .insert({
      contract_id: contractId,
      user_id: recipientUserId,
      participant_type: 'pmy_user',
      role: 'recipient',
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  // Create a notification for the recipient
  await supabase
    .from('notifications')
    .insert({
      user_id: recipientUserId,
      type: 'contract_invitation',
      title: 'New Contract Invitation',
      message: 'You have been invited to collaborate on a consent contract.',
      related_contract_id: contractId,
      is_read: 'false',
    });

  return data;
}

// Share contract via email (external invitation)
export async function shareContractViaEmail(
  contractId: string,
  senderId: string,
  recipientEmail: string
): Promise<ContractInvitation> {
  // Generate a unique invitation code
  const invitationCode = Math.random().toString(36).substring(2, 15) +
                         Math.random().toString(36).substring(2, 15);

  // Set expiration to 7 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Update contract to be collaborative
  await supabase
    .from('consent_contracts')
    .update({ is_collaborative: 'true' })
    .eq('id', contractId)
    .eq('user_id', senderId);

  // Create the invitation
  const { data, error } = await supabase
    .from('contract_invitations')
    .insert({
      contract_id: contractId,
      sender_id: senderId,
      recipient_email: recipientEmail,
      invitation_code: invitationCode,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  // TODO: Send email via Supabase Edge Function
  // For now, we just create the invitation record

  return data;
}

// Get collaborators for a contract
export async function getContractCollaborators(contractId: string): Promise<ContractCollaborator[]> {
  const { data, error } = await supabase
    .from('contract_collaborators')
    .select('*')
    .eq('contract_id', contractId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Get pending invitations for a user (by email or user ID)
export async function getPendingInvitations(userId: string, userEmail?: string): Promise<ContractInvitation[]> {
  // Get invitations by user ID
  let query = supabase
    .from('contract_invitations')
    .select('*')
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString());

  if (userEmail) {
    query = query.or(`recipient_user_id.eq.${userId},recipient_email.eq.${userEmail}`);
  } else {
    query = query.eq('recipient_user_id', userId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get pending collaborations for a user
export async function getPendingCollaborations(userId: string): Promise<ContractCollaborator[]> {
  const { data, error } = await supabase
    .from('contract_collaborators')
    .select('*, consent_contracts(*)')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Accept a contract invitation
export async function acceptInvitation(invitationId: string, userId: string): Promise<void> {
  const { data: invitation, error: fetchError } = await supabase
    .from('contract_invitations')
    .select('*')
    .eq('id', invitationId)
    .single();

  if (fetchError) throw fetchError;

  // Update invitation status
  const { error: updateError } = await supabase
    .from('contract_invitations')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      recipient_user_id: userId,
    })
    .eq('id', invitationId);

  if (updateError) throw updateError;

  // Create collaborator record
  await supabase
    .from('contract_collaborators')
    .insert({
      contract_id: invitation.contract_id,
      user_id: userId,
      participant_type: 'pmy_user',
      role: 'recipient',
      status: 'reviewing',
    });
}

// Accept/approve collaboration
export async function approveCollaboration(collaboratorId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('contract_collaborators')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
    })
    .eq('id', collaboratorId)
    .eq('user_id', userId);

  if (error) throw error;
}

// Reject collaboration
export async function rejectCollaboration(
  collaboratorId: string,
  userId: string,
  reason?: string
): Promise<void> {
  const { error } = await supabase
    .from('contract_collaborators')
    .update({
      status: 'rejected',
      rejected_at: new Date().toISOString(),
      rejection_reason: reason || null,
    })
    .eq('id', collaboratorId)
    .eq('user_id', userId);

  if (error) throw error;
}

// ================================================================
// User Contacts
// ================================================================

export async function getUserContacts(userId: string): Promise<UserContact[]> {
  const { data, error } = await supabase
    .from('user_contacts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function addUserContact(userId: string, contact: any): Promise<UserContact> {
  const { data, error } = await supabase
    .from('user_contacts')
    .insert({ ...contact, user_id: userId })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteUserContact(id: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_contacts')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  
  if (error) throw error;
  return true;
}

// ================================================================
// File Uploads (Supabase Storage)
// ================================================================

// React Native compatible file upload types
type UploadableFile = File | Blob | ArrayBuffer | Uint8Array | string; // string for React Native file URIs

export async function uploadFile(
  bucket: string,
  path: string,
  file: UploadableFile,
  options?: { contentType?: string; upsert?: boolean }
): Promise<string> {
  // For React Native file URIs, use fetch with FormData
  if (typeof file === 'string') {
    const filename = file.split('/').pop() || 'file';
    const formData = new FormData();
    formData.append('file', {
      uri: file,
      type: options?.contentType || 'application/octet-stream',
      name: filename,
    } as any);

    // Get session for auth
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');

    // Upload using Supabase REST API
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_PROJECT_URL;
    const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_PUBLIC || '',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Upload failed: ${error}`);
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return urlData.publicUrl;
  }

  // For web (File/Blob)
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: options?.contentType,
      upsert: options?.upsert ?? false,
    });
  
  if (error) throw error;
  
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);
  
  return urlData.publicUrl;
}

export async function uploadAudioRecording(
  userId: string,
  fileUri: string,
  metadata: { filename: string; duration: string }
): Promise<string> {
  const path = `${userId}/recordings/${Date.now()}-${metadata.filename}`;
  return uploadFile('recordings', path, fileUri, { contentType: 'audio/webm' });
}

export async function uploadPhoto(
  userId: string,
  fileUri: string,
  metadata: { filename: string }
): Promise<string> {
  const path = `${userId}/photos/${Date.now()}-${metadata.filename}`;
  return uploadFile('photos', path, fileUri, { contentType: 'image/jpeg' });
}

export async function uploadProfilePicture(
  userId: string,
  fileUri: string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  const extension = contentType.split('/')[1] || 'jpg';
  const path = `${userId}/avatar.${extension}`;

  // Use upsert to replace existing avatar
  return uploadFile('avatars', path, fileUri, {
    contentType,
    upsert: true
  });
}

export async function deleteProfilePicture(userId: string): Promise<boolean> {
  // Try to delete common avatar formats
  const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

  for (const ext of extensions) {
    try {
      const { error } = await supabase.storage
        .from('avatars')
        .remove([`${userId}/avatar.${ext}`]);

      if (!error) return true;
    } catch {
      // Continue trying other extensions
    }
  }

  return true; // Return true even if no file found
}

// ================================================================
// Email Service (via Supabase Edge Functions)
// ================================================================

interface ContractInviteEmailData {
  type: 'contract_invite';
  recipientEmail: string;
  recipientName?: string;
  senderName: string;
  contractId: string;
  inviteUrl: string;
}

interface AmendmentNotificationEmailData {
  type: 'amendment_notification';
  recipientEmail: string;
  recipientName?: string;
  requesterName: string;
  contractId: string;
  amendmentType: string;
  amendmentDescription: string;
}

interface PasswordResetEmailData {
  type: 'password_reset';
  recipientEmail: string;
  resetUrl: string;
}

type EmailData = ContractInviteEmailData | AmendmentNotificationEmailData | PasswordResetEmailData;

/**
 * Send an email via Supabase Edge Function
 */
export async function sendEmail(data: EmailData): Promise<void> {
  const { data: responseData, error } = await supabase.functions.invoke('send-email', {
    body: data,
  });

  if (error) {
    console.error('Failed to send email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  if (!responseData?.success) {
    console.error('Email send returned error:', responseData);
    throw new Error(responseData?.error || 'Failed to send email');
  }
}

/**
 * Send a contract invitation email to a non-PMY user
 */
export async function sendContractInviteEmail(
  recipientEmail: string,
  senderName: string,
  contractId: string,
  inviteUrl: string,
  recipientName?: string
): Promise<void> {
  return sendEmail({
    type: 'contract_invite',
    recipientEmail,
    recipientName,
    senderName,
    contractId,
    inviteUrl,
  });
}

/**
 * Send an amendment notification email
 */
export async function sendAmendmentNotificationEmail(
  recipientEmail: string,
  requesterName: string,
  contractId: string,
  amendmentType: string,
  amendmentDescription: string,
  recipientName?: string
): Promise<void> {
  return sendEmail({
    type: 'amendment_notification',
    recipientEmail,
    recipientName,
    requesterName,
    contractId,
    amendmentType,
    amendmentDescription,
  });
}

// ================================================================
// Identity Verification (Stripe Identity)
// ================================================================

export interface VerificationSession {
  verification_session_id: string;
  verification_session_url: string;
  client_secret: string;
  payment_intent_client_secret: string;
  amount: number;
  verification_id: string;
}

export interface VerificationStatus {
  status: 'none' | 'pending' | 'processing' | 'verified' | 'failed';
  verification?: {
    id: string;
    user_id: string;
    provider: string;
    session_id: string;
    status: string;
    payment_status: string;
    failure_reason?: string;
    created_at: string;
    completed_at?: string;
  };
  stripe_status?: string;
  failure_reason?: string;
}

/**
 * Create a new identity verification session with Stripe
 * Returns payment intent and verification session details
 */
export async function createVerificationSession(): Promise<VerificationSession> {
  // Get current session to verify auth
  const session = await getSession();
  console.log('Creating verification session, auth status:', !!session, session?.user?.id);
  
  if (!session) {
    throw new Error('You must be logged in to verify your identity');
  }

  // Manually call the function with the access token to ensure auth is passed
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_PROJECT_URL;
  const response = await fetch(`${supabaseUrl}/functions/v1/stripe-identity`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action: 'create_session' }),
  });

  const data = await response.json();
  console.log('Verification response:', data, 'status:', response.status);

  if (!response.ok) {
    console.error('Failed to create verification session:', data);
    throw new Error(data.error || 'Failed to create verification session');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

/**
 * Check the current verification status for the user
 */
export async function checkVerificationStatus(): Promise<VerificationStatus> {
  const session = await getSession();
  if (!session) {
    return { status: 'none' };
  }

  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_PROJECT_URL;
    const response = await fetch(`${supabaseUrl}/functions/v1/stripe-identity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action: 'check_status' }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Failed to check verification status:', data);
      return { status: 'none' };
    }

    return data;
  } catch (error) {
    console.error('Failed to check verification status:', error);
    return { status: 'none' };
  }
}

/**
 * Confirm payment was successful after Stripe payment
 */
export async function confirmVerificationPayment(paymentIntentId: string): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke('stripe-identity', {
    body: { action: 'confirm_payment', payment_intent_id: paymentIntentId },
  });

  if (error) {
    console.error('Failed to confirm payment:', error);
    throw new Error(error.message || 'Failed to confirm payment');
  }

  return data?.success || false;
}

/**
 * Get user's verification history
 */
export async function getVerificationHistory(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('account_verifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

