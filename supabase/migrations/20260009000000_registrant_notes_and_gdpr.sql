-- ============================================================
-- Migration: 009 — Registrant Notes, GDPR Requests & Tenant Settings
-- Mission 006-B — Complete Persona Dashboards
-- ============================================================

-- ============================================================
-- Registrant internal notes
-- ============================================================

CREATE TABLE public.civis_registrant_notes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.civis_tenants(id) ON DELETE CASCADE,
  registrant_id   UUID NOT NULL REFERENCES public.civis_registrants(id) ON DELETE CASCADE,
  author_id       UUID NOT NULL REFERENCES public.profiles(id),
  author_name     TEXT NOT NULL,
  author_role     platform_role NOT NULL,
  note_text       TEXT NOT NULL,
  is_internal     BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.civis_registrant_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_notes"
  ON public.civis_registrant_notes FOR ALL
  USING (public.current_user_role() = 'super_admin');

CREATE POLICY "tenant_staff_read_own_tenant_notes"
  ON public.civis_registrant_notes FOR SELECT
  USING (tenant_id = public.current_user_tenant_id());

CREATE POLICY "staff_insert_notes"
  ON public.civis_registrant_notes FOR INSERT
  WITH CHECK (
    tenant_id = public.current_user_tenant_id()
    AND author_id = auth.uid()
  );

CREATE INDEX idx_notes_registrant ON public.civis_registrant_notes(registrant_id);

-- ============================================================
-- GDPR Data Subject Requests
-- ============================================================

CREATE TYPE gdpr_request_type AS ENUM (
  'data_export',
  'data_correction',
  'data_deletion'
);

CREATE TYPE gdpr_request_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'denied'
);

CREATE TABLE public.civis_gdpr_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES public.civis_tenants(id) ON DELETE CASCADE,
  registrant_id     UUID NOT NULL REFERENCES public.civis_registrants(id) ON DELETE CASCADE,
  request_type      gdpr_request_type NOT NULL,
  status            gdpr_request_status NOT NULL DEFAULT 'pending',
  request_details   TEXT,
  -- For corrections: which fields and what changes
  correction_fields JSONB,
  -- Processing
  processed_by      UUID REFERENCES public.profiles(id),
  processed_at      TIMESTAMPTZ,
  processor_notes   TEXT,
  denial_reason     TEXT,
  -- Compliance tracking — GDPR: 30 days from submission
  deadline_at       TIMESTAMPTZ NOT NULL,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.civis_gdpr_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_gdpr"
  ON public.civis_gdpr_requests FOR ALL
  USING (public.current_user_role() = 'super_admin');

CREATE POLICY "tenant_admin_manage_gdpr"
  ON public.civis_gdpr_requests FOR ALL
  USING (
    tenant_id = public.current_user_tenant_id()
    AND public.current_user_role() = 'tenant_admin'
  );

CREATE POLICY "registrant_own_gdpr_requests"
  ON public.civis_gdpr_requests FOR ALL
  USING (
    registrant_id IN (
      SELECT id FROM public.civis_registrants WHERE profile_id = auth.uid()
    )
  );

CREATE INDEX idx_gdpr_tenant_status ON public.civis_gdpr_requests(tenant_id, status);

CREATE TRIGGER gdpr_requests_updated_at
  BEFORE UPDATE ON public.civis_gdpr_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Tenant settings store
-- Editable security / data-retention / consent / notification config
-- (general fields map to dedicated civis_tenants columns; everything else
--  lives here as JSONB so the Settings page can persist freely).
-- ============================================================

ALTER TABLE public.civis_tenants
  ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb;
