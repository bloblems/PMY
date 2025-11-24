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
// Universities
// ================================================================

export async function getAllUniversities(): Promise<University[]> {
  const { data, error } = await supabase
    .from('universities')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data || [];
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
  return data;
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
  return data || [];
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
  return data;
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

