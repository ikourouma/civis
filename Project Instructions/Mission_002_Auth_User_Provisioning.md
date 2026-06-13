# Mission 002 — Git Initialization, Supabase Auth & Full User Provisioning

**Mission ID:** Civis-Mission-002  
**Phase:** Build Phase 1 — Foundation (Authentication & User Registry)  
**Status:** Ready to Execute  
**Prerequisites:** Mission 001, 001-A, and 001-B complete and signed off  
**Next Mission:** Mission 003 — Tenant Foundation & Role-Based Access  
**Estimated Scope:** Medium — infrastructure setup, database foundation, full user provisioning

---

## Before You Begin

Read the following files before executing any step:

- **`C:\Users\ikour\Projects\civis\civis_supabase_details.md`** — Supabase project URL, project_id, anon_public key, service_role key
- **`C:\Users\ikour\Projects\civis\civis_users.md`** — Super admin emails and credentials
- **`C:\Users\ikour\Projects\civis\Project Documents\Civis_00_Project_Team_and_Platform_Personas_v1.0.docx`** — Full user list (project team + all platform personas) for extraction

Do not hardcode any credentials, passwords, URLs, or keys in any source file, mission file, or commit. All sensitive values live exclusively in `.env.local` (gitignored) and `civis_users.md` (gitignored).

---

## Deliverable 1 — Git Initialization & First Push

### 1.1 Verify .gitignore

Before the first commit, verify `.gitignore` at project root contains all of the following. Add any that are missing:

```gitignore
# Environment variables — NEVER commit these
.env
.env.local
.env.*.local
.env.production

# Supabase local config
.supabase/

# Sensitive project files
civis_users.md
civis_supabase_details.md

# Next.js
.next/
out/

# Node
node_modules/

# Extracted document cache
.extracted/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
```

**Critical:** Confirm `civis_users.md` and `civis_supabase_details.md` are in `.gitignore` before any commit is made. These files must never appear in the repository.

### 1.2 Initialize Git and Configure Remote

```bash
cd C:\Users\ikour\Projects\civis
git init
git remote add origin https://github.com/ikourouma/civis.git
```

### 1.3 Branch Structure

Create the two primary branches:

```bash
# Main branch — production-ready code only
git checkout -b main

# Initial commit on main
git add .
git commit -m "feat: Mission 001/001-A/001-B — Civis public platform scaffold, visual enhancement, nav and hero refinement

- Next.js 14 App Router with TypeScript strict mode
- next-intl EN/FR localization — 36 statically generated routes
- Full public marketing surface: home, platform (hub + 4 subpages), solutions, security, deployment, about, contact
- Resources section: hub, documentation, security whitepaper, API reference, changelog, status
- Legal page: privacy policy, terms of service, DPA, cookie policy, compliance
- Animation system: FadeUp, StaggerContainer, AnimatedCard, CountUp
- Cookie consent banner
- Header with Platform and Resources dropdowns
- Four-column footer
- Left-aligned hero with intelligence panel and world map
- Afronovation, Inc. — Civis Sovereign Intelligence Platform v0.1.0"

git push -u origin main

# Development branch — all active development happens here
git checkout -b develop
git push -u origin develop
```

### 1.4 Branch Policy

From Mission 002 onward, all development work happens on `develop`. The `main` branch receives merges only at mission completion sign-off. Instruct this in a `CONTRIBUTING.md` at project root:

```markdown
# Civis — Branch Policy

- `main` — production-ready. Never commit directly. Merge from develop at mission sign-off only.
- `develop` — active development. All mission work branches from and merges back to develop.
- Feature branches: `feature/mission-XXX-description` — created from develop, merged back to develop.

Program Owner: Afronovation, Inc.
```

---

## Deliverable 2 — Supabase CLI Setup & Project Link

### 2.1 Install Supabase CLI

```bash
npm install -g supabase
supabase --version
```

### 2.2 Link to Civis Supabase Project

Read `project_id` from `C:\Users\ikour\Projects\civis\civis_supabase_details.md` and use it to link:

```bash
supabase login
supabase link --project-ref [project_id_from_file]
```

### 2.3 Initialize Supabase Local Structure

```bash
supabase init
```

