# Mission 003 — Tenant Foundation & Role-Based Access Control

**Mission ID:** Civis-Mission-003  
**Phase:** Build Phase 2 — Core Platform Foundation  
**Status:** Ready to Execute  
**Prerequisites:** Mission 002 complete and signed off  
**Next Mission:** Mission 004 — Embassy Workspace & Registrant Registry  
**Estimated Scope:** Large — multi-layer RBAC, tenant data model, admin workspace, role-specific routing

---

## Before You Begin

Read the following documents from `C:\Users\ikour\Projects\civis\Project Documents` before writing any code:

- **Doc 05** — Multi-Tenant Data Architecture & Sovereign Data Model v1.0 (primary reference — read fully)
- **Doc 08** — Technical Architecture & Implementation Blueprint v2.0 (RBAC and middleware sections)
- **Doc 11** — Security Architecture Specification v1.0 (access control and audit requirements)
- **Doc 00** — Project Team, Roles & Platform Personas (role definitions and access expectations)

**Critical principle from Doc 05 — enforce before writing a single line of application code:**
> Every tenant-owned table must include `tenant_id uuid not null`. RLS must be enabled before any feature uses the table. No exceptions. Failing to enforce this from the first SQL pack creates a sovereign data breach risk that cannot be remediated.

---

## Architecture Overview

Mission 003 establishes the three-layer RBAC system that governs every protected route in Civis:

```
Layer 1 — Next.js Middleware    → Route-level role check before page renders
Layer 2 — Service Layer         → Function-level permission check before data access  
Layer 3 — Database RLS          → Row-level enforcement — the last line of defense
```

All three layers must be active simultaneously. Passing Layer 1 does not grant access to Layer 3. A bypass of Layer 1 still fails at Layer 3. This is non-negotiable sovereign-grade architecture.

---

## Deliverable 1 — Tenant Foundation Migration

Create `supabase/migrations/20260002000000_tenant_foundation.sql`

This migration creates the full tenant governance domain from Doc 05 Section 6.

