-- ============================================================
-- Fix: Infinite recursion in profiles RLS policies
-- Error: 42P17 — infinite recursion detected in policy for relation "profiles"
--
-- Root cause: policies that check "is this user a super_admin" do so by
-- querying public.profiles — which triggers the SAME policies again → loop.
--
-- Fix: a SECURITY DEFINER helper reads the role directly, bypassing RLS.
-- ============================================================

-- Step 1: Create a role-lookup helper that bypasses RLS (SECURITY DEFINER)
-- This is safe: it only returns the caller's own role.
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS platform_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Step 2: Drop all existing policies that reference profiles FROM WITHIN a profiles policy
DROP POLICY IF EXISTS "super_admin_read_all_profiles"  ON public.profiles;
DROP POLICY IF EXISTS "super_admin_insert_profiles"    ON public.profiles;
DROP POLICY IF EXISTS "super_admin_update_profiles"    ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile"       ON public.profiles;
-- users_read_own_profile is fine (no sub-query) — leave it

-- Step 3: Re-create policies using the helper (no recursion possible)

CREATE POLICY "super_admin_read_all_profiles"
  ON public.profiles FOR SELECT
  USING (public.get_auth_user_role() = 'super_admin');

CREATE POLICY "super_admin_insert_profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.get_auth_user_role() = 'super_admin');

CREATE POLICY "super_admin_update_profiles"
  ON public.profiles FOR UPDATE
  USING (public.get_auth_user_role() = 'super_admin');

-- Users can update their own non-role fields; the WITH CHECK prevents role escalation
CREATE POLICY "users_update_own_profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = public.get_auth_user_role()
  );

-- Step 4: Verify — test that the policy no longer recurses
-- Run this as a sanity check after the above executes:
SELECT id, email, role, is_active
FROM public.profiles
LIMIT 5;