This creates the `/supabase` folder at project root with:
```
supabase/
  migrations/        — SQL migration files (versioned, committed to git)
  seed.sql           — Seed data for development (committed, no credentials)
  config.toml        — Supabase project config (committed)
```

---

## Deliverable 3 — Environment Variables

### 3.1 Create .env.local

Read all values from `C:\Users\ikour\Projects\civis\civis_supabase_details.md` and populate `.env.local` at project root:

```bash
# Supabase — read from civis_supabase_details.md
NEXT_PUBLIC_SUPABASE_URL=[project_url_from_file]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon_public_from_file]
SUPABASE_SERVICE_ROLE_KEY=[service_role_from_file]

# Civis Platform
CIVIS_DEPLOYMENT_TIER=cloud
NEXT_PUBLIC_DEFAULT_LOCALE=en

# Dia AI Service (placeholder — Mission future)
DIA_SERVICE_URL=
DIA_SERVICE_API_KEY=

# Mapbox (placeholder — Mission future)
NEXT_PUBLIC_MAPBOX_TOKEN=

# Storage
SUPABASE_STORAGE_BUCKET_PREFIX=civis
```

Verify `.env.local` is listed in `.gitignore` before proceeding. It must never be committed.

### 3.2 Update Supabase Clients

Update `/lib/supabase/client.ts` and `/lib/supabase/server.ts` with the environment variables now that they are populated. Use the Supabase SSR package for server-side session handling:

```bash
npm install @supabase/ssr @supabase/supabase-js
```

**`/lib/supabase/client.ts`** — browser client:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**`/lib/supabase/server.ts`** — server client (Server Components, Route Handlers, Server Actions):
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

**`/lib/supabase/admin.ts`** — service role client (server-side only, never in components):
```typescript
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
```

---

## Deliverable 4 — Database Foundation (First Migration)

### 4.1 Platform Roles Enum

Create migration file `supabase/migrations/20260001000000_create_roles_and_profiles.sql`:

```sql
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

-- System can insert audit logs (via service role)
-- No user-level insert policy — audit logs written via admin client only

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
```

### 4.2 Run Migration

```bash
supabase db push
```

Verify in Supabase dashboard that:
- `public.profiles` table exists with all columns
- `public.audit_logs` table exists
- RLS is enabled on both tables (green shield icon)
- All policies are listed under each table
- `platform_role` enum appears under Database → Types

---

## Deliverable 5 — Extract Full User List & Update civis_users.md

### 5.1 Extract Users from Doc 00

Read `C:\Users\ikour\Projects\civis\Project Documents\Civis_00_Project_Team_and_Platform_Personas_v1.0.docx` and extract all platform personas and their test account emails from:
- Section 5 (Procurement & Marketing Personas) — five personas
- Section 6 (Operational Platform Personas) — six personas
- Section 7 (Test Account Registry) — full account list

### 5.2 Update civis_users.md

Rewrite `C:\Users\ikour\Projects\civis\civis_users.md` with the complete user registry in this structure:

```markdown
# Civis Platform — User Registry
# Program Owner: Afronovation, Inc.
# Classification: CONFIDENTIAL — Never commit to git, never share
# Last Updated: [current date]

---

## Super Admins
| Email | Role | Password | Supabase Status |
|---|---|---|---|
| admin@afronovation.com | super_admin | [read from existing file] | Provisioned |
| admin@civisos.com | super_admin | [read from existing file] | Provisioned |

---

## Operational Platform Personas — Test Accounts
| Email | Role | Temp Password | Supabase Status |
|---|---|---|---|
| tenantadmin@civisos.com | tenant_admin | Civis@TempAdmin2026 | Provisioned — password change required |
| embassyadmin@civisos.com | embassy_admin | Civis@TempAdmin2026 | Provisioned — password change required |
| consularofficer@civisos.com | consular_officer | Civis@TempAdmin2026 | Provisioned — password change required |
| analyst@civisos.com | analyst | Civis@TempAdmin2026 | Provisioned — password change required |
| executiveviewer@civisos.com | executive_viewer | Civis@TempAdmin2026 | Provisioned — password change required |
| registrant@civisos.com | registrant | Civis@TempAdmin2026 | Provisioned — password change required |

---

## Procurement & Marketing Personas — Test Accounts
| Email | Role | Temp Password | Supabase Status |
|---|---|---|---|
| minister@afronovation.com | executive_viewer | Civis@TempAdmin2026 | Provisioned — password change required |
| centralbank@afronovation.com | analyst | Civis@TempAdmin2026 | Provisioned — password change required |
| diasporadir@afronovation.com | tenant_admin | Civis@TempAdmin2026 | Provisioned — password change required |
| devpartner@afronovation.com | executive_viewer | Civis@TempAdmin2026 | Provisioned — password change required |
| cio@afronovation.com | tenant_admin | Civis@TempAdmin2026 | Provisioned — password change required |

---

## Password Change Log
| Email | Changed By | Date | Notes |
|---|---|---|---|
| admin@afronovation.com | Ibrahima Kourouma | [date] | Initial setup |
| admin@civisos.com | Ibrahima Kourouma | [date] | Initial setup |

---

## Notes
- Temp password for all non-super-admin accounts: Civis@TempAdmin2026
- All temp passwords must be changed before any account is used for client-facing demos
- Super admin passwords are stored in Afronovation secure vault only
- This file is gitignored — never appears in the repository
```