```sql
-- ============================================================
-- Migration: 002 — Tenant Foundation
-- Civis Sovereign Intelligence Platform
-- Afronovation, Inc.
-- ============================================================

-- Deployment tier enum
CREATE TYPE deployment_tier AS ENUM ('cloud', 'government', 'sovereign');

-- Tenant status enum  
CREATE TYPE tenant_status AS ENUM ('active', 'pilot', 'suspended', 'archived');

-- ============================================================
-- civis_tenants — core sovereign government tenant table
-- ============================================================

CREATE TABLE public.civis_tenants (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT NOT NULL,
  country_code            TEXT NOT NULL UNIQUE,    -- ISO 3166-1 alpha-2
  official_country_name   TEXT,
  region                  TEXT,                    -- West Africa, East Africa, etc.
  deployment_tier         deployment_tier NOT NULL DEFAULT 'cloud',
  status                  tenant_status NOT NULL DEFAULT 'pilot',
  default_language        TEXT NOT NULL DEFAULT 'en',
  supported_languages     TEXT[] NOT NULL DEFAULT ARRAY['en'],
  currency_code           TEXT,
  timezone                TEXT,
  data_residency_region   TEXT NOT NULL,
  data_residency_notes    TEXT,
  logo_url                TEXT,
  primary_contact_email   TEXT,
  contract_start_date     DATE,
  contract_end_date       DATE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.civis_tenants ENABLE ROW LEVEL SECURITY;

-- Super admins can read all tenants
CREATE POLICY "super_admin_read_tenants"
  ON public.civis_tenants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

-- Tenant users can read their own tenant
CREATE POLICY "tenant_users_read_own_tenant"
  ON public.civis_tenants FOR SELECT
  USING (
    id = (
      SELECT tenant_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- Super admins can insert and update tenants
CREATE POLICY "super_admin_insert_tenants"
  ON public.civis_tenants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

CREATE POLICY "super_admin_update_tenants"
  ON public.civis_tenants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

-- ============================================================
-- civis_tenant_settings — configurable policy per tenant
-- ============================================================

CREATE TABLE public.civis_tenant_settings (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID NOT NULL REFERENCES public.civis_tenants(id) ON DELETE CASCADE,
  mfa_required_roles          TEXT[] NOT NULL DEFAULT ARRAY['tenant_admin', 'embassy_admin'],
  password_max_age_days       INTEGER NOT NULL DEFAULT 180,
  session_timeout_minutes     INTEGER NOT NULL DEFAULT 480,
  max_login_attempts          INTEGER NOT NULL DEFAULT 10,
  data_retention_days         INTEGER NOT NULL DEFAULT 2555,  -- 7 years
  allow_data_export           BOOLEAN NOT NULL DEFAULT true,
  require_consent_on_register BOOLEAN NOT NULL DEFAULT true,
  enable_dia_ai               BOOLEAN NOT NULL DEFAULT false,
  enable_economic_intelligence BOOLEAN NOT NULL DEFAULT false,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id)
);

ALTER TABLE public.civis_tenant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_tenant_settings"
  ON public.civis_tenant_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

CREATE POLICY "tenant_admin_read_own_settings"
  ON public.civis_tenant_settings FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('tenant_admin')
    )
  );

CREATE POLICY "tenant_admin_update_own_settings"
  ON public.civis_tenant_settings FOR UPDATE
  USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'tenant_admin'
    )
  );

-- ============================================================
-- Update profiles table — add tenant foreign key constraint
-- (profiles table created in Migration 001)
-- ============================================================

ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_tenant_id_fkey 
  FOREIGN KEY (tenant_id) 
  REFERENCES public.civis_tenants(id) ON DELETE SET NULL;

-- ============================================================
-- Helper function — get current user's tenant_id
-- Used in RLS policies across all tenant-scoped tables
-- ============================================================

CREATE OR REPLACE FUNCTION public.current_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- Helper function — get current user's role
-- Used in RLS policies and service layer guards
-- ============================================================

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS platform_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- Helper function — check if current user has minimum role
-- ============================================================

CREATE OR REPLACE FUNCTION public.user_has_role(required_role platform_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = required_role
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- Seed — Afronovation platform tenant (super admin tenant)
-- ============================================================

INSERT INTO public.civis_tenants (
  name, country_code, official_country_name, region,
  deployment_tier, status, default_language, supported_languages,
  data_residency_region
) VALUES (
  'Afronovation Platform',
  'AF',
  'Afronovation, Inc.',
  'Platform',
  'sovereign',
  'active',
  'en',
  ARRAY['en', 'fr'],
  'us-east-1'
);

-- Assign super admins to platform tenant
UPDATE public.profiles
SET tenant_id = (SELECT id FROM public.civis_tenants WHERE country_code = 'AF')
WHERE role = 'super_admin';

-- Triggers
CREATE TRIGGER tenant_settings_updated_at
  BEFORE UPDATE ON public.civis_tenant_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER civis_tenants_updated_at
  BEFORE UPDATE ON public.civis_tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Run Migration

```bash
supabase db push
```

Verify in dashboard:
- `civis_tenants` table exists with Afronovation seed row
- `civis_tenant_settings` table exists
- `deployment_tier` and `tenant_status` enums visible under Types
- `current_user_tenant_id()`, `current_user_role()`, `user_has_role()` functions visible under Functions
- Super admin profiles now have `tenant_id` pointing to Afronovation platform tenant

---

## Deliverable 2 — RBAC Permission System

Create `/lib/rbac/` — the permission definition layer used by both middleware and service functions.

**`/lib/rbac/roles.ts`:**

```typescript
import type { PlatformRole } from '@/lib/services/auth/auth.types'

// Role hierarchy — higher index = more privilege
export const ROLE_HIERARCHY: Record<PlatformRole, number> = {
  registrant:       1,
  economic_planner: 2,
  executive_viewer: 3,
  analyst:          4,
  consular_officer: 5,
  embassy_admin:    6,
  tenant_admin:     7,
  super_admin:      8,
}

// Route prefix to allowed roles mapping
export const ROUTE_PERMISSIONS: Record<string, PlatformRole[]> = {
  '/admin':        ['super_admin'],
  '/workspace':    ['tenant_admin', 'embassy_admin', 'consular_officer', 'super_admin'],
  '/intelligence': ['analyst', 'executive_viewer', 'tenant_admin', 'super_admin'],
  '/executive':    ['executive_viewer', 'tenant_admin', 'super_admin'],
  '/portal':       ['registrant', 'super_admin'],
}

