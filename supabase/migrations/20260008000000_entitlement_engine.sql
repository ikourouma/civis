-- ============================================================
-- Migration: 008 — Platform Entitlement Engine
-- Civis Sovereign Intelligence Platform
-- Afronovation, Inc.
-- ============================================================

-- ============================================================
-- civis_tenant_entitlements — per-tenant capability toggles
-- One row per (tenant_id, role, capability_code) override.
-- ============================================================

CREATE TABLE public.civis_tenant_entitlements (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES public.civis_tenants(id) ON DELETE CASCADE,
  role                platform_role NOT NULL,
  capability_code     TEXT NOT NULL,
  is_enabled          BOOLEAN NOT NULL,
  configured_by       UUID REFERENCES public.profiles(id),
  configured_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, role, capability_code)
);

ALTER TABLE public.civis_tenant_entitlements ENABLE ROW LEVEL SECURITY;

-- Super admin: full access to all entitlements
CREATE POLICY "super_admin_all_entitlements"
  ON public.civis_tenant_entitlements FOR ALL
  USING (public.current_user_role() = 'super_admin');

-- All authenticated users: read own tenant entitlements (needed for UI enforcement)
CREATE POLICY "users_read_own_tenant_entitlements"
  ON public.civis_tenant_entitlements FOR SELECT
  USING (tenant_id = public.current_user_tenant_id());

CREATE INDEX idx_entitlements_tenant_role
  ON public.civis_tenant_entitlements(tenant_id, role);

CREATE INDEX idx_entitlements_tenant_capability
  ON public.civis_tenant_entitlements(tenant_id, capability_code);

CREATE TRIGGER civis_entitlements_updated_at
  BEFORE UPDATE ON public.civis_tenant_entitlements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Helper — check a capability override for the current user.
-- Returns TRUE/FALSE for an explicit override, NULL when none exists
-- (the application layer then applies the TypeScript catalog default).
-- super_admin always TRUE.
-- ============================================================

CREATE OR REPLACE FUNCTION public.user_has_capability(p_capability_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_role platform_role;
  v_tenant_id UUID;
  v_override BOOLEAN;
BEGIN
  SELECT role, tenant_id INTO v_role, v_tenant_id
  FROM public.profiles WHERE id = auth.uid();

  IF v_role = 'super_admin' THEN
    RETURN true;
  END IF;

  IF v_tenant_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT is_enabled INTO v_override
  FROM public.civis_tenant_entitlements
  WHERE tenant_id = v_tenant_id
    AND role = v_role
    AND capability_code = p_capability_code;

  -- Override (TRUE/FALSE) if present, else NULL → "use catalog default".
  RETURN v_override;
END;
$$;
