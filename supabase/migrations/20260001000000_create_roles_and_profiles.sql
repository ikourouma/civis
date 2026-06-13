-- ============================================================
-- Migration: 001 — Platform Roles & Profiles
-- Civis Sovereign Intelligence Platform
-- Afronovation, Inc.
-- ============================================================

-- Platform role enum — all eight Civis roles
CREATE TYPE platform_role AS ENUM (
  'super_admin',
  'tenant_admin',
  'embassy_admin',
  'consular_officer',
  'analyst',
  'executive_viewer',
  'registrant',
  'economic_planner'
);

-- Profiles table — extends Supabase auth.users
-- One profile per authenticated user
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  full_name       TEXT,
  role            platform_role NOT NULL DEFAULT 'registrant',
  tenant_id       UUID,                          -- NULL for super_admin only
  avatar_url      TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_sign_in_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Super admins can read all profiles
CREATE POLICY "super_admin_read_all_profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'super_admin'
    )
  );

-- Users can read their own profile
CREATE POLICY "users_read_own_profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- Super admins can insert profiles
CREATE POLICY "super_admin_insert_profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'super_admin'
    )
  );

-- Super admins can update all profiles
CREATE POLICY "super_admin_update_profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'super_admin'
    )
  );

-- Users can update their own non-role fields
CREATE POLICY "users_update_own_profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- ============================================================
-- Audit Log Table
-- ============================================================

CREATE TABLE public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id),
  user_email  TEXT,
  user_role   platform_role,
  action      TEXT NOT NULL,
  resource    TEXT NOT NULL,
  resource_id TEXT,
  metadata    JSONB DEFAULT '{}',
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Super admins can read all audit logs
CREATE POLICY "super_admin_read_audit_logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'super_admin'
    )
  );

-- System inserts audit logs via service role only — no user-level insert policy

-- ============================================================
-- Updated_at trigger
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Auto-create profile on auth.users insert
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::platform_role,
      'registrant'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
