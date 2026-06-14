-- ============================================================
-- Fix: "Database error creating new user" on auth signup
--
-- Root cause: the on_auth_user_created trigger function runs as
-- SECURITY DEFINER but without an explicit search_path. Under Supabase's
-- hardened auth context the unqualified `platform_role` type cast fails to
-- resolve, so the profiles INSERT raises and aborts the auth.users insert.
--
-- Fix: pin search_path = public, make the insert idempotent (ON CONFLICT),
-- and never let a profile-insert problem block account creation — the app /
-- seed reconcile the profile via the service role (which bypasses RLS).
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::platform_role, 'registrant')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Never block auth user creation; the profile is reconciled downstream.
    RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- The on_auth_user_created trigger already points at this function (CREATE OR
-- REPLACE keeps the binding). Sanity check:
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
