-- ============================================================
-- Civis Platform — Manual User Provisioning via SQL
-- Run in Supabase Dashboard → SQL Editor
-- This bypasses auth.admin.createUser entirely.
-- ============================================================
--
-- IMPORTANT: Requires the pgcrypto extension (enabled by default on Supabase).
--
-- Super admins use password: PEGWest@1235
-- All others use temp password: Civis@TempAdmin2026
-- ============================================================

-- Safety: make sure pgcrypto is available for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- Helper: create an auth user + identity + profile in one shot
-- ============================================================
CREATE OR REPLACE FUNCTION public.provision_user(
  p_email    TEXT,
  p_password TEXT,
  p_role     platform_role,
  p_name     TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_existing UUID;
BEGIN
  -- Skip if already exists
  SELECT id INTO v_existing FROM auth.users WHERE email = p_email;
  IF v_existing IS NOT NULL THEN
    -- Make sure the profile reflects the intended role and name
    UPDATE public.profiles
      SET role = p_role, full_name = p_name
      WHERE id = v_existing;
    RETURN v_existing;
  END IF;

  v_user_id := gen_random_uuid();

  -- Insert into auth.users with bcrypt-hashed password
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    jsonb_build_object('full_name', p_name, 'role', p_role::text),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );

  -- Insert email identity (required for email login)
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', p_email, 'email_verified', true),
    'email',
    p_email,
    NOW(),
    NOW(),
    NOW()
  );

  -- The handle_new_user trigger creates the profile row; update role/name now
  UPDATE public.profiles
    SET role = p_role, full_name = p_name
    WHERE id = v_user_id;

  -- If the trigger didn't fire for any reason, ensure a profile exists
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (v_user_id, p_email, p_role, p_name)
  ON CONFLICT (id) DO NOTHING;

  RETURN v_user_id;
END;
$$;

-- ============================================================
-- Provision all 13 Civis accounts
-- ============================================================

-- Super admins
SELECT public.provision_user('admin@afronovation.com', 'PEGWest@1235',       'super_admin',      'Afronovation Super Admin');
SELECT public.provision_user('admin@civisos.com',      'PEGWest@1235',       'super_admin',      'Civis Super Admin');

-- Operational personas
SELECT public.provision_user('tenantadmin@civisos.com',     'Civis@TempAdmin2026', 'tenant_admin',     'Tenant Administrator');
SELECT public.provision_user('embassyadmin@civisos.com',    'Civis@TempAdmin2026', 'embassy_admin',    'Embassy Administrator');
SELECT public.provision_user('consularofficer@civisos.com', 'Civis@TempAdmin2026', 'consular_officer', 'Consular Officer');
SELECT public.provision_user('analyst@civisos.com',         'Civis@TempAdmin2026', 'analyst',          'Intelligence Analyst');
SELECT public.provision_user('executiveviewer@civisos.com', 'Civis@TempAdmin2026', 'executive_viewer', 'Executive Viewer');
SELECT public.provision_user('registrant@civisos.com',      'Civis@TempAdmin2026', 'registrant',       'Diaspora Registrant');

-- Procurement personas
SELECT public.provision_user('minister@afronovation.com',    'Civis@TempAdmin2026', 'executive_viewer', 'Minister of Foreign Affairs');
SELECT public.provision_user('centralbank@afronovation.com', 'Civis@TempAdmin2026', 'analyst',          'Central Bank Governor');
SELECT public.provision_user('diasporadir@afronovation.com', 'Civis@TempAdmin2026', 'tenant_admin',     'Diaspora Commission Director');
SELECT public.provision_user('devpartner@afronovation.com',  'Civis@TempAdmin2026', 'executive_viewer', 'Development Partner');
SELECT public.provision_user('cio@afronovation.com',         'Civis@TempAdmin2026', 'tenant_admin',     'Head of Digital Government');

-- ============================================================
-- Verify
-- ============================================================
SELECT email, role, full_name, created_at
FROM public.profiles
ORDER BY role, email;

-- Should return 13 rows.

-- ============================================================
-- Cleanup: drop the helper function once provisioning is verified
-- (uncomment after confirming all 13 users sign in successfully)
-- ============================================================
-- DROP FUNCTION public.provision_user(TEXT, TEXT, platform_role, TEXT);
