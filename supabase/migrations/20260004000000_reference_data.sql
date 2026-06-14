-- ============================================================
-- Migration: 004 — Reference Data Foundation
-- Civis Sovereign Intelligence Platform
-- Afronovation, Inc.
-- ============================================================

-- ============================================================
-- civis_countries — ISO 3166-1 master list
-- ============================================================

CREATE TABLE public.civis_countries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iso_code_alpha2     TEXT NOT NULL UNIQUE,    -- 'US', 'NG', 'LR'
  iso_code_alpha3     TEXT NOT NULL UNIQUE,    -- 'USA', 'NGA', 'LBR'
  iso_numeric         TEXT NOT NULL,           -- '840', '566', '430'
  country_name_en     TEXT NOT NULL,
  country_name_fr     TEXT NOT NULL,
  official_name_en    TEXT,
  flag_emoji          TEXT NOT NULL,           -- '🇺🇸'
  phone_country_code  TEXT NOT NULL,           -- '+1', '+234', '+231'
  continent           TEXT,
  region              TEXT,
  capital_city        TEXT,
  currency_code       TEXT,                    -- 'USD', 'NGN', 'LRD'
  currency_name       TEXT,
  is_au_member        BOOLEAN NOT NULL DEFAULT false,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Countries are reference data — readable by all authenticated users
ALTER TABLE public.civis_countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_countries"
  ON public.civis_countries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "super_admin_manage_countries"
  ON public.civis_countries FOR ALL
  USING (public.current_user_role() = 'super_admin');

CREATE INDEX idx_countries_alpha2 ON public.civis_countries(iso_code_alpha2);
CREATE INDEX idx_countries_name_en ON public.civis_countries(country_name_en);

-- ============================================================
-- Shared enum for suggestion review state
-- ============================================================

CREATE TYPE suggestion_status AS ENUM ('approved', 'pending_review', 'rejected', 'merged');

-- ============================================================
-- civis_occupations — canonical occupation list
-- ============================================================

CREATE TABLE public.civis_occupations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en             TEXT NOT NULL UNIQUE,
  name_fr             TEXT,
  category            TEXT,           -- 'Technology', 'Healthcare', etc.
  is_canonical        BOOLEAN NOT NULL DEFAULT true,
  usage_count         INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.civis_occupations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_occupations"
  ON public.civis_occupations FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "super_admin_manage_occupations"
  ON public.civis_occupations FOR ALL
  USING (public.current_user_role() = 'super_admin');

CREATE INDEX idx_occupations_name_en ON public.civis_occupations(name_en);
CREATE INDEX idx_occupations_category ON public.civis_occupations(category);

-- ============================================================
-- civis_industries — canonical industry sectors
-- ============================================================

CREATE TABLE public.civis_industries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en             TEXT NOT NULL UNIQUE,
  name_fr             TEXT,
  naics_code          TEXT,
  parent_id           UUID REFERENCES public.civis_industries(id),
  is_canonical        BOOLEAN NOT NULL DEFAULT true,
  usage_count         INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.civis_industries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_industries"
  ON public.civis_industries FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "super_admin_manage_industries"
  ON public.civis_industries FOR ALL
  USING (public.current_user_role() = 'super_admin');

CREATE INDEX idx_industries_name_en ON public.civis_industries(name_en);

-- ============================================================
-- civis_education_levels — FIXED canonical list (no user additions)
-- ============================================================

