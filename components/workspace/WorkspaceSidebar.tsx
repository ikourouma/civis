'use client';

import {
  BarChart3,
  Briefcase,
  Building2,
  Download,
  FileText,
  Folder,
  Globe,
  LayoutDashboard,
  type LucideIcon,
  LogOut,
  Settings,
  Shield,
  TrendingUp,
  User,
  UserCog,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

import { Link } from '@/i18n/navigation';
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
  | 'profile';

interface NavItem {
  key: NavKey;
  href: string;
  Icon: LucideIcon;
}

const NAV_ITEMS: Record<PlatformRole, NavItem[]> = {
  super_admin: [
    { key: 'dashboard', href: '/admin/dashboard', Icon: LayoutDashboard },
    { key: 'tenants', href: '/admin/tenants', Icon: Globe },
    { key: 'users', href: '/admin/users', Icon: Users },
    { key: 'audit_logs', href: '/admin/audit', Icon: Shield },
    { key: 'settings', href: '/admin/settings', Icon: Settings },
  ],
  tenant_admin: [
    { key: 'dashboard', href: '/workspace/dashboard', Icon: LayoutDashboard },
    { key: 'registry', href: '/workspace/registry', Icon: Users },
    { key: 'embassies', href: '/workspace/embassy', Icon: Building2 },
    { key: 'analytics', href: '/intelligence/dashboard', Icon: BarChart3 },
    { key: 'users', href: '/workspace/users', Icon: UserCog },
    { key: 'settings', href: '/workspace/settings', Icon: Settings },
  ],
  embassy_admin: [
    { key: 'embassies', href: '/workspace/embassy', Icon: Building2 },
    { key: 'registry', href: '/workspace/registry', Icon: Users },
    { key: 'cases', href: '/workspace/cases', Icon: Folder },
    { key: 'reports', href: '/workspace/reports', Icon: FileText },
  ],
  consular_officer: [
    { key: 'cases', href: '/workspace/cases', Icon: Folder },
    { key: 'registry', href: '/workspace/registry', Icon: Users },
    { key: 'documents', href: '/workspace/documents', Icon: FileText },
  ],
  analyst: [
    { key: 'intelligence', href: '/intelligence/dashboard', Icon: BarChart3 },
    { key: 'reports', href: '/intelligence/reports', Icon: FileText },
    { key: 'export', href: '/intelligence/export', Icon: Download },
  ],
  executive_viewer: [
    { key: 'dashboard', href: '/executive/dashboard', Icon: LayoutDashboard },
  ],
  registrant: [
    { key: 'profile', href: '/portal/dashboard', Icon: User },
    { key: 'documents', href: '/portal/documents', Icon: FileText },
    { key: 'services', href: '/portal/services', Icon: Briefcase },
  ],
  economic_planner: [
    { key: 'intelligence', href: '/intelligence/dashboard', Icon: TrendingUp },
  ],
};

const ROLE_BADGE_LABEL: Record<PlatformRole, string> = {
  super_admin: 'Admin',
  tenant_admin: 'Tenant Admin',
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
  const items = NAV_ITEMS[user.role];

  return (
    <aside className="hidden h-screen w-60 shrink-0 flex-col border-r border-white/5 bg-navy-deepest lg:flex">
      {/* Brand */}
      <div className="px-6 py-6">
        <Link href="/" className="block">
          <p className="text-lg font-bold tracking-[0.2em] text-white">
            CIVIS<span className="text-gold">.</span>
          </p>
        </Link>
        <p className="mt-1 inline-flex rounded bg-gold/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gold">
          {ROLE_BADGE_LABEL[user.role]}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3" aria-label="Workspace navigation">
        <ul className="space-y-0.5">
          {items.map(({ key, href, Icon }) => {
            const localizedHref = `/${locale}${href}`;
            const active = pathname.startsWith(localizedHref);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-gold/10 text-gold'
                      : 'text-surface/70 hover:bg-white/[0.04] hover:text-white',
                  )}
                >
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-gold"
                    />
                  )}
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{t(key)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User block + sign out */}
      <div className="border-t border-white/5 px-3 py-4">
        <div className="px-3 pb-3">
          <p className="truncate text-xs font-medium text-white">
            {user.fullName ?? user.email}
          </p>
          <p className="truncate text-[10px] text-surface/50">{user.email}</p>
        </div>
        <form action={`/${locale}/auth/signout`} method="post">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-surface/70 transition-colors hover:bg-white/[0.04] hover:text-gold"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {t('sign_out')}
          </button>
        </form>
      </div>
    </aside>
  );
}
