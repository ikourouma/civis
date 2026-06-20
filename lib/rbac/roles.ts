import type { PlatformRole } from '@/lib/services/auth/auth.types';

// Higher index = more privilege. Used for "minimum role" checks.
export const ROLE_HIERARCHY: Record<PlatformRole, number> = {
  registrant: 1,
  economic_planner: 2,
  executive_viewer: 3,
  analyst: 4,
  consular_officer: 5,
  embassy_admin: 6,
  tenant_admin: 7,
  super_admin: 8,
};

// Route prefix (without locale) → roles permitted to access.
// Layer 1 enforcement happens in middleware against this map.
export const ROUTE_PERMISSIONS: Record<string, PlatformRole[]> = {
  '/admin': ['super_admin'],
  '/workspace': ['tenant_admin', 'embassy_admin', 'consular_officer', 'super_admin'],
  '/intelligence': ['analyst', 'executive_viewer', 'tenant_admin', 'super_admin', 'economic_planner'],
  '/executive': ['executive_viewer', 'tenant_admin', 'super_admin'],
  '/portal': ['registrant', 'super_admin'],
};

// Finer-grained workspace sub-route permissions for service-layer guards.
export const WORKSPACE_PERMISSIONS: Record<string, PlatformRole[]> = {
  dashboard: ['tenant_admin', 'embassy_admin', 'super_admin'],
  embassy: ['tenant_admin', 'embassy_admin', 'super_admin'],
  cases: ['consular_officer', 'embassy_admin', 'tenant_admin', 'super_admin'],
  registry: ['consular_officer', 'embassy_admin', 'tenant_admin', 'super_admin'],
  users: ['tenant_admin', 'super_admin'],
  settings: ['tenant_admin', 'super_admin'],
};

export function hasPermission(userRole: PlatformRole, allowedRoles: PlatformRole[]): boolean {
  return allowedRoles.includes(userRole);
}

export function hasMinimumRole(userRole: PlatformRole, minimumRole: PlatformRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}

// Where the user lands after sign-in, and where role-mismatch redirects send them.
export function getDefaultRoute(role: PlatformRole, locale: string): string {
  const routes: Record<PlatformRole, string> = {
    super_admin: `/${locale}/admin/dashboard`,
    tenant_admin: `/${locale}/workspace/dashboard`,
    embassy_admin: `/${locale}/workspace/embassy`,
    consular_officer: `/${locale}/workspace/cases`,
    analyst: `/${locale}/intelligence/dashboard`,
    executive_viewer: `/${locale}/executive/dashboard`,
    registrant: `/${locale}/portal/dashboard`,
    economic_planner: `/${locale}/intelligence/dashboard`,
  };
  return routes[role];
}

// Public path prefixes that override protection (citizen-facing, pre-auth).
// The two-phase registration flow must be reachable without a session.
const PUBLIC_PREFIXES = ['/portal/register'];

// Country-branded portal entry points (/portal/lr, /portal/gn …) are public,
// pre-auth pages. They are a 2-letter country-code segment under /portal.
const BRANDED_PORTAL_RE = /^\/portal\/[a-z]{2}\/?$/i;

// Match a pathname (without locale) against the route permission map.
// Returns the longest matching prefix or null. Public prefixes return null.
export function getProtectedPrefix(pathnameWithoutLocale: string): string | null {
  if (PUBLIC_PREFIXES.some((p) => pathnameWithoutLocale.startsWith(p))) return null;
  if (BRANDED_PORTAL_RE.test(pathnameWithoutLocale)) return null;
  const prefixes = Object.keys(ROUTE_PERMISSIONS).sort((a, b) => b.length - a.length);
  return prefixes.find((p) => pathnameWithoutLocale.startsWith(p)) ?? null;
}