// Workspace sub-route permissions
export const WORKSPACE_PERMISSIONS: Record<string, PlatformRole[]> = {
  'dashboard':     ['tenant_admin', 'embassy_admin', 'super_admin'],
  'embassy':       ['tenant_admin', 'embassy_admin', 'super_admin'],
  'cases':         ['consular_officer', 'embassy_admin', 'tenant_admin', 'super_admin'],
  'registry':      ['consular_officer', 'embassy_admin', 'tenant_admin', 'super_admin'],
  'users':         ['tenant_admin', 'super_admin'],
  'settings':      ['tenant_admin', 'super_admin'],
}

export function hasPermission(
  userRole: PlatformRole,
  allowedRoles: PlatformRole[]
): boolean {
  return allowedRoles.includes(userRole)
}

export function hasMinimumRole(
  userRole: PlatformRole,
  minimumRole: PlatformRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole]
}

// Post-sign-in destination by role
export function getDefaultRoute(role: PlatformRole, locale: string): string {
  const routes: Record<PlatformRole, string> = {
    super_admin:      `/${locale}/admin/dashboard`,
    tenant_admin:     `/${locale}/workspace/dashboard`,
    embassy_admin:    `/${locale}/workspace/embassy`,
    consular_officer: `/${locale}/workspace/cases`,
    analyst:          `/${locale}/intelligence/dashboard`,
    executive_viewer: `/${locale}/executive/dashboard`,
    registrant:       `/${locale}/portal/dashboard`,
    economic_planner: `/${locale}/intelligence/economic`,
  }
  return routes[role]
}
```

---

## Deliverable 3 — Updated Middleware

Replace the Mission 002 middleware with the full three-layer version.

Update `middleware.ts` to enforce role-based routing using the RBAC permission map:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { ROUTE_PERMISSIONS } from './lib/rbac/roles'
import type { PlatformRole } from './lib/services/auth/auth.types'

const intlMiddleware = createIntlMiddleware(routing)

const PUBLIC_ROUTES = [
  '/auth/signin',
  '/auth/callback',
  '/auth/error',
]

const PROTECTED_PREFIXES = [
  '/admin',
  '/workspace',
  '/intelligence',
  '/executive',
  '/portal',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Strip locale prefix for route matching
  const pathnameWithoutLocale = pathname.replace(/^\/(en|fr)/, '') || '/'

  // Apply i18n middleware first
  const intlResponse = intlMiddleware(request)

  // If public route — pass through
  const isPublicRoute = PUBLIC_ROUTES.some(r => pathnameWithoutLocale.startsWith(r))
  const isProtectedRoute = PROTECTED_PREFIXES.some(p => pathnameWithoutLocale.startsWith(p))

  if (!isProtectedRoute) {
    return intlResponse
  }

  // Create Supabase server client for session check
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // No session — redirect to sign in
  if (!session) {
    const locale = pathname.startsWith('/fr') ? 'fr' : 'en'
    const signInUrl = new URL(`/${locale}/auth/signin`, request.url)
    signInUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Get user role from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active, tenant_id')
    .eq('id', session.user.id)
    .single()

  // No profile or inactive — sign out and redirect
  if (!profile || !profile.is_active) {
    const locale = pathname.startsWith('/fr') ? 'fr' : 'en'
    return NextResponse.redirect(new URL(`/${locale}/auth/signin`, request.url))
  }

  const userRole = profile.role as PlatformRole

  // Check route permission
  const matchedPrefix = PROTECTED_PREFIXES.find(p => pathnameWithoutLocale.startsWith(p))
  if (matchedPrefix) {
    const allowedRoles = ROUTE_PERMISSIONS[matchedPrefix]
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      // Role not permitted for this route — redirect to their correct workspace
      const locale = pathname.startsWith('/fr') ? 'fr' : 'en'
      const { getDefaultRoute } = await import('./lib/rbac/roles')
      return NextResponse.redirect(new URL(getDefaultRoute(userRole, locale), request.url))
    }
  }

  return intlResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
```

---

## Deliverable 4 — Tenant Service Layer

