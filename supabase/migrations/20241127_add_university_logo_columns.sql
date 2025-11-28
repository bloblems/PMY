-- Migration: Add domain and logo_url columns to universities table
-- This allows storing university website domains for Clearbit logo lookups
-- and custom logo URLs

ALTER TABLE public.universities
ADD COLUMN IF NOT EXISTS domain TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.universities.domain IS 'University website domain (e.g., stanford.edu) for Clearbit logo API lookup';
COMMENT ON COLUMN public.universities.logo_url IS 'Custom logo URL if available, takes precedence over Clearbit lookup';

-- Create index on domain for faster lookups
CREATE INDEX IF NOT EXISTS idx_universities_domain ON public.universities(domain);

-- Update some well-known universities with their domains
UPDATE public.universities SET domain = 'stanford.edu' WHERE name ILIKE '%stanford%' AND domain IS NULL;
UPDATE public.universities SET domain = 'harvard.edu' WHERE name ILIKE '%harvard%' AND domain IS NULL;
UPDATE public.universities SET domain = 'mit.edu' WHERE name ILIKE '%mit%' OR name ILIKE '%massachusetts institute%' AND domain IS NULL;
UPDATE public.universities SET domain = 'yale.edu' WHERE name ILIKE '%yale%' AND domain IS NULL;
UPDATE public.universities SET domain = 'princeton.edu' WHERE name ILIKE '%princeton%' AND domain IS NULL;
UPDATE public.universities SET domain = 'columbia.edu' WHERE name ILIKE '%columbia%' AND domain IS NULL;
UPDATE public.universities SET domain = 'upenn.edu' WHERE name ILIKE '%university of pennsylvania%' OR name ILIKE '%upenn%' AND domain IS NULL;
UPDATE public.universities SET domain = 'cornell.edu' WHERE name ILIKE '%cornell%' AND domain IS NULL;
UPDATE public.universities SET domain = 'berkeley.edu' WHERE name ILIKE '%uc berkeley%' OR name ILIKE '%berkeley%' AND domain IS NULL;
UPDATE public.universities SET domain = 'ucla.edu' WHERE name ILIKE '%ucla%' AND domain IS NULL;
UPDATE public.universities SET domain = 'usc.edu' WHERE name ILIKE '%usc%' OR name ILIKE '%southern california%' AND domain IS NULL;
UPDATE public.universities SET domain = 'nyu.edu' WHERE name ILIKE '%nyu%' OR name ILIKE '%new york university%' AND domain IS NULL;
UPDATE public.universities SET domain = 'duke.edu' WHERE name ILIKE '%duke%' AND domain IS NULL;
UPDATE public.universities SET domain = 'northwestern.edu' WHERE name ILIKE '%northwestern%' AND domain IS NULL;
UPDATE public.universities SET domain = 'uchicago.edu' WHERE name ILIKE '%chicago%' AND domain IS NULL;
UPDATE public.universities SET domain = 'umich.edu' WHERE name ILIKE '%michigan%' AND domain IS NULL;
UPDATE public.universities SET domain = 'utexas.edu' WHERE name ILIKE '%texas%austin%' AND domain IS NULL;
UPDATE public.universities SET domain = 'gatech.edu' WHERE name ILIKE '%georgia tech%' AND domain IS NULL;
UPDATE public.universities SET domain = 'unc.edu' WHERE name ILIKE '%north carolina%chapel%' AND domain IS NULL;
UPDATE public.universities SET domain = 'virginia.edu' WHERE name ILIKE '%virginia%' AND name NOT ILIKE '%west virginia%' AND domain IS NULL;
