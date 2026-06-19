-- ============================================================
-- Migration: 010 — Platform Hardening
-- Mission 006-C — Critical Fixes, Missing Pages & UX Foundation
-- ============================================================

-- ── Diplomatic titles (display-only; does not affect permissions) ──
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS diplomatic_title TEXT;

-- ── Soft delete columns ──
-- The application excludes soft-deleted rows in the service layer
-- (`.is('deleted_at', null)`); these columns provide the storage + restore path.
ALTER TABLE public.civis_tenants ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.civis_embassies ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.civis_registrants ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.civis_registrant_documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.civis_registrant_notes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ── Note enhancements ──
ALTER TABLE public.civis_registrant_notes
  ADD COLUMN IF NOT EXISTS note_type TEXT NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- ── Auto-embassy-mapping helper ──
-- Returns the active embassy with jurisdiction over a country, or NULL.
CREATE OR REPLACE FUNCTION public.resolve_embassy_for_country(
  p_tenant_id UUID,
  p_country_code TEXT
) RETURNS UUID AS $$
  SELECT ej.embassy_id
  FROM public.civis_embassy_jurisdictions ej
  JOIN public.civis_embassies e ON ej.embassy_id = e.id
  WHERE ej.tenant_id = p_tenant_id
    AND ej.country_code = p_country_code
    AND e.status = 'active'
    AND e.deleted_at IS NULL
  LIMIT 1;
$$ LANGUAGE SQL STABLE;
