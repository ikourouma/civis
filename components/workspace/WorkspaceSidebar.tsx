'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  FileText,
  Folder,
  Globe,
  LayoutDashboard,
  type LucideIcon,
  LogOut,
  Palette,
  Settings,
  Shield,
  ShieldCheck,
  ToggleRight,
  TrendingUp,
  User,
  UserCog,
  UserPlus,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

import { Link } from '@/i18n/navigation';
import { useEntitlement } from '@/components/providers/EntitlementProvider';
import type { CapabilityCode } from '@/lib/entitlements/capabilities';
import { getSuggestionCounts } from '@/lib/services/admin/reference-management.service';
import { getMyCompleteness } from '@/lib/services/documents/document.actions';
import type { CivisUser, PlatformRole } from '@/lib/services/auth/auth.types';
import { cn } from '@/lib/utils';

type NavKey =
  | 'dashboard'
  | 'tenants'
  | 'users'
  | 'audit_logs'
  | 'settings'
  | 'registry'
  | 'embassies'
  | 'analytics'
  | 'intelligence'
  | 'cases'
  | 'documents'
  | 'reports'
  | 'export'
  | 'services'
  | 'profile'
  | 'reference_data'
  | 'branding'
  | 'complete_profile'
  | 'privacy'
  | 'staff'
  | 'gdpr'
  | 'audit'
  | 'entitlements';

interface NavItem {
  key: NavKey;
  href: string;
  Icon: LucideIcon;
  // When set, the item is shown only if the tenant entitles this capability.
  capability?: CapabilityCode;
}

const NAV_ITEMS: Record<PlatformRole, NavItem[]> = {
  super_admin: [
    { key: 'dashboard', href: '/admin/dashboard', Icon: LayoutDashboard },
    { key: 'tenants', href: '/admin/tenants', Icon: Globe },
    { key: 'users', href: '/admin/users', Icon: Users },
    { key: 'reference_data', href: '/admin/reference-data', Icon: Database },
    { key: 'branding', href: '/admin/branding', Icon: Palette },
    { key: 'entitlements', href: '/admin/entitlements', Icon: ToggleRight },
    { key: 'audit_logs', href: '/admin/audit', Icon: Shield },
    { key: 'settings', href: '/admin/settings', Icon: Settings },
  ],
  tenant_admin: [
    { key: 'dashboard', href: '/workspace/dashboard', Icon: LayoutDashboard },
    { key: 'registry', href: '/workspace/registry', Icon: Users, capability: 'REGISTRY_VIEW_LIST' },
    { key: 'embassies', href: '/workspace/embassy/manage', Icon: Building2, capability: 'EMBASSY_CREATE' },
    { key: 'staff', href: '/workspace/users', Icon: UserCog, capability: 'STAFF_PROVISION' },
    { key: 'gdpr', href: '/workspace/gdpr', Icon: ShieldCheck, capability: 'GDPR_PROCESS_REQUESTS' },
    { key: 'analytics', href: '/intelligence/dashboard', Icon: BarChart3, capability: 'INTELLIGENCE_DASHBOARD' },
    { key: 'audit', href: '/workspace/audit', Icon: Shield, capability: 'AUDIT_VIEW_TENANT' },
    { key: 'branding', href: '/workspace/branding', Icon: Palette },
    { key: 'settings', href: '/workspace/settings', Icon: Settings, capability: 'SETTINGS_VIEW' },
  ],
  embassy_admin: [
    { key: 'embassies', href: '/workspace/embassy', Icon: Building2 },
    { key: 'registry', href: '/workspace/registry', Icon: Users, capability: 'REGISTRY_VIEW_LIST' },
    { key: 'cases', href: '/workspace/cases', Icon: Folder },
    { key: 'staff', href: '/workspace/embassy/staff', Icon: UserCog, capability: 'EMBASSY_VIEW_STAFF' },
    { key: 'audit', href: '/workspace/audit', Icon: Shield, capability: 'AUDIT_VIEW_EMBASSY' },
    { key: 'reports', href: '/workspace/reports', Icon: FileText },
  ],
  consular_officer: [
    { key: 'cases', href: '/workspace/cases', Icon: Folder },
    { key: 'registry', href: '/workspace/registry', Icon: Users, capability: 'REGISTRY_VIEW_LIST' },
    { key: 'documents', href: '/workspace/documents', Icon: FileText, capability: 'REGISTRANT_VIEW_DOCUMENTS' },
  ],
  analyst: [
    { key: 'intelligence', href: '/intelligence/dashboard', Icon: BarChart3, capability: 'INTELLIGENCE_DASHBOARD' },
    { key: 'reports', href: '/intelligence/reports', Icon: FileText, capability: 'INTELLIGENCE_REPORTS' },
    { key: 'export', href: '/intelligence/export', Icon: Download, capability: 'INTELLIGENCE_EXPORT' },
  ],
  executive_viewer: [
    { key: 'dashboard', href: '/executive/dashboard', Icon: LayoutDashboard },
  ],
  registrant: [
    { key: 'dashboard', href: '/portal/dashboard', Icon: LayoutDashboard },
    { key: 'complete_profile', href: '/portal/profile/complete', Icon: UserPlus },
    { key: 'documents', href: '/portal/documents', Icon: FileText },
    { key: 'profile', href: '/portal/profile', Icon: User },
    { key: 'privacy', href: '/portal/privacy', Icon: Shield },
    { key: 'settings', href: '/portal/settings', Icon: Settings },
  ],
  economic_planner: [
    { key: 'intelligence', href: '/intelligence/dashboard', Icon: TrendingUp },
  ],
};