---

## Deliverable 6 — Provision All Users in Supabase Auth

### 6.1 Create User Provisioning Script

Create `/scripts/provision-users.ts` — a one-time provisioning script using the admin client:

```typescript
// scripts/provision-users.ts
// Run once: npx ts-node scripts/provision-users.ts
// Uses service role — server-side only, never expose to client

import { createAdminClient } from '../lib/supabase/admin'

const TEMP_PASSWORD = 'Civis@TempAdmin2026'

const users = [
  // Super admins — read passwords from civis_users.md manually
  // These are created via Supabase dashboard, not this script
  
  // Operational personas
  { email: 'tenantadmin@civisos.com',     role: 'tenant_admin',     name: 'Tenant Administrator' },
  { email: 'embassyadmin@civisos.com',    role: 'embassy_admin',    name: 'Embassy Administrator' },
  { email: 'consularofficer@civisos.com', role: 'consular_officer', name: 'Consular Officer' },
  { email: 'analyst@civisos.com',         role: 'analyst',          name: 'Intelligence Analyst' },
  { email: 'executiveviewer@civisos.com', role: 'executive_viewer', name: 'Executive Viewer' },
  { email: 'registrant@civisos.com',      role: 'registrant',       name: 'Diaspora Registrant' },

  // Procurement personas — mapped to closest operational role
  { email: 'minister@afronovation.com',      role: 'executive_viewer', name: 'Minister of Foreign Affairs' },
  { email: 'centralbank@afronovation.com',   role: 'analyst',          name: 'Central Bank Governor' },
  { email: 'diasporadir@afronovation.com',   role: 'tenant_admin',     name: 'Diaspora Commission Director' },
  { email: 'devpartner@afronovation.com',    role: 'executive_viewer', name: 'Development Partner' },
  { email: 'cio@afronovation.com',           role: 'tenant_admin',     name: 'Head of Digital Government' },
]

async function provisionUsers() {
  const admin = createAdminClient()
  
  console.log('Starting Civis user provisioning...\n')
  
  for (const user of users) {
    try {
      // Create auth user
      const { data, error } = await admin.auth.admin.createUser({
        email: user.email,
        password: TEMP_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: user.name,
          role: user.role,
        }
      })
      
      if (error) {
        console.error(`❌ Failed: ${user.email} — ${error.message}`)
        continue
      }
      
      // Update profile role (trigger creates profile, this ensures role is correct)
      if (data.user) {
        const { error: profileError } = await admin
          .from('profiles')
          .update({ 
            role: user.role as any,
            full_name: user.name 
          })
          .eq('id', data.user.id)
          
        if (profileError) {
          console.error(`⚠️  User created but profile role not set: ${user.email} — ${profileError.message}`)
        } else {
          console.log(`✅ Provisioned: ${user.email} (${user.role})`)
        }
      }
      
      // Write audit log
      await admin.from('audit_logs').insert({
        user_email: 'system@civisos.com',
        user_role: 'super_admin',
        action: 'USER_PROVISIONED',
        resource: 'auth.users',
        resource_id: data.user?.id,
        metadata: { 
          provisioned_email: user.email,
          role: user.role,
          method: 'provision-users-script',
          mission: 'Mission-002'
        }
      })
      
    } catch (err) {
      console.error(`❌ Exception for ${user.email}:`, err)
    }
  }
  
  console.log('\nProvisioning complete. Verify in Supabase dashboard → Authentication → Users')
  console.log('All accounts use temp password: Civis@TempAdmin2026')
  console.log('Update civis_users.md with provisioning date and status.')
}

provisionUsers()
```