CREATE TABLE public.civis_education_levels (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en     TEXT NOT NULL UNIQUE,
  name_fr     TEXT NOT NULL,
  level_order INTEGER NOT NULL,    -- 1 = primary, 9 = doctorate
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.civis_education_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_education"
  ON public.civis_education_levels FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "super_admin_manage_education"
  ON public.civis_education_levels FOR ALL
  USING (public.current_user_role() = 'super_admin');

-- ============================================================
-- civis_fields_of_study — canonical, expandable
-- ============================================================

CREATE TABLE public.civis_fields_of_study (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en             TEXT NOT NULL UNIQUE,
  name_fr             TEXT,
  category            TEXT,
  is_canonical        BOOLEAN NOT NULL DEFAULT true,
  usage_count         INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.civis_fields_of_study ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_fields"
  ON public.civis_fields_of_study FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "super_admin_manage_fields"
  ON public.civis_fields_of_study FOR ALL
  USING (public.current_user_role() = 'super_admin');

CREATE INDEX idx_fields_name_en ON public.civis_fields_of_study(name_en);

-- ============================================================
-- civis_diaspora_associations — tenant-scoped canonical
-- ============================================================

CREATE TABLE public.civis_diaspora_associations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID REFERENCES public.civis_tenants(id) ON DELETE CASCADE,
  -- NULL means global canonical (managed by super admin)
  name_en             TEXT NOT NULL,
  name_fr             TEXT,
  country_code        TEXT,    -- Host country (where association operates)
  website             TEXT,
  is_canonical        BOOLEAN NOT NULL DEFAULT true,
  usage_count         INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name_en)
);

ALTER TABLE public.civis_diaspora_associations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_associations"
  ON public.civis_diaspora_associations FOR SELECT
  TO authenticated USING (
    tenant_id IS NULL
    OR tenant_id = public.current_user_tenant_id()
    OR public.current_user_role() = 'super_admin'
  );

CREATE POLICY "super_admin_manage_global_associations"
  ON public.civis_diaspora_associations FOR ALL
  USING (
    public.current_user_role() = 'super_admin'
  );

CREATE POLICY "tenant_admin_manage_tenant_associations"
  ON public.civis_diaspora_associations FOR ALL
  USING (
    tenant_id = public.current_user_tenant_id()
    AND public.current_user_role() = 'tenant_admin'
  );

-- ============================================================
-- civis_registry_suggestions — pending review queue
-- For user-submitted additions across all reference tables
-- ============================================================

CREATE TYPE suggestion_category AS ENUM (
  'occupation',
  'industry',
  'field_of_study',
  'diaspora_association',
  'employer'
);

CREATE TABLE public.civis_registry_suggestions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID REFERENCES public.civis_tenants(id) ON DELETE CASCADE,
  -- Suggested by which user
  suggested_by        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  suggested_by_email  TEXT,
  -- What kind of suggestion
  category            suggestion_category NOT NULL,
  suggested_value     TEXT NOT NULL,
  language            TEXT NOT NULL DEFAULT 'en',
  context             TEXT,    -- Where the suggestion was submitted from
  -- Review state
  status              suggestion_status NOT NULL DEFAULT 'pending_review',
  reviewed_by         UUID REFERENCES public.profiles(id),
  reviewed_at         TIMESTAMPTZ,
  reviewer_notes      TEXT,
  -- If merged into canonical, link to canonical record
  merged_into_table   TEXT,
  merged_into_id      UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.civis_registry_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_suggestions"
  ON public.civis_registry_suggestions FOR ALL
  USING (public.current_user_role() = 'super_admin');

CREATE POLICY "tenant_admin_read_tenant_suggestions"
  ON public.civis_registry_suggestions FOR SELECT
  USING (
    tenant_id = public.current_user_tenant_id()
    AND public.current_user_role() = 'tenant_admin'
  );

CREATE POLICY "users_insert_suggestions"
  ON public.civis_registry_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (suggested_by = auth.uid());

CREATE INDEX idx_suggestions_status ON public.civis_registry_suggestions(status);
CREATE INDEX idx_suggestions_category ON public.civis_registry_suggestions(category);

-- ============================================================
-- Seed: Education Levels (fixed canonical)
-- ============================================================

INSERT INTO public.civis_education_levels (name_en, name_fr, level_order) VALUES
  ('No formal education', 'Aucune éducation formelle', 1),
  ('Primary school', 'École primaire', 2),
  ('Secondary school / High school', 'École secondaire / Lycée', 3),
  ('Technical / Vocational training', 'Formation technique / Professionnelle', 4),
  ('Some college / University (no degree)', 'Quelques années d''université (sans diplôme)', 5),
  ('Associate degree / Diploma', 'Diplôme universitaire de premier cycle', 6),
  ('Bachelor''s degree', 'Licence', 7),
  ('Master''s degree', 'Master', 8),
  ('Doctorate / PhD', 'Doctorat / PhD', 9);