const ROLE_BADGE_LABEL: Record<PlatformRole, string> = {
  super_admin: 'Admin',
  tenant_admin: 'Tenant',
  embassy_admin: 'Embassy',
  consular_officer: 'Consular',
  analyst: 'Analyst',
  executive_viewer: 'Executive',
  registrant: 'Portal',
  economic_planner: 'Economic',
};

export function WorkspaceSidebar({ user, locale }: { user: CivisUser; locale: string }) {
  const t = useTranslations('Workspace.nav');
  const pathname = usePathname();
  const { hasCapability } = useEntitlement();
  // Items without a `capability` are always visible; gated items are hidden
  // unless the tenant has the capability enabled (super_admin always passes).
  const items = NAV_ITEMS[user.role].filter(
    (item) => !item.capability || hasCapability(item.capability),
  );
  const [collapsed, setCollapsed] = useState(false);
  const [pendingSuggestions, setPendingSuggestions] = useState(0);
  const [completeness, setCompleteness] = useState<number | null>(null);

  // Super admins see a live count of reference-data suggestions awaiting review.
  useEffect(() => {
    if (user.role !== 'super_admin') return;
    let active = true;
    getSuggestionCounts().then(({ pending }) => {
      if (active) setPendingSuggestions(pending);
    });
    return () => {
      active = false;
    };
  }, [user.role]);

  // Registrants see their profile completeness on the "Complete Profile" item.
  useEffect(() => {
    if (user.role !== 'registrant') return;
    let active = true;
    getMyCompleteness().then((score) => {
      if (active) setCompleteness(score);
    });
    return () => {
      active = false;
    };
  }, [user.role]);

  return (
    <aside
      className={cn(
        'hidden h-screen shrink-0 flex-col border-r border-white/5 bg-navy-deepest transition-[width] duration-300 ease-in-out lg:flex',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Brand row + collapse toggle */}
      <div
        className={cn(
          'flex items-center py-5',
          collapsed ? 'flex-col gap-3 px-3' : 'gap-2 px-4',
        )}
      >
        {collapsed ? (
          <Link href="/" title="CIVIS Platform">
            <span className="text-base font-bold tracking-[0.2em] text-white">
              C<span className="text-gold">.</span>
            </span>
          </Link>
        ) : (
          <Link href="/" className="flex min-w-0 flex-1 items-center gap-2">
            <span className="whitespace-nowrap text-lg font-bold tracking-[0.2em] text-white">
              CIVIS<span className="text-gold">.</span>
            </span>
            <span className="inline-flex shrink-0 rounded bg-gold/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gold">
              {ROLE_BADGE_LABEL[user.role]}
            </span>
          </Link>
        )}

        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-surface/40 transition-colors hover:bg-white/[0.06] hover:text-surface"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2" aria-label="Workspace navigation">
        <ul className="space-y-0.5">
          {items.map(({ key, href, Icon }) => {
            const localizedHref = `/${locale}${href}`;
            const active = pathname.startsWith(localizedHref);
            return (
              <li key={href}>
                <Link
                  href={href}
                  title={collapsed ? t(key) : undefined}
                  className={cn(
                    'group relative flex items-center rounded-md px-3 py-2 text-sm transition-colors',
                    collapsed ? 'justify-center' : 'gap-3',
                    active
                      ? 'bg-gold/10 text-gold'
                      : 'text-surface/70 hover:bg-white/[0.04] hover:text-white',
                  )}
                >
                  {active && !collapsed && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-gold"
                    />
                  )}
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {!collapsed && <span className="flex-1">{t(key)}</span>}
                  {key === 'reference_data' && pendingSuggestions > 0 && (
                    <span
                      className={cn(
                        'inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-navy-deepest',
                        collapsed && 'absolute right-1 top-1',
                      )}
                    >
                      {pendingSuggestions}
                    </span>
                  )}
                  {key === 'complete_profile' &&
                    !collapsed &&
                    completeness !== null &&
                    completeness < 100 && (
                      <span className="inline-flex items-center justify-center rounded-full bg-gold px-1.5 text-[9px] font-bold text-navy-deepest">
                        {completeness}%
                      </span>
                    )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User block + sign out */}
      <div className="border-t border-white/5 px-2 py-4">
        {!collapsed && (
          <div className="px-3 pb-3">
            <p className="truncate text-xs font-medium text-white">
              {user.fullName ?? user.email}
            </p>
            <p className="truncate text-[10px] text-surface/50">{user.email}</p>
          </div>
        )}
        <form action={`/${locale}/auth/signout`} method="post">
          <button
            type="submit"
            title={collapsed ? t('sign_out') : undefined}
            className={cn(
              'flex w-full items-center rounded-md px-3 py-2 text-sm text-surface/70 transition-colors hover:bg-white/[0.04] hover:text-gold',
              collapsed ? 'justify-center' : 'gap-3',
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            {!collapsed && t('sign_out')}
          </button>
        </form>
      </div>
    </aside>
  );
}