Create `/lib/services/tenants/tenant.service.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { PlatformRole } from '@/lib/services/auth/auth.types'

export interface CivisTenant {
  id: string
  name: string
  countryCode: string
  officialCountryName: string | null
  region: string | null
  deploymentTier: 'cloud' | 'government' | 'sovereign'
  status: 'active' | 'pilot' | 'suspended' | 'archived'
  defaultLanguage: string
  supportedLanguages: string[]
  dataResidencyRegion: string
  logoUrl: string | null
  createdAt: string
}

export interface CreateTenantInput {
  name: string
  countryCode: string
  officialCountryName?: string
  region?: string
  deploymentTier: 'cloud' | 'government' | 'sovereign'
  defaultLanguage: string
  dataResidencyRegion: string
  primaryContactEmail?: string
  contractStartDate?: string
}

// Get current user's tenant
export async function getCurrentTenant(): Promise<CivisTenant | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('civis_tenants')
    .select('*')
    .single()

  if (error || !data) return null
  return mapTenant(data)
}

// Get all tenants (super_admin only — RLS enforced)
export async function getAllTenants(): Promise<CivisTenant[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('civis_tenants')
    .select('*')
    .order('name')

  if (error || !data) return []
  return data.map(mapTenant)
}

// Create new tenant (super_admin only)
export async function createTenant(
  input: CreateTenantInput
): Promise<{ tenant: CivisTenant | null; error: string | null }> {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('civis_tenants')
    .insert({
      name: input.name,
      country_code: input.countryCode.toUpperCase(),
      official_country_name: input.officialCountryName,
      region: input.region,
      deployment_tier: input.deploymentTier,
      default_language: input.defaultLanguage,
      supported_languages: [input.defaultLanguage, 'en'].filter(
        (v, i, a) => a.indexOf(v) === i
      ),
      data_residency_region: input.dataResidencyRegion,
      primary_contact_email: input.primaryContactEmail,
      contract_start_date: input.contractStartDate,
      status: 'pilot',
    })
    .select()
    .single()

  if (error) return { tenant: null, error: error.message }

  // Create default tenant settings
  await admin.from('civis_tenant_settings').insert({ tenant_id: data.id })

  // Write audit log
  await admin.from('audit_logs').insert({
    user_role: 'super_admin',
    action: 'TENANT_CREATED',
    resource: 'civis_tenants',
    resource_id: data.id,
    metadata: { name: input.name, country_code: input.countryCode }
  })

  return { tenant: mapTenant(data), error: null }
}

function mapTenant(data: any): CivisTenant {
  return {
    id: data.id,
    name: data.name,
    countryCode: data.country_code,
    officialCountryName: data.official_country_name,
    region: data.region,
    deploymentTier: data.deployment_tier,
    status: data.status,
    defaultLanguage: data.default_language,
    supportedLanguages: data.supported_languages,
    dataResidencyRegion: data.data_residency_region,
    logoUrl: data.logo_url,
    createdAt: data.created_at,
  }
}
```

---

## Deliverable 5 — Super Admin Dashboard

Build `/app/[locale]/admin/dashboard/page.tsx` — the Afronovation super admin workspace. This is a real, functional screen — not a placeholder.

**Design:** Dark navy institutional — same design language as the sign-in page. Not a public marketing page. Command center aesthetic.

**Layout:**
```
[Left sidebar — fixed, 240px]
  CIVIS wordmark + "Admin" badge
  Navigation:
    Dashboard (active)
    Tenants
    Users  
    Audit Logs
    Settings
  [Bottom] Signed in as: admin@afronovation.com
  [Bottom] Sign Out

[Main content area]
  [Page header] Platform Administration
  [Sub-header] Afronovation, Inc. — Sovereign Intelligence Platform
  
  [Four KPI tiles — top row]
  [Tenants table — full width below]
```

**Four KPI tiles (real data from Supabase):**

| Tile | Value source | Label |
|---|---|---|
| Total Tenants | `COUNT(*) FROM civis_tenants` | Active Tenants |
| Total Users | `COUNT(*) FROM profiles` | Platform Users |
| Active Tenants | `COUNT(*) WHERE status = 'active'` | Live Deployments |
| Pilot Tenants | `COUNT(*) WHERE status = 'pilot'` | In Pilot |

**Tenants table (real data):**
Columns: Country, Tier (badge), Status (badge), Users, Created, Actions

For Mission 003, the only seeded tenant is Afronovation (platform). The table shows this one row with correct data from the database.

