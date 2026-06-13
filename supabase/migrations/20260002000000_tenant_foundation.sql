-- ============================================================
-- Migration: 002 — Tenant Foundation
-- Civis Sovereign Intelligence Platform
-- Afronovation, Inc.
-- ============================================================

-- Deployment tier enum
CREATE TYPE deployment_tier AS ENUM ('cloud', 'government', 'sovereign');

-- Tenant status enum
CREATE TYPE tenant_status AS ENUM ('active', 'pilot', 'suspended', 'archived');

-- ============================================================
-- civis_tenants — core sovereign government tenant table
-- ============================================================

CREATE TABLE public.civis_tenants (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT NOT NULL,
  country_code            TEXT NOT NULL UNIQUE,
  official_country_name   TEXT,
  region                  TEXT,
  deployment_tier         deployment_tier NOT NULL DEFAULT 'cloud',
  status                  tenant_status NOT NULL DEFAULT 'pilot',
  default_language        TEXT NOT NULL DEFAULT 'en',
  supported_languages     TEXT[] NOT NULL DEFAULT ARRAY['en'],
  currency_code           TEXT,
  timezone                TEXT,
  data_residency_region   TEXT NOT NULL,
  data_residency_notes    TEXT,
  logo_url                TEXT,
  primary_contact_email   TEXT,
  contract_start_date     DATE,
  contract_end_date       DATE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.civis_tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_read_tenants"
  ON public.civis_tenants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

CREATE POLICY "tenant_users_read_own_tenant"
  ON public.civis_tenants FOR SELECT
  USING (
    id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "super_admin_insert_tenants"
  ON public.civis_tenants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

CREATE POLICY "super_admin_update_tenants"
  ON public.civis_tenants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

-- ============================================================
-- civis_tenant_settings — configurable policy per tenant
-- ============================================================

CREATE TABLE public.civis_tenant_settings (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID NOT NULL REFERENCES public.civis_tenants(id) ON DELETE CASCADE,
  mfa_required_roles          TEXT[] NOT NULL DEFAULT ARRAY['tenant_admin', 'embassy_admin'],
  password_max_age_days       INTEGER NOT NULL DEFAULT 180,
  session_timeout_minutes     INTEGER NOT NULL DEFAULT 480,
  max_login_attempts          INTEGER NOT NULL DEFAULT 10,
  data_retention_days         INTEGER NOT NULL DEFAULT 2555,
  allow_data_export           BOOLEAN NOT NULL DEFAULT true,
  require_consent_on_register BOOLEAN NOT NULL DEFAULT true,
  enable_dia_ai               BOOLEAN NOT NULL DEFAULT false,
  enable_economic_intelligence BOOLEAN NOT NULL DEFAULT false,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id)
);

ALTER TABLE public.civis_tenant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_tenant_settings"
  ON public.civis_tenant_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

CREATE POLICY "tenant_admin_read_own_settings"
  ON public.civis_tenant_settings FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'tenant_admin'
    )
  );

CREATE POLICY "tenant_admin_update_own_settings"
  ON public.civis_tenant_settings FOR UPDATE
  USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'tenant_admin'
    )
  );

-- ============================================================
-- Update profiles table — add tenant foreign key constraint
-- ============================================================

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_tenant_id_fkey
  FOREIGN KEY (tenant_id)
  REFERENCES public.civis_tenants(id) ON DELETE SET NULL;

-- ============================================================
-- Helper functions for RLS policies and service layer
-- ============================================================

CREATE OR REPLACE FUNCTION public.current_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS platform_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.user_has_role(required_role platform_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = required_role
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- Seed — Afronovation platform tenant
-- ============================================================

INSERT INTO public.civis_tenants (
  name, country_code, official_country_name, region,
  deployment_tier, status, default_language, supported_languages,
  data_residency_region
) VALUES (
  'Afronovation Platform',
  'AF',
  'Afronovation, Inc.',
  'Platform',
  'sovereign',
  'active',
  'en',
  ARRAY['en', 'fr'],
  'us-east-1'
);

-- Seed default tenant settings for Afronovation
INSERT INTO public.civis_tenant_settings (tenant_id, enable_dia_ai, enable_economic_intelligence)
SELECT id, true, true FROM public.civis_tenants WHERE country_code = 'AF';

-- Assign super admins to platform tenant
UPDATE public.profiles
SET tenant_id = (SELECT id FROM public.civis_tenants WHERE country_code = 'AF')
WHERE role = 'super_admin';

-- ============================================================
-- Triggers
-- ============================================================

CREATE TRIGGER civis_tenants_updated_at
  BEFORE UPDATE ON public.civis_tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER civis_tenant_settings_updated_at
  BEFORE UPDATE ON public.civis_tenant_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