### 6.2 Provision Super Admins via Supabase Dashboard

Super admin accounts are provisioned directly in the Supabase dashboard — not via script — to ensure maximum control over credential handling:

1. Go to Supabase Dashboard → Authentication → Users → Add User
2. Create `admin@afronovation.com` with password from `civis_users.md` — set email confirmed: true
3. Create `admin@civisos.com` with password from `civis_users.md` — set email confirmed: true
4. After creation, run this SQL in Supabase SQL Editor to assign super_admin role:

```sql
-- Assign super_admin role to both platform admins
UPDATE public.profiles 
SET role = 'super_admin', full_name = 'Afronovation Super Admin'
WHERE email IN ('admin@afronovation.com', 'admin@civisos.com');

-- Verify
SELECT email, role, created_at FROM public.profiles 
WHERE role = 'super_admin';
```

### 6.3 Run Provisioning Script for All Other Users

```bash
npx ts-node --compiler-options '{"module":"commonjs"}' scripts/provision-users.ts
```

Verify output shows ✅ for all 11 accounts.

### 6.4 Verify in Supabase Dashboard

Go to Authentication → Users. Confirm all 13 accounts are listed:
- 2 super admins: `admin@afronovation.com`, `admin@civisos.com`
- 6 operational personas: `tenantadmin@`, `embassyadmin@`, `consularofficer@`, `analyst@`, `executiveviewer@`, `registrant@` (all @civisos.com)
- 5 procurement personas: `minister@`, `centralbank@`, `diasporadir@`, `devpartner@`, `cio@` (all @afronovation.com)

All should show "Email confirmed: Yes".

Run this verification query in SQL Editor:

```sql
SELECT 
  p.email,
  p.role,
  p.is_active,
  p.created_at
FROM public.profiles p
ORDER BY p.role, p.email;
```

Expected: 13 rows, correct roles, no nulls on email or role.

---

## Deliverable 7 — Auth Service Layer

Create typed service functions in `/lib/services/auth/`. No direct Supabase calls anywhere in components.

**`/lib/services/auth/index.ts`:**

```typescript
export { signIn, signOut, getSession, getCurrentUser } from './auth.service'
export { getUserProfile, updateUserProfile } from './profile.service'
export type { CivisUser, CivisSession } from './auth.types'
```

**`/lib/services/auth/auth.types.ts`:**

```typescript
export type PlatformRole = 
  | 'super_admin'
  | 'tenant_admin'
  | 'embassy_admin'
  | 'consular_officer'
  | 'analyst'
  | 'executive_viewer'
  | 'registrant'
  | 'economic_planner'

export interface CivisUser {
  id: string
  email: string
  fullName: string | null
  role: PlatformRole
  tenantId: string | null
  isActive: boolean
  lastSignInAt: string | null
}

export interface CivisSession {
  user: CivisUser
  accessToken: string
  expiresAt: number
}

export interface SignInCredentials {
  email: string
  password: string
}

export interface AuthResult {
  success: boolean
  session?: CivisSession
  error?: string
}
```

**`/lib/services/auth/auth.service.ts`:**