**Create Tenant modal** (accessible via "Add Tenant" button):
- Form fields: Country Name, Country Code, Region, Deployment Tier, Default Language, Data Residency Region, Primary Contact Email
- Submits via `createTenant()` service function
- Validates with Zod schema
- Refreshes table on success
- All text through translation keys

---

## Deliverable 6 — Tenant Admin Dashboard (Placeholder → Real)

Replace the Mission 002 placeholder at `/app/[locale]/workspace/dashboard/page.tsx` with a real functional shell.

For Mission 003, this shows:
- Correct welcome message with user's name and role
- Tenant information card (tenant name, country, tier, status) — pulled from `getCurrentTenant()`
- Three empty module cards linking to future missions:
  - Registry → `/workspace/registry` (Mission 004)
  - Embassies → `/workspace/embassy` (Mission 004)
  - Analytics → `/intelligence/dashboard` (Mission 005)
- "Platform coming soon" message on each card

This is a real authenticated, tenant-scoped page — not a placeholder. It reads live data from the database.

---

## Deliverable 7 — Role-Aware Navigation Shell

Create `components/workspace/WorkspaceSidebar.tsx` — the shared sidebar component for all workspace routes. Renders navigation items based on the current user's role.

```typescript
// Navigation items visible per role
const NAV_ITEMS = {
  super_admin: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: 'LayoutDashboard' },
    { label: 'Tenants', href: '/admin/tenants', icon: 'Globe' },
    { label: 'Users', href: '/admin/users', icon: 'Users' },
    { label: 'Audit Logs', href: '/admin/audit', icon: 'Shield' },
    { label: 'Settings', href: '/admin/settings', icon: 'Settings' },
  ],
  tenant_admin: [
    { label: 'Dashboard', href: '/workspace/dashboard', icon: 'LayoutDashboard' },
    { label: 'Registry', href: '/workspace/registry', icon: 'Users' },
    { label: 'Embassies', href: '/workspace/embassy', icon: 'Building2' },
    { label: 'Analytics', href: '/intelligence/dashboard', icon: 'BarChart3' },
    { label: 'Users', href: '/workspace/users', icon: 'UserCog' },
    { label: 'Settings', href: '/workspace/settings', icon: 'Settings' },
  ],
  embassy_admin: [
    { label: 'Embassy', href: '/workspace/embassy', icon: 'Building2' },
    { label: 'Registrants', href: '/workspace/registry', icon: 'Users' },
    { label: 'Cases', href: '/workspace/cases', icon: 'Folder' },
    { label: 'Reports', href: '/workspace/reports', icon: 'FileText' },
  ],
  consular_officer: [
    { label: 'My Cases', href: '/workspace/cases', icon: 'Folder' },
    { label: 'Registry', href: '/workspace/registry', icon: 'Users' },
    { label: 'Documents', href: '/workspace/documents', icon: 'FileText' },
  ],
  analyst: [
    { label: 'Intelligence', href: '/intelligence/dashboard', icon: 'BarChart3' },
    { label: 'Reports', href: '/intelligence/reports', icon: 'FileText' },
    { label: 'Export', href: '/intelligence/export', icon: 'Download' },
  ],
  executive_viewer: [
    { label: 'Executive View', href: '/executive/dashboard', icon: 'LayoutDashboard' },
  ],
  registrant: [
    { label: 'My Profile', href: '/portal/dashboard', icon: 'User' },
    { label: 'Documents', href: '/portal/documents', icon: 'FileText' },
    { label: 'Services', href: '/portal/services', icon: 'Briefcase' },
  ],
  economic_planner: [
    { label: 'Economic Intelligence', href: '/intelligence/economic', icon: 'TrendingUp' },
  ],
}
```

**Sidebar design:**
- Dark navy background (`#0D1B2E`)
- Gold accent on active item (left border + gold text)
- CIVIS wordmark at top with role badge below
- User email and sign-out at bottom
- Width: 240px fixed on desktop, collapsible on tablet, hidden on mobile (hamburger)
- Uses Lucide React icons throughout

---

## Deliverable 8 — Workspace Layout Shell

Create `app/[locale]/(workspace)/layout.tsx` — the shared layout for all authenticated workspace routes.

