-- ============================================================
-- Migration: 003 — Embassy, Registry, Household & Consent
-- Civis Sovereign Intelligence Platform
-- Afronovation, Inc.
-- ============================================================

-- ============================================================
-- DOMAIN 3 — EMBASSY & JURISDICTION MANAGEMENT
-- ============================================================

CREATE TYPE mission_type AS ENUM (
  'embassy',
  'consulate',
  'high_commission',
  'permanent_mission',
  'honorary_consulate'
);

CREATE TYPE embassy_status AS ENUM ('active', 'inactive', 'archived');

CREATE TABLE public.civis_embassies (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL REFERENCES public.civis_tenants(id) ON DELETE CASCADE,
  name                    TEXT NOT NULL,
  mission_type            mission_type NOT NULL DEFAULT 'embassy',
  host_country            TEXT NOT NULL,
  host_country_code       TEXT NOT NULL,
  host_city               TEXT NOT NULL,
  address                 TEXT,
  email                   TEXT,
  phone                   TEXT,
  website                 TEXT,
  jurisdiction_description TEXT,
  head_of_mission         TEXT,
  status                  embassy_status NOT NULL DEFAULT 'active',
  timezone                TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.civis_embassies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_embassies"
  ON public.civis_embassies FOR ALL
  USING (public.current_user_role() = 'super_admin');

CREATE POLICY "tenant_roles_read_own_embassies"
  ON public.civis_embassies FOR SELECT
  USING (tenant_id = public.current_user_tenant_id());

CREATE POLICY "tenant_admin_manage_embassies"
  ON public.civis_embassies FOR ALL
  USING (
    tenant_id = public.current_user_tenant_id()
    AND public.current_user_role() = 'tenant_admin'
  );

-- ============================================================
-- civis_embassy_staff — links users to embassies
-- ============================================================

CREATE TABLE public.civis_embassy_staff (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES public.civis_tenants(id) ON DELETE CASCADE,
  embassy_id  UUID NOT NULL REFERENCES public.civis_embassies(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role        platform_role NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES public.profiles(id),
  UNIQUE(embassy_id, user_id)
);

ALTER TABLE public.civis_embassy_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_embassy_staff"
  ON public.civis_embassy_staff FOR ALL
  USING (public.current_user_role() = 'super_admin');

CREATE POLICY "tenant_admin_manage_embassy_staff"
  ON public.civis_embassy_staff FOR ALL
  USING (
    tenant_id = public.current_user_tenant_id()
    AND public.current_user_role() = 'tenant_admin'
  );

CREATE POLICY "embassy_staff_read_own_assignments"
  ON public.civis_embassy_staff FOR SELECT
  USING (user_id = auth.uid());

-- Embassy admin and consular officer: read own embassy only
CREATE POLICY "embassy_staff_read_own_embassy"
  ON public.civis_embassies FOR SELECT
  USING (
    tenant_id = public.current_user_tenant_id()
    AND public.current_user_role() IN ('embassy_admin', 'consular_officer')
    AND id IN (
      SELECT embassy_id FROM public.civis_embassy_staff
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ============================================================
-- civis_embassy_jurisdictions
-- ============================================================

CREATE TABLE public.civis_embassy_jurisdictions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES public.civis_tenants(id) ON DELETE CASCADE,
  embassy_id        UUID NOT NULL REFERENCES public.civis_embassies(id) ON DELETE CASCADE,
  country_code      TEXT NOT NULL,
  country_name      TEXT,
  state_or_region   TEXT,
  city              TEXT,
  postal_code_range TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.civis_embassy_jurisdictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_jurisdictions"
  ON public.civis_embassy_jurisdictions FOR ALL
  USING (public.current_user_role() = 'super_admin');

CREATE POLICY "tenant_roles_read_own_jurisdictions"
  ON public.civis_embassy_jurisdictions FOR SELECT
  USING (tenant_id = public.current_user_tenant_id());

CREATE POLICY "tenant_admin_manage_jurisdictions"
  ON public.civis_embassy_jurisdictions FOR ALL
  USING (
    tenant_id = public.current_user_tenant_id()
    AND public.current_user_role() = 'tenant_admin'
  );

-- ============================================================
-- DOMAIN 4 — DIASPORA REGISTRY
-- ============================================================

CREATE TYPE registration_status AS ENUM (
  'draft',
  'submitted',
  'active',
  'inactive',
  'archived'
);

CREATE TYPE verification_status AS ENUM (
  'unverified',
  'pending_review',
  'verified',
  'rejected'
);

CREATE TABLE public.civis_registrants (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL REFERENCES public.civis_tenants(id) ON DELETE CASCADE,
  embassy_id                UUID REFERENCES public.civis_embassies(id) ON DELETE SET NULL,
  profile_id                UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Identity
  first_name                TEXT NOT NULL,
  last_name                 TEXT NOT NULL,
  middle_name               TEXT,
  preferred_name            TEXT,
  date_of_birth             DATE,
  gender                    TEXT,
  nationality               TEXT NOT NULL,
  dual_nationality          TEXT,
  country_of_birth          TEXT,
  city_of_birth             TEXT,

  -- Contact
  email                     TEXT,
  phone_primary             TEXT,
  phone_secondary           TEXT,
  preferred_language        TEXT NOT NULL DEFAULT 'en',
  preferred_contact_method  TEXT DEFAULT 'email',

  -- Residence
  country_of_residence      TEXT NOT NULL,
  city_of_residence         TEXT NOT NULL,
  years_abroad              INTEGER,
  entry_year                INTEGER,

  -- Professional
  occupation                TEXT,
  employer                  TEXT,
  industry_sector           TEXT,
  education_level           TEXT,
  field_of_study            TEXT,
  highest_qualification     TEXT,

  -- Diaspora profile
  generation                TEXT,
  diaspora_association      TEXT,
  return_interest           BOOLEAN DEFAULT false,
  investment_interest       BOOLEAN DEFAULT false,

  -- Status & verification
  registration_status       registration_status NOT NULL DEFAULT 'draft',
  verification_status       verification_status NOT NULL DEFAULT 'unverified',
  verified_by               UUID REFERENCES public.profiles(id),
  verified_at               TIMESTAMPTZ,
  rejection_reason          TEXT,

  -- Consent
  consent_captured          BOOLEAN NOT NULL DEFAULT false,
  consent_record_id         UUID,
  consent_captured_at       TIMESTAMPTZ,

  -- Profile quality
  profile_completeness_score INTEGER NOT NULL DEFAULT 0
    CHECK (profile_completeness_score BETWEEN 0 AND 100),

  -- Deduplication
  duplicate_of              UUID REFERENCES public.civis_registrants(id),
  is_duplicate              BOOLEAN NOT NULL DEFAULT false,

  -- Admin
  registered_by_staff       BOOLEAN NOT NULL DEFAULT false,
  staff_registrar_id        UUID REFERENCES public.profiles(id),
  notes                     TEXT,

  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.civis_registrants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_registrants"
  ON public.civis_registrants FOR ALL
  USING (public.current_user_role() = 'super_admin');

CREATE POLICY "tenant_admin_all_tenant_registrants"
  ON public.civis_registrants FOR ALL
  USING (
    tenant_id = public.current_user_tenant_id()
    AND public.current_user_role() = 'tenant_admin'
  );

CREATE POLICY "embassy_admin_own_embassy_registrants"
  ON public.civis_registrants FOR ALL
  USING (
    tenant_id = public.current_user_tenant_id()
    AND public.current_user_role() = 'embassy_admin'
    AND embassy_id IN (
      SELECT embassy_id FROM public.civis_embassy_staff
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "consular_officer_embassy_registrants"
  ON public.civis_registrants FOR SELECT
  USING (
    tenant_id = public.current_user_tenant_id()
    AND public.current_user_role() = 'consular_officer'
    AND embassy_id IN (
      SELECT embassy_id FROM public.civis_embassy_staff
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "consular_officer_update_registrants"
  ON public.civis_registrants FOR UPDATE
  USING (
    tenant_id = public.current_user_tenant_id()
    AND public.current_user_role() = 'consular_officer'
    AND embassy_id IN (
      SELECT embassy_id FROM public.civis_embassy_staff
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "registrant_own_record"
  ON public.civis_registrants FOR ALL
  USING (profile_id = auth.uid());

-- ============================================================
-- civis_registrant_addresses
-- ============================================================

CREATE TABLE public.civis_registrant_addresses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.civis_tenants(id) ON DELETE CASCADE,
  registrant_id   UUID NOT NULL REFERENCES public.civis_registrants(id) ON DELETE CASCADE,
  address_type    TEXT NOT NULL DEFAULT 'current',
  street_line_1   TEXT,
  street_line_2   TEXT,
  city            TEXT NOT NULL,
  state_or_region TEXT,
  postal_code     TEXT,
  country_code    TEXT NOT NULL,
  country_name    TEXT,
  is_primary      BOOLEAN NOT NULL DEFAULT true,
  valid_from      DATE,
  valid_to        DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.civis_registrant_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_admin_all_addresses"
  ON public.civis_registrant_addresses FOR ALL
  USING (
    tenant_id = public.current_user_tenant_id()
    AND public.current_user_role() IN ('tenant_admin', 'super_admin')
  );

CREATE POLICY "embassy_staff_registrant_addresses"
  ON public.civis_registrant_addresses FOR ALL
  USING (
    tenant_id = public.current_user_tenant_id()
    AND public.current_user_role() IN ('embassy_admin', 'consular_officer')
    AND registrant_id IN (
      SELECT id FROM public.civis_registrants
      WHERE embassy_id IN (
        SELECT embassy_id FROM public.civis_embassy_staff
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

CREATE POLICY "registrant_own_addresses"
  ON public.civis_registrant_addresses FOR ALL
  USING (
    registrant_id IN (
      SELECT id FROM public.civis_registrants WHERE profile_id = auth.uid()
    )
  );

-- ============================================================
-- civis_registrant_documents
-- ============================================================

CREATE TYPE document_type AS ENUM (
  'passport',
  'national_id',
  'birth_certificate',
  'proof_of_residence',
  'visa',
  'other'
);

CREATE TYPE document_status AS ENUM (
  'uploaded',
  'under_review',
  'verified',
  'rejected',
  'expired'
);

CREATE TABLE public.civis_registrant_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.civis_tenants(id) ON DELETE CASCADE,
  registrant_id   UUID NOT NULL REFERENCES public.civis_registrants(id) ON DELETE CASCADE,
  document_type   document_type NOT NULL,
  document_number TEXT,
  issuing_country TEXT,
  issue_date      DATE,
  expiry_date     DATE,
  storage_path    TEXT NOT NULL,
  file_name       TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type       TEXT,
  status          document_status NOT NULL DEFAULT 'uploaded',
  reviewed_by     UUID REFERENCES public.profiles(id),
  reviewed_at     TIMESTAMPTZ,
  rejection_notes TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.civis_registrant_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_admin_all_documents"
  ON public.civis_registrant_documents FOR ALL
  USING (
    tenant_id = public.current_user_tenant_id()
    AND public.current_user_role() IN ('tenant_admin', 'super_admin')
  );

CREATE POLICY "embassy_staff_documents"
  ON public.civis_registrant_documents FOR ALL
  USING (
    tenant_id = public.current_user_tenant_id()
    AND public.current_user_role() IN ('embassy_admin', 'consular_officer')
    AND registrant_id IN (
      SELECT id FROM public.civis_registrants
      WHERE embassy_id IN (
        SELECT embassy_id FROM public.civis_embassy_staff
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

CREATE POLICY "registrant_own_documents"
  ON public.civis_registrant_documents FOR ALL
  USING (
    registrant_id IN (
      SELECT id FROM public.civis_registrants WHERE profile_id = auth.uid()
    )
  );

-- ============================================================
-- DOMAIN 5 — HOUSEHOLD INTELLIGENCE
-- ============================================================

CREATE TABLE public.civis_households (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES public.civis_tenants(id) ON DELETE CASCADE,
  primary_registrant_id UUID NOT NULL REFERENCES public.civis_registrants(id) ON DELETE CASCADE,
  household_name        TEXT,
  country_of_residence  TEXT NOT NULL,
  city_of_residence     TEXT NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.civis_households ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_admin_all_households"
  ON public.civis_households FOR ALL
  USING (
    tenant_id = public.current_user_tenant_id()
    AND public.current_user_role() IN ('tenant_admin', 'super_admin')
  );

CREATE POLICY "embassy_staff_households"
  ON public.civis_households FOR SELECT
  USING (
    tenant_id = public.current_user_tenant_id()
    AND public.current_user_role() IN ('embassy_admin', 'consular_officer')
  );

CREATE TYPE household_relationship AS ENUM (
  'spouse', 'child', 'parent', 'sibling', 'guardian', 'other'
);

CREATE TABLE public.civis_household_members (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL REFERENCES public.civis_tenants(id) ON DELETE CASCADE,
  household_id            UUID NOT NULL REFERENCES public.civis_households(id) ON DELETE CASCADE,
  registrant_id           UUID NOT NULL REFERENCES public.civis_registrants(id) ON DELETE CASCADE,
  relationship_to_primary household_relationship NOT NULL,
  is_dependent            BOOLEAN NOT NULL DEFAULT false,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.civis_household_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_admin_all_household_members"
  ON public.civis_household_members FOR ALL
  USING (
    tenant_id = public.current_user_tenant_id()
    AND public.current_user_role() IN ('tenant_admin', 'super_admin')
  );

-- ============================================================
-- DOMAIN 10 (PARTIAL) — CONSENT RECORDS
-- ============================================================

CREATE TYPE consent_type AS ENUM (
  'registration',
  'economic_profile',
  'survey',
  'campaign',
  'marketing'
);

CREATE TABLE public.civis_consent_records (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES public.civis_tenants(id) ON DELETE CASCADE,
  registrant_id         UUID REFERENCES public.civis_registrants(id) ON DELETE SET NULL,
  consent_type          consent_type NOT NULL DEFAULT 'registration',
  consent_version       TEXT NOT NULL,
  consent_language      TEXT NOT NULL DEFAULT 'en',
  consent_text_snapshot TEXT NOT NULL,
  consented             BOOLEAN NOT NULL,
  ip_address            TEXT,
  user_agent            TEXT,
  captured_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at            TIMESTAMPTZ,
  withdrawn_at          TIMESTAMPTZ,
  withdrawal_reason     TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.civis_consent_records ENABLE ROW LEVEL SECURITY;

-- Consent records are immutable — no UPDATE or DELETE permitted for any role.
CREATE POLICY "super_admin_all_consent"
  ON public.civis_consent_records FOR SELECT
  USING (public.current_user_role() = 'super_admin');

CREATE POLICY "tenant_admin_read_tenant_consent"
  ON public.civis_consent_records FOR SELECT
  USING (
    tenant_id = public.current_user_tenant_id()
    AND public.current_user_role() = 'tenant_admin'
  );

CREATE POLICY "registrant_own_consent"
  ON public.civis_consent_records FOR SELECT
  USING (
    registrant_id IN (
      SELECT id FROM public.civis_registrants WHERE profile_id = auth.uid()
    )
  );

-- ============================================================
-- Profile completeness scoring function
-- ============================================================

CREATE OR REPLACE FUNCTION public.calculate_completeness(
  p_first_name TEXT, p_last_name TEXT, p_date_of_birth DATE,
  p_gender TEXT, p_nationality TEXT, p_email TEXT,
  p_phone_primary TEXT, p_country_of_residence TEXT,
  p_city_of_residence TEXT, p_occupation TEXT,
  p_education_level TEXT, p_consent_captured BOOLEAN
) RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
BEGIN
  IF p_first_name IS NOT NULL THEN score := score + 10; END IF;
  IF p_last_name IS NOT NULL THEN score := score + 10; END IF;
  IF p_date_of_birth IS NOT NULL THEN score := score + 10; END IF;
  IF p_gender IS NOT NULL THEN score := score + 5; END IF;
  IF p_nationality IS NOT NULL THEN score := score + 10; END IF;
  IF p_email IS NOT NULL THEN score := score + 10; END IF;
  IF p_phone_primary IS NOT NULL THEN score := score + 5; END IF;
  IF p_country_of_residence IS NOT NULL THEN score := score + 10; END IF;
  IF p_city_of_residence IS NOT NULL THEN score := score + 5; END IF;
  IF p_occupation IS NOT NULL THEN score := score + 10; END IF;
  IF p_education_level IS NOT NULL THEN score := score + 10; END IF;
  IF p_consent_captured = true THEN score := score + 5; END IF;
  RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- Triggers
-- ============================================================

CREATE TRIGGER civis_embassies_updated_at
  BEFORE UPDATE ON public.civis_embassies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER civis_registrants_updated_at
  BEFORE UPDATE ON public.civis_registrants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER civis_households_updated_at
  BEFORE UPDATE ON public.civis_households
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