```typescript
import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClientFn } from '@/lib/supabase/server'
import type { SignInCredentials, AuthResult, CivisSession } from './auth.types'

export async function signIn(credentials: SignInCredentials): Promise<AuthResult> {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  })
  
  if (error || !data.session) {
    return { success: false, error: error?.message ?? 'Authentication failed' }
  }
  
  // Fetch profile to get platform role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.session.user.id)
    .single()
    
  if (profileError || !profile) {
    return { success: false, error: 'Profile not found. Contact your administrator.' }
  }
  
  if (!profile.is_active) {
    await supabase.auth.signOut()
    return { success: false, error: 'Your account has been deactivated. Contact your administrator.' }
  }
  
  const session: CivisSession = {
    user: {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      role: profile.role,
      tenantId: profile.tenant_id,
      isActive: profile.is_active,
      lastSignInAt: profile.last_sign_in_at,
    },
    accessToken: data.session.access_token,
    expiresAt: data.session.expires_at ?? 0,
  }
  
  return { success: true, session }
}

export async function signOut(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
}

export async function getSession(): Promise<CivisSession | null> {
  const supabase = await createServerClientFn()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) return null
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()
    
  if (!profile) return null
  
  return {
    user: {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      role: profile.role,
      tenantId: profile.tenant_id,
      isActive: profile.is_active,
      lastSignInAt: profile.last_sign_in_at,
    },
    accessToken: session.access_token,
    expiresAt: session.expires_at ?? 0,
  }
}

export async function getCurrentUser() {
  const session = await getSession()
  return session?.user ?? null
}
```

---

## Deliverable 8 — Sign In Page

Create `/app/[locale]/auth/signin/page.tsx` — the institutional sign-in page.

**Design requirements:**
- Full-height page, dark navy background (`#0D1B2E`) — same as hero
- Centered card: `background #0D1B2E`, `border 1px solid rgba(201,168,76,0.2)`, `border-radius 16px`, `padding 48px`, `max-width 440px`
- CIVIS wordmark + "Sovereign Diaspora Intelligence" tagline above card
- Card header: "Platform Sign In" — white, H2
- Sub-header: "Authorized government personnel only" — gold, text-xs, uppercase
- Email field and password field — institutional styling (dark input background)
- "Sign In" button — gold fill, full width
- Error state — red border on fields, error message below
- No "Sign Up", no "Forgot Password" link visible (admin-provisioned accounts only)
- "Having trouble signing in? Contact your administrator." — text-xs, text-center, below button
- Footer: "Civis — Afronovation, Inc. | Sovereign Intelligence Platform" — text-xs, text-center, text-white/30
- FadeUp animation on card entry
- Both EN and FR translation keys

**Post sign-in routing logic:**
```
super_admin      → /[locale]/admin/dashboard (Mission 003)
tenant_admin     → /[locale]/workspace/dashboard (Mission 003)
embassy_admin    → /[locale]/workspace/embassy (Mission 003)
consular_officer → /[locale]/workspace/cases (Mission 003)
analyst          → /[locale]/intelligence/dashboard (Mission 003)
executive_viewer → /[locale]/executive/dashboard (Mission 003)
registrant       → /[locale]/portal/dashboard (Mission 003)
```

For Mission 002, all post-sign-in routes show a placeholder "Workspace coming in Mission 003" page. The routing logic is implemented now so Mission 003 simply builds the destination pages.

---

## Deliverable 9 — Protected Route Middleware

Update `middleware.ts` to handle both i18n routing (existing) and auth protection (new).

**Protection rules:**
```
Public routes (no auth required):
  /[locale]/*                 — all marketing pages
  /[locale]/auth/signin       — sign in page
  /[locale]/auth/callback     — Supabase auth callback

Protected routes (auth required — redirect to signin if no session):
  /[locale]/admin/*           — super_admin only
  /[locale]/workspace/*       — tenant_admin, embassy_admin, consular_officer
  /[locale]/intelligence/*    — analyst, executive_viewer
  /[locale]/executive/*       — executive_viewer
  /[locale]/portal/*          — registrant
```

Middleware checks for Supabase session cookie. If accessing a protected route without a valid session, redirect to `/[locale]/auth/signin`.

---

## Deliverable 10 — Placeholder Workspace Pages

For each post-sign-in route, create a minimal placeholder page that confirms auth is working:

```tsx
// Shown after sign-in, before Mission 003 builds the real workspace
// Example: /app/[locale]/workspace/dashboard/page.tsx

export default async function WorkspaceDashboard() {
  const user = await getCurrentUser()
  
  return (
    <div className="min-h-screen bg-[#0D1B2E] flex items-center justify-center">
      <div className="text-center">
        <p className="text-gold-400 text-xs uppercase tracking-widest mb-4">
          Authentication Verified
        </p>
        <h1 className="text-white text-3xl font-bold mb-2">
          Welcome, {user?.fullName ?? user?.email}
        </h1>
        <p className="text-blue-200/60 mb-1">Role: {user?.role}</p>
        <p className="text-blue-200/40 text-sm mt-6">
          Workspace interface arrives in Mission 003.
        </p>
      </div>
    </div>
  )
}
```