```typescript
// Route group (workspace) — applies to:
// /admin/*, /workspace/*, /intelligence/*, /executive/*, /portal/*

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/services/auth'
import WorkspaceSidebar from '@/components/workspace/WorkspaceSidebar'
import WorkspaceHeader from '@/components/workspace/WorkspaceHeader'

export default async function WorkspaceLayout({ children, params }) {
  const session = await getSession()
  
  if (!session) {
    redirect(`/${params.locale}/auth/signin`)
  }
  
  return (
    <div className="flex h-screen bg-[#0A1628] overflow-hidden">
      <WorkspaceSidebar user={session.user} locale={params.locale} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <WorkspaceHeader user={session.user} locale={params.locale} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

Create `components/workspace/WorkspaceHeader.tsx`:
- Top bar: 64px height, dark surface (`#111827`)
- Left: Page title (dynamic, set per page)
- Right: Notification bell (placeholder), user avatar/initials, role badge

---

## Deliverable 9 — Session Context Provider

Create `components/providers/SessionProvider.tsx` — makes session data available to client components without prop drilling.

```typescript
'use client'
import { createContext, useContext } from 'react'
import type { CivisUser } from '@/lib/services/auth/auth.types'

const SessionContext = createContext<CivisUser | null>(null)

export function SessionProvider({ 
  user, 
  children 
}: { 
  user: CivisUser | null
  children: React.ReactNode 
}) {
  return (
    <SessionContext.Provider value={user}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession(): CivisUser | null {
  return useContext(SessionContext)
}

export function useRequiredSession(): CivisUser {
  const user = useContext(SessionContext)
  if (!user) throw new Error('useRequiredSession called outside authenticated route')
  return user
}
```

Add `SessionProvider` to the workspace layout, wrapping `{children}`.

---

## Deliverable 10 — Sign Out Flow

Implement sign-out properly. Update the sign-out button in `WorkspaceSidebar`:

Create `/app/[locale]/auth/signout/route.ts` (Route Handler):

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function POST(request: Request, { params }) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  // Write audit log via admin client
  // (get user before signout in production)
  
  redirect(`/${params.locale}/auth/signin`)
}
```

Sign-out button in sidebar uses a form POST to this route handler — not a client-side function call. This ensures server-side session invalidation.

---

## Deliverable 11 — Translation Keys

Add all new workspace translation keys to `/messages/en.json` and `/messages/fr.json`:

```json
// en.json additions
{
  "workspace": {
    "nav": {
      "dashboard": "Dashboard",
      "registry": "Registry",
      "embassies": "Embassies",
      "analytics": "Analytics",
      "intelligence": "Intelligence",
      "cases": "Cases",
      "documents": "Documents",
      "users": "Users",
      "settings": "Settings",
      "audit_logs": "Audit Logs",
      "tenants": "Tenants",
      "reports": "Reports",
      "export": "Export",
      "sign_out": "Sign Out"
    },
    "admin": {
      "title": "Platform Administration",
      "subtitle": "Afronovation, Inc. — Sovereign Intelligence Platform",
      "total_tenants": "Active Tenants",
      "total_users": "Platform Users",
      "live_deployments": "Live Deployments",
      "in_pilot": "In Pilot",
      "add_tenant": "Add Tenant",
      "tenants_table_title": "Sovereign Tenants"
    },
    "common": {
      "welcome": "Welcome,",
      "role_label": "Role",
      "tenant_label": "Tenant",
      "coming_soon": "Coming in next mission",
      "loading": "Loading..."
    }
  },
  "auth": {
    "signin": {
      "title": "Platform Sign In",
      "subtitle": "Authorized government personnel only",
      "email_label": "Email Address",
      "password_label": "Password",
      "submit": "Sign In",
      "error_invalid": "Invalid email or password.",
      "error_inactive": "Your account has been deactivated. Contact your administrator.",
      "help_text": "Having trouble signing in? Contact your administrator.",
      "footer": "Civis — Afronovation, Inc. | Sovereign Intelligence Platform"
    }
  }
}
```

Add French equivalents in `fr.json` with institutional register throughout.

---

## Deliverable 12 — Commit & Push Mission 003

```bash
git add .
git commit -m "feat: Mission 003 — Tenant foundation, RBAC system, admin workspace

