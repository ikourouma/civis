-- ============================================================
-- Migration: 006.1 — Embassy Scope for Executive Viewer (Ambassador)
-- Civis Sovereign Intelligence Platform
-- Afronovation, Inc.
-- ============================================================

-- Helper: the active embassy assignments for the current user (SECURITY DEFINER,
-- bypasses RLS on civis_embassy_staff to avoid recursion in policies).
CREATE OR REPLACE FUNCTION public.current_user_embassy_ids()
RETURNS UUID[]
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(ARRAY_AGG(embassy_id), ARRAY[]::UUID[])
  FROM public.civis_embassy_staff
  WHERE user_id = auth.uid() AND is_active = true;
$$;

-- ============================================================
-- Executive viewer read policy on civis_registrants
--   • National-scope (Minister): no embassy assignment → whole tenant
--   • Embassy-scope (Ambassador): only their assigned embassy/-ies
-- ============================================================

DROP POLICY IF EXISTS "executive_viewer_aggregated_read" ON public.civis_registrants;
DROP POLICY IF EXISTS "executive_viewer_scoped_read" ON public.civis_registrants;

CREATE POLICY "executive_viewer_scoped_read"
  ON public.civis_registrants FOR SELECT
  USING (
    tenant_id = public.current_user_tenant_id()
    AND public.current_user_role() = 'executive_viewer'
    AND (
      -- National-scope executive viewer (Minister): no embassy assignment
      NOT EXISTS (
        SELECT 1 FROM public.civis_embassy_staff
        WHERE user_id = auth.uid() AND is_active = true
      )
      OR
      -- Embassy-scoped executive viewer (Ambassador): only own embassy
      embassy_id IN (
        SELECT embassy_id FROM public.civis_embassy_staff
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- Analyst: tenant-wide aggregated read (national diaspora analytics).
DROP POLICY IF EXISTS "analyst_read_tenant_registrants" ON public.civis_registrants;

CREATE POLICY "analyst_read_tenant_registrants"
  ON public.civis_registrants FOR SELECT
  USING (
    tenant_id = public.current_user_tenant_id()
    AND public.current_user_role() = 'analyst'
  );
