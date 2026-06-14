-- ============================================================
-- Migration: 005 — Country Branding System
-- Civis Sovereign Intelligence Platform
-- Afronovation, Inc.
-- ============================================================

-- ============================================================
-- civis_country_branding — per-country brand definition
-- One row per country code, regardless of how many tenants use it
-- ============================================================

CREATE TABLE public.civis_country_branding (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code            TEXT NOT NULL UNIQUE,  -- ISO 3166-1 alpha-2 (AF = platform)
  display_name_en         TEXT NOT NULL,
  display_name_fr         TEXT NOT NULL,
  official_name_en        TEXT,
  official_name_fr        TEXT,
  motto_en                TEXT,
  motto_fr                TEXT,

  -- Core brand palette (derived from national flag)
  brand_primary           TEXT NOT NULL,         -- '#BF0A30' (Liberia red)
  brand_secondary         TEXT NOT NULL,         -- '#002868' (Liberia blue)
  brand_accent            TEXT,                  -- Optional third color
  brand_neutral_dark      TEXT NOT NULL DEFAULT '#0D1B2E',
  brand_neutral_light     TEXT NOT NULL DEFAULT '#EAF2FA',

  -- Computed surface variants (lightened/darkened palette variants)
  surface_primary_50      TEXT,
  surface_primary_100     TEXT,
  surface_primary_500     TEXT,
  surface_primary_700     TEXT,
  surface_primary_900     TEXT,

  -- Typography
  font_display            TEXT NOT NULL DEFAULT 'Inter',
  font_body               TEXT NOT NULL DEFAULT 'Inter',

  -- Assets (Supabase Storage paths)
  flag_asset_path         TEXT,
  seal_asset_path         TEXT,                  -- Coat of arms / National seal
  lockup_asset_path       TEXT,                  -- Civis + Country combined lockup

  -- Localization defaults
  default_language        TEXT NOT NULL DEFAULT 'en',
  supported_languages     TEXT[] NOT NULL DEFAULT ARRAY['en'],
  currency_code           TEXT,
  date_format             TEXT DEFAULT 'YYYY-MM-DD',
  time_zone               TEXT,

  -- Source lineage
  brand_source            TEXT,                  -- 'bridge55' | 'liberia_asset' | 'manual'
  brand_version           TEXT DEFAULT '1.0',

  is_active               BOOLEAN NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.civis_country_branding ENABLE ROW LEVEL SECURITY;

-- All authenticated users read brand data (needed for runtime theming)
CREATE POLICY "authenticated_read_branding"
  ON public.civis_country_branding FOR SELECT
  TO authenticated USING (true);

-- Super admin manages all branding
CREATE POLICY "super_admin_manage_branding"
  ON public.civis_country_branding FOR ALL
  USING (public.current_user_role() = 'super_admin');

-- Tenant admin can read all (for preview) but not modify
-- (modifications go through "Customization Request" workflow in Mission 005-B)

CREATE INDEX idx_branding_country ON public.civis_country_branding(country_code);

-- ============================================================
-- Add branding reference to civis_tenants
-- ============================================================

ALTER TABLE public.civis_tenants
  ADD COLUMN IF NOT EXISTS branding_id UUID REFERENCES public.civis_country_branding(id);

-- Link existing Afronovation platform tenant to a platform brand entry
-- (created in seed below)

-- ============================================================
-- Trigger
-- ============================================================

CREATE TRIGGER civis_country_branding_updated_at
  BEFORE UPDATE ON public.civis_country_branding
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
