'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { LanguageToggle } from '@/components/layout/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

const PLATFORM_ITEMS = [
  { href: '/platform/diaspora-registry', key: 'registry' },
  { href: '/platform/embassy-intelligence', key: 'embassy' },
  { href: '/platform/sovereign-analytics', key: 'analytics' },
  { href: '/platform/dia-ai', key: 'dia' },
] as const;

const RESOURCE_ITEMS = [
  { href: '/resources/documentation', key: 'documentation' },
  { href: '/resources/security-whitepaper', key: 'whitepaper' },
  { href: '/resources/api-reference', key: 'api' },
  { href: '/resources/changelog', key: 'changelog' },
  { href: '/resources/status', key: 'status' },
] as const;

const DIRECT_ITEMS = [
  { href: '/solutions', key: 'solutions' },
  { href: '/security', key: 'security' },
  { href: '/deployment', key: 'deployment' },
] as const;

interface DropdownItem {
  href: string;
  label: string;
}

function NavDropdown({
  label,
  hubHref,
  hubLabel,
  items,
  active,
}: {
  label: string;
  hubHref: string;
  hubLabel: string;
  items: DropdownItem[];
  active: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the panel whenever navigation occurs.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'flex items-center gap-1 py-5 text-sm font-medium transition-colors hover:text-gold focus-visible:outline-none focus-visible:text-gold',
          active || open ? 'text-gold' : 'text-surface/80',
        )}
      >
        {label}
        <ChevronDown
          className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="absolute left-0 top-full w-72">
          <ul className="rounded-b-md border border-t-0 border-gold/20 bg-navy-deepest py-2 shadow-2xl">
            <li>
              <Link
                href={hubHref}
                className="block px-4 py-2.5 text-sm font-semibold text-gold transition-colors hover:bg-navy-deep"
              >
                {hubLabel}
              </Link>
            </li>
            <li aria-hidden="true" className="mx-4 my-1 border-t border-surface/10" />
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block px-4 py-2.5 text-sm text-surface/80 transition-colors hover:bg-navy-deep hover:text-gold"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const t = useTranslations('Header');
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const platformItems = PLATFORM_ITEMS.map(({ href, key }) => ({
    href,
    label: t(`platformMenu.${key}`),
  }));
  const resourceItems = RESOURCE_ITEMS.map(({ href, key }) => ({
    href,
    label: t(`resourcesMenu.${key}`),
  }));

  return (
    <header className="sticky top-0 z-50 border-b border-gold/30 bg-navy-deep px-6 text-surface">
      {/* Same container pattern as SectionWrapper (outer px-6, inner max-w-6xl)
          so nav edges sit flush with page body content. */}
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6">
        <Link href="/" className="flex items-baseline gap-3">
          <span className="text-xl font-bold tracking-[0.2em] text-white">
            {t('brandName')}
            <span className="text-gold">.</span>
          </span>
          <span className="hidden whitespace-nowrap text-xs font-medium tracking-wide text-surface/70 xl:inline">
            {t('brandTagline')}
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label={t('navLabel')}>
          <NavDropdown
            label={t('platform')}
            hubHref="/platform"
            hubLabel={t('platformMenu.overview')}
            items={platformItems}
            active={pathname.startsWith('/platform')}
          />
          {DIRECT_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-gold',
                pathname === item.href ? 'text-gold' : 'text-surface/80',
              )}
            >
              {t(item.key)}
            </Link>
          ))}
          <NavDropdown
            label={t('resources')}
            hubHref="/resources"
            hubLabel={t('resourcesMenu.overview')}
            items={resourceItems}
            active={pathname.startsWith('/resources')}
          />
        </nav>

        <div className="flex items-center gap-3">
          <LanguageToggle />
          {/* Sign-in is a placeholder until Mission 002 delivers authentication */}
          <Button
            variant="ghost"
            size="sm"
            disabled
            title={t('signInNote')}
            className="hidden text-surface/60 hover:bg-transparent lg:inline-flex"
          >
            {t('signIn')}
          </Button>
          <Button asChild variant="gold" size="sm" className="hidden lg:inline-flex">
            <Link href="/contact">{t('requestBriefing')}</Link>
          </Button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-surface hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? t('closeMenu') : t('openMenu')}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          className="-mx-6 max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-gold/20 bg-navy-deep px-6 py-4 lg:hidden"
          aria-label={t('navLabel')}
        >
          <ul className="flex flex-col gap-1">
            <li className="px-3 pt-2 text-xs font-semibold uppercase tracking-widest text-gold">
              {t('platform')}
            </li>
            <li>
              <Link
                href="/platform"
                className="block rounded-md px-3 py-2 text-sm font-medium text-surface/80 transition-colors hover:bg-navy hover:text-gold"
              >
                {t('platformMenu.overview')}
              </Link>
            </li>
            {platformItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-sm font-medium text-surface/80 transition-colors hover:bg-navy hover:text-gold"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {DIRECT_ITEMS.map((item) => (
              <li key={item.href} className="border-t border-surface/10 first-of-type:border-0">
                <Link
                  href={item.href}
                  className={cn(
                    'block rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-navy hover:text-gold',
                    pathname === item.href ? 'text-gold' : 'text-surface/80',
                  )}
                >
                  {t(item.key)}
                </Link>
              </li>
            ))}
            <li className="px-3 pt-4 text-xs font-semibold uppercase tracking-widest text-gold">
              {t('resources')}
            </li>
            <li>
              <Link
                href="/resources"
                className="block rounded-md px-3 py-2 text-sm font-medium text-surface/80 transition-colors hover:bg-navy hover:text-gold"
              >
                {t('resourcesMenu.overview')}
              </Link>
            </li>
            {resourceItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-sm font-medium text-surface/80 transition-colors hover:bg-navy hover:text-gold"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="mt-4">
              <Button asChild variant="gold" size="sm" className="w-full">
                <Link href="/contact">{t('requestBriefing')}</Link>
              </Button>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
