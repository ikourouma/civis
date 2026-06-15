-- ============================================================
-- Migration: 007 — Staff Provisioning Role Guard
-- Civis Sovereign Intelligence Platform
-- Afronovation, Inc.
-- ============================================================

-- Prevent tenant_admin from assigning privileged roles, and embassy_admin from
-- changing roles at all. Service-role (seed/service-layer) operations have a
-- NULL auth.uid() and pass through — the service layer enforces its own rules.
CREATE OR REPLACE FUNCTION public.validate_staff_provisioning()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role platform_role;
BEGIN
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();

  -- Service role / system context (no JWT) — allow; service layer enforces rules.
  IF caller_role IS NULL THEN
    RETURN NEW;
  END IF;

  -- Super admin can do anything.
  IF caller_role = 'super_admin' THEN
    RETURN NEW;
  END IF;

  -- Tenant admin restrictions.
  IF caller_role = 'tenant_admin' THEN
    IF NEW.role IN ('super_admin', 'tenant_admin') THEN
      RAISE EXCEPTION 'Tenant administrators cannot assign role: %', NEW.role;
    END IF;
    IF NEW.tenant_id IS DISTINCT FROM public.current_user_tenant_id() THEN
      RAISE EXCEPTION 'Cannot modify users in another tenant';
    END IF;
    RETURN NEW;
  END IF;

  -- Embassy admin cannot change roles directly (staff mgmt goes via embassy_staff).
  IF caller_role = 'embassy_admin' THEN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
      RAISE EXCEPTION 'Embassy administrators cannot change user roles directly';
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_staff_role_assignment ON public.profiles;

CREATE TRIGGER validate_staff_role_assignment
  BEFORE UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_staff_provisioning();

-- ============================================================
-- RLS policies for tenant-admin staff management
-- (Postgres has no CREATE POLICY IF NOT EXISTS — drop then create.)
-- ============================================================

DROP POLICY IF EXISTS "tenant_admin_read_tenant_profiles" ON public.profiles;
CREATE POLICY "tenant_admin_read_tenant_profiles"
  ON public.profiles FOR SELECT
  USING (
    public.current_user_role() = 'tenant_admin'
    AND tenant_id = public.current_user_tenant_id()
  );

DROP POLICY IF EXISTS "tenant_admin_update_tenant_profiles" ON public.profiles;
CREATE POLICY "tenant_admin_update_tenant_profiles"
  ON public.profiles FOR UPDATE
  USING (
    public.current_user_role() = 'tenant_admin'
    AND tenant_id = public.current_user_tenant_id()
  )
  WITH CHECK (
    tenant_id = public.current_user_tenant_id()
    AND role NOT IN ('super_admin', 'tenant_admin')
  );

-- Embassy admin can read profiles of staff within their own embassy/-ies.
DROP POLICY IF EXISTS "embassy_admin_read_embassy_profiles" ON public.profiles;
CREATE POLICY "embassy_admin_read_embassy_profiles"
  ON public.profiles FOR SELECT
  USING (
    public.current_user_role() = 'embassy_admin'
    AND id IN (
      SELECT user_id FROM public.civis_embassy_staff
      WHERE embassy_id = ANY (public.current_user_embassy_ids()) AND is_active = true
    )
  );
