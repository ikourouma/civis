-- ============================================================
-- Migration: 006 — Two-Phase Registration Support
-- Civis Sovereign Intelligence Platform
-- Afronovation, Inc.
-- ============================================================

-- Add basic_registered status to registration_status enum.
-- (Must be committed before use — only added here, used by the service layer.)
ALTER TYPE registration_status ADD VALUE IF NOT EXISTS 'basic_registered' BEFORE 'submitted';

-- Profile photo for the registrant portal
ALTER TABLE public.civis_registrants
  ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Registration phase tracking for analytics
ALTER TABLE public.civis_registrants
  ADD COLUMN IF NOT EXISTS basic_registration_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS full_registration_at TIMESTAMPTZ;

-- ============================================================
-- Indexes for common query patterns
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_registrants_tenant_status
  ON public.civis_registrants(tenant_id, registration_status);

CREATE INDEX IF NOT EXISTS idx_registrants_embassy_status
  ON public.civis_registrants(embassy_id, registration_status);

-- ============================================================
-- Public (pre-auth) read of ISO country reference data.
-- The two-phase registration flow renders the phone-country selector and
-- country pickers before the citizen has a session. ISO country data is
-- non-sensitive, so anonymous SELECT is safe.
-- ============================================================

DROP POLICY IF EXISTS "anon_read_countries" ON public.civis_countries;
CREATE POLICY "anon_read_countries"
  ON public.civis_countries FOR SELECT
  TO anon
  USING (true);

