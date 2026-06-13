'use client';

import { useLocale, useTranslations } from 'next-intl';

import { Link, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { cn } from '@/lib/utils';

// Text-only EN | FR toggle — no flags (Doc 07 §19: flags create geopolitical
// ambiguity in sovereign government contexts). Each option links to the same
// pathname in the other locale; the next-intl middleware persists the
// selection via the NEXT_LOCALE cookie on every locale-prefixed visit.
export function LanguageToggle() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('Header');

  return (
    <nav className="flex items-center gap-1 text-sm font-medium" aria-label={t('languageToggleLabel')}>
      {routing.locales.map((value, index) => (
        <span key={value} className="flex items-center">
          {index > 0 && (
            <span className="mx-1 text-surface/40" aria-hidden="true">
              |
            </span>
          )}
          <Link
            href={pathname}
            locale={value}
            aria-current={locale === value ? 'true' : undefined}
            aria-label={t(value === 'en' ? 'languageEnglish' : 'languageFrench')}
            className={cn(
              'rounded-sm px-1.5 py-0.5 uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
              locale === value ? 'text-gold' : 'text-surface/70 hover:text-surface',
            )}
          >
            {value}
          </Link>
        </span>
      ))}
    </nav>
  );
}