Create this placeholder for all seven workspace routes.

---

## Deliverable 11 — Commit & Push Mission 002

When all deliverables are complete and verified:

```bash
git add .
git commit -m "feat: Mission 002 — Supabase auth, database foundation, full user provisioning

- Git initialized, remote configured, branch structure established
- Supabase CLI linked to Civis project
- .env.local populated from civis_supabase_details.md
- Migration 001: platform_role enum, profiles table, audit_logs, RLS policies
- 13 platform users provisioned in Supabase Auth
- Auth service layer: signIn, signOut, getSession, getCurrentUser
- Sign in page: /[locale]/auth/signin — institutional design, EN/FR
- Protected route middleware — auth + i18n combined
- Placeholder workspace pages for all 7 role destinations
- Provisioning script: scripts/provision-users.ts

Afronovation, Inc. — Civis Sovereign Intelligence Platform v0.2.0"

git push origin develop
```

---

## Success Criteria

- [ ] Repository pushed to `https://github.com/ikourouma/civis` — main and develop branches visible
- [ ] `civis_users.md` and `civis_supabase_details.md` confirmed absent from repository (gitignored)
- [ ] Supabase CLI linked — `supabase status` shows correct project
- [ ] `.env.local` populated — app connects to Supabase without errors
- [ ] Migration applied — `profiles` and `audit_logs` tables visible in Supabase dashboard
- [ ] RLS enabled on both tables — confirmed in dashboard
- [ ] `platform_role` enum visible under Database → Types
- [ ] All 13 users provisioned in Supabase Auth — confirmed in dashboard
- [ ] Super admin role verified: `SELECT role FROM profiles WHERE email = 'admin@afronovation.com'` returns `super_admin`
- [ ] All 11 non-super-admin accounts show `Civis@TempAdmin2026` temp password status in `civis_users.md`
- [ ] Sign in page renders at `/en/auth/signin` and `/fr/auth/signin`
- [ ] Sign in with `admin@afronovation.com` succeeds and routes to placeholder workspace
- [ ] Sign in with `admin@civisos.com` succeeds and routes to placeholder workspace
- [ ] Unauthenticated access to `/en/workspace/dashboard` redirects to `/en/auth/signin`
- [ ] No TypeScript errors in strict mode
- [ ] `next build` completes cleanly
- [ ] All changes committed and pushed to develop branch

---

## Explicitly Out of Scope

- Tenant creation or tenant_id assignment (Mission 003)
- Embassy workspace UI (Mission 003)
- Role-specific dashboard screens (Mission 003)
- Magic Link / passwordless auth for registrants (future mission)
- Password reset flow (future mission)
- Multi-factor authentication (future mission)
- Real workspace functionality behind any placeholder page

---

## Security Checklist Before Sign-Off

- [ ] `civis_users.md` is NOT in the repository — confirmed via `git ls-files civis_users.md` returning empty
- [ ] `civis_supabase_details.md` is NOT in the repository — confirmed via `git ls-files civis_supabase_details.md` returning empty
- [ ] `.env.local` is NOT in the repository — confirmed via `git ls-files .env.local` returning empty
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is not referenced anywhere in client-side code
- [ ] `createAdminClient()` is only imported in server-side files and scripts
- [ ] Provisioning script deleted or moved to `.gitignore` after use (optional but recommended)

---

## Completion Sign-Off

When Mission 002 is complete, confirm before closing:

1. GitHub repository has main and develop branches with correct commit history
2. All 13 users visible in Supabase Authentication → Users
3. Profiles table shows correct roles for all users
4. Sign in tested with both super admin accounts — both route to placeholder workspace
5. Gitignore verified — no sensitive files in repository
6. Security checklist above fully cleared
7. Ready to proceed to Mission 003 — Tenant Foundation & Role-Based Access Control

---

*Document location: `C:\Users\ikour\Projects\civis\Project Instructions\Mission_002_Auth_User_Provisioning.md`*  
*Program Owner: Afronovation, Inc.*  
*Classification: Internal — Build Team Only*  
*Depends on: Mission_001B_Nav_Hero_Refinement.md*