- Migration 002: civis_tenants, civis_tenant_settings, RLS, helper functions
- Afronovation platform tenant seeded, super admin profiles linked
- Three-layer RBAC: middleware + service layer + database RLS
- /lib/rbac/roles.ts: permission map, role hierarchy, default route resolver
- Tenant service layer: getCurrentTenant, getAllTenants, createTenant
- Super admin dashboard: KPI tiles, tenants table, create tenant modal (live data)
- Tenant admin workspace shell: authenticated, tenant-scoped, live data
- WorkspaceSidebar: role-aware navigation for all 8 platform roles
- WorkspaceLayout: shared authenticated layout with session context
- SessionProvider: useSession and useRequiredSession hooks
- Sign-out route handler: server-side session invalidation
- Full EN/FR translation coverage for workspace layer

Afronovation, Inc. — Civis Sovereign Intelligence Platform v0.3.0"

git push origin develop
```

---

## Success Criteria

- [ ] Migration 002 applied — `civis_tenants` and `civis_tenant_settings` tables visible in dashboard
- [ ] `deployment_tier` and `tenant_status` enums visible under Database → Types
- [ ] Helper functions visible: `current_user_tenant_id()`, `current_user_role()`, `user_has_role()`
- [ ] Afronovation platform tenant seeded and visible in `civis_tenants` table
- [ ] Super admin profiles have `tenant_id` pointing to Afronovation tenant
- [ ] Sign in with `admin@afronovation.com` → routes to `/en/admin/dashboard`
- [ ] Admin dashboard renders with live KPI data from Supabase
- [ ] "Add Tenant" modal opens, validates, and creates a tenant in Supabase
- [ ] Sign in with `tenantadmin@civisos.com` → routes to `/en/workspace/dashboard`
- [ ] Workspace dashboard shows correct tenant data for the signed-in user
- [ ] Sign in with `analyst@civisos.com` → routes to `/en/intelligence/dashboard`
- [ ] Sign in with `executiveviewer@civisos.com` → routes to `/en/executive/dashboard`
- [ ] Sign in with `registrant@civisos.com` → routes to `/en/portal/dashboard`
- [ ] Role mismatch redirect works — analyst cannot access `/workspace/dashboard`
- [ ] Unauthenticated access to any workspace route still redirects to sign in
- [ ] WorkspaceSidebar renders correct nav items per role — no cross-role leakage
- [ ] Sign out clears session and redirects to sign in
- [ ] Both EN and FR workspace routes function correctly
- [ ] RLS verified: `tenantadmin@civisos.com` cannot read `civis_tenants` rows belonging to other tenants
- [ ] No TypeScript errors in strict mode
- [ ] `next build` clean — all pages generated

---

## Security Verification (Required Before Sign-Off)

Run these RLS checks in Supabase SQL Editor:

```sql
-- Verify super admin can read all tenants
SELECT COUNT(*) FROM public.civis_tenants; -- Should return all rows

-- Verify tenant isolation on profiles (run as non-super-admin session)
-- This should only return profiles belonging to the signed-in user's tenant
SELECT COUNT(*) FROM public.profiles;

-- Verify audit log for tenant creation
SELECT action, resource, metadata, created_at 
FROM public.audit_logs 
WHERE action = 'TENANT_CREATED'
ORDER BY created_at DESC;
```

---

## Explicitly Out of Scope

- Embassy table and embassy workspace (Mission 004)
- Registrant table and registry (Mission 004)
- Intelligence dashboard real data (Mission 005)
- Dia AI integration (Mission 006)
- MFA enforcement (future mission)
- Password reset flow (future mission)
- Tenant onboarding wizard (future mission)

---

## Completion Sign-Off

When Mission 003 is complete, confirm before closing:

1. Migration applied and all tables/types/functions verified in dashboard
2. All 5 role-based sign-in routes tested (super_admin, tenant_admin, analyst, executive_viewer, registrant)
3. Role mismatch redirect tested
4. Admin dashboard shows live data
5. Workspace dashboard shows live tenant data
6. RLS security checks passed
7. Sign-out flow tested — session cleared, redirect confirmed
8. `next build` clean
9. Committed and pushed to develop
10. Ready to proceed to Mission 004 — Embassy Workspace & Registrant Registry

---

*Document location: `C:\Users\ikour\Projects\civis\Project Instructions\Mission_003_Tenant_RBAC.md`*  
*Program Owner: Afronovation, Inc.*  
*Classification: Internal — Build Team Only*  
*Depends on: Mission_002_Auth_User_Provisioning.md*