import { ArrowUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { NewsletterForm } from '@/components/marketing/NewsletterForm';
import { Link } from '@/i18n/navigation';

const PLATFORM_LINKS = [
  { href: '/platform/diaspora-registry', key: 'registry' },
  { href: '/platform/embassy-intelligence', key: 'embassy' },
  { href: '/platform/sovereign-analytics', key: 'analytics' },
  { href: '/platform/dia-ai', key: 'dia' },
  { href: '/security', key: 'security' },
] as const;

const RESOURCE_LINKS = [
  { href: '/resources/documentation', key: 'documentation' },
  { href: '/resources/security-whitepaper', key: 'whitepaper' },
  { href: '/resources/api-reference', key: 'api' },
  { href: '/resources/changelog', key: 'changelog' },
  { href: '/resources/status', key: 'status' },
] as const;

const LEGAL_LINKS = [
  { href: '/legal#privacy-policy', key: 'privacy' },
  { href: '/legal#terms-of-service', key: 'terms' },
  { href: '/legal#data-processing-agreement', key: 'dpa' },
  { href: '/legal#cookie-policy', key: 'cookies' },
  { href: '/legal#compliance', key: 'compliance' },
] as const;

const COMPANY_LINKS = [
  { href: '/about', key: 'about' },
  { href: '/contact', key: 'contact' },
] as const;

function FooterColumn({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <nav aria-label={heading}>
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gold">{heading}</h2>
      {children}
    </nav>
  );
}

export function Footer() {
  const t = useTranslations('Footer');
  const year = new Date().getFullYear();

  const linkClass = 'text-sm text-surface/80 transition-colors hover:text-gold';

  return (
    <footer className="border-t-2 border-gold bg-navy-deep text-surface">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-16 md:grid-cols-2 lg:grid-cols-4">
        <FooterColumn heading={t('platformColumn')}>
          <ul className="space-y-2">
            {PLATFORM_LINKS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass}>
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </FooterColumn>

        <FooterColumn heading={t('resourcesColumn')}>
          <ul className="space-y-2">
            {RESOURCE_LINKS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass}>
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </FooterColumn>

        <FooterColumn heading={t('legalColumn')}>
          <ul className="space-y-2">
            {LEGAL_LINKS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass}>
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </FooterColumn>

        <div className="space-y-8">
          <FooterColumn heading={t('companyColumn')}>
            <ul className="space-y-2">
              {COMPANY_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkClass}>
                    {t(item.key)}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="https://afronovation.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${linkClass} inline-flex items-center gap-1`}
                >
                  {t('afronovation')}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </li>
            </ul>
          </FooterColumn>
          <NewsletterForm />
        </div>
      </div>

      <div className="border-t border-surface/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-6 text-xs text-surface/60 md:flex-row md:items-center md:justify-between">
          <p>
            <span className="font-bold tracking-[0.2em] text-white">
              {t('brandName')}
              <span className="text-gold">.</span>
            </span>
            <span className="ml-3">{t('copyright', { year })}</span>
          </p>
          <p>{t('attribution')}</p>
        </div>
      </div>
    </footer>
  );
}
