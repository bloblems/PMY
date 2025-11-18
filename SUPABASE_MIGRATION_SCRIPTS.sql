-- ================================================================
-- SUPABASE MIGRATION SQL SCRIPTS
-- Run these in your Supabase SQL Editor
-- ================================================================

-- ----------------------------------------------------------------
-- 1. CREATE USER_PROFILES TABLE
-- ----------------------------------------------------------------
-- This stores app-specific user data linked to auth.users
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  saved_signature text,
  saved_signature_type text,
  saved_signature_text text,
  data_retention_policy text DEFAULT 'forever' CHECK (data_retention_policy IN ('30days', '90days', '1year', 'forever')),
  stripe_customer_id text,
  referral_code text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add index for referral_code lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_referral_code ON public.user_profiles(referral_code);

-- Add index for stripe_customer_id lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer_id ON public.user_profiles(stripe_customer_id);

-- Add trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------
-- 2. ADD MISSING DURATION FIELDS TO CONSENT_CONTRACTS
-- ----------------------------------------------------------------
-- Add contract duration fields if they don't exist
ALTER TABLE public.consent_contracts
  ADD COLUMN IF NOT EXISTS contract_start_time timestamptz,
  ADD COLUMN IF NOT EXISTS contract_duration integer,
  ADD COLUMN IF NOT EXISTS contract_end_time timestamptz;

-- Add comment to document the duration field
COMMENT ON COLUMN public.consent_contracts.contract_duration IS 'Duration in minutes for the consent contract';

-- ----------------------------------------------------------------
-- 3. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ----------------------------------------------------------------
-- Enable RLS on all public tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_reports ENABLE ROW LEVEL SECURITY;

-- Universities table is public (read-only for all users)
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- 4. CREATE RLS POLICIES FOR USER_PROFILES
-- ----------------------------------------------------------------
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile (created on signup)
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile"
  ON public.user_profiles
  FOR DELETE
  USING (auth.uid() = id);

-- ----------------------------------------------------------------
-- 5. CREATE RLS POLICIES FOR CONSENT_CONTRACTS
-- ----------------------------------------------------------------
-- Users can view their own consent contracts
CREATE POLICY "Users can view own consent contracts"
  ON public.consent_contracts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own consent contracts
CREATE POLICY "Users can insert own consent contracts"
  ON public.consent_contracts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own consent contracts
CREATE POLICY "Users can delete own consent contracts"
  ON public.consent_contracts
  FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- 6. CREATE RLS POLICIES FOR CONSENT_RECORDINGS
-- ----------------------------------------------------------------
-- Users can view their own consent recordings
CREATE POLICY "Users can view own consent recordings"
  ON public.consent_recordings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own consent recordings
CREATE POLICY "Users can insert own consent recordings"
  ON public.consent_recordings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own consent recordings
CREATE POLICY "Users can delete own consent recordings"
  ON public.consent_recordings
  FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- 7. CREATE RLS POLICIES FOR VERIFICATION_PAYMENTS
-- ----------------------------------------------------------------
-- Users can view their own verification payments
CREATE POLICY "Users can view own verification payments"
  ON public.verification_payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own verification payments
CREATE POLICY "Users can insert own verification payments"
  ON public.verification_payments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- 8. CREATE RLS POLICIES FOR UNIVERSITY_REPORTS
-- ----------------------------------------------------------------
-- All authenticated users can view university reports
CREATE POLICY "Authenticated users can view university reports"
  ON public.university_reports
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- All authenticated users can insert university reports
CREATE POLICY "Authenticated users can insert university reports"
  ON public.university_reports
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ----------------------------------------------------------------
-- 9. CREATE RLS POLICIES FOR UNIVERSITIES
-- ----------------------------------------------------------------
-- All authenticated users can view universities
CREATE POLICY "Authenticated users can view universities"
  ON public.universities
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ----------------------------------------------------------------
-- 10. CREATE STORAGE BUCKET FOR CONSENT FILES
-- ----------------------------------------------------------------
-- Create a private bucket for consent files (audio, photos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('consent-files', 'consent-files', false)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------
-- 11. CREATE STORAGE POLICIES FOR CONSENT-FILES BUCKET
-- ----------------------------------------------------------------
-- Users can upload files to their own folder
CREATE POLICY "Users can upload to own folder"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'consent-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can view files in their own folder
CREATE POLICY "Users can view own files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'consent-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete files in their own folder
CREATE POLICY "Users can delete own files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'consent-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ----------------------------------------------------------------
-- 12. CREATE FUNCTION TO AUTO-CREATE USER PROFILE ON SIGNUP
-- ----------------------------------------------------------------
-- This function automatically creates a user_profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, created_at, updated_at)
  VALUES (NEW.id, now(), now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function on new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- MIGRATION COMPLETE!
-- ================================================================
-- Next steps:
-- 1. Verify all tables were created successfully
-- 2. Check that RLS policies are enabled
-- 3. Verify storage bucket 'consent-files' exists
-- 4. Test that new user signup creates a user_profile automatically
-- ================================================================
