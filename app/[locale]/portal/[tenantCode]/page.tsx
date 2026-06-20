import type { Metadata } from 'next';
import { Check, Globe, ShieldCheck, Zap } from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { PortalAuthPanel } from '@/components/portal/PortalAuthPanel';
import { PortalCarousel, type CarouselSlide } from '@/components/portal/PortalCarousel';
import { getPortalConfig, getPortalRegistrantCount } from '@/lib/services/portal/portal.service';
import { getPortalMessages } from '@/lib/services/portal/portal-messages.service';

interface PageProps {
  params: { locale: string; tenantCode: string };
}

const SITE = 'https://civisos.com';

// ── Dynamic per-tenant SEO metadata ──
export async function generateMetadata({ params: { locale, tenantCode } }: PageProps): Promise<Metadata> {
  const config = await getPortalConfig(tenantCode);
  if (!config) return { title: 'Civis — Portal Not Found', robots: { index: false, follow: false } };

  const { tenant } = config;
  const name = tenant.officialName || tenant.name;
  const seal = config.brand?.assets.sealUrl;
  const url = `${SITE}/portal/${tenantCode}`;

  return {
    title: `Register with ${name} — Diaspora Registration Portal`,
    description: `Official diaspora registration portal for ${name}. Register as a citizen abroad, access consular services, and stay connected with your government. Powered by CivisOS sovereign intelligence platform.`,
    keywords: [
      `${tenant.name} diaspora registration`,
      `${tenant.name} embassy registration`,
      `${tenant.name} citizens abroad`,
      'diaspora registration',
      'consular services',
      'sovereign data platform',
      'African diaspora',
      'citizen registration abroad',
      `${tenant.name} diaspora`,
      'CivisOS',
    ],
    openGraph: {
      title: `${name} — Diaspora Registration Portal`,
      description: `Register with ${name}. Access consular services and diaspora programs from anywhere in the world.`,
      type: 'website',
      locale: tenant.defaultLanguage === 'fr' ? 'fr_FR' : 'en_US',
      siteName: 'CivisOS — Sovereign Intelligence Platform',
      url,
      images: [{ url: seal || '/og-default.png', width: 1200, height: 630, alt: `${tenant.name} Official Portal` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Register with ${tenant.name} — Diaspora Portal`,
      description: `Official diaspora registration for ${tenant.name} citizens abroad.`,
    },
    robots: { index: true, follow: true },
    alternates: {
      canonical: `${SITE}/portal/${tenantCode}`,
      languages: {
        en: `/en/portal/${tenantCode}`,
        fr: `/fr/portal/${tenantCode}`,
      },
    },
  };
}

export default async function BrandedPortalPage({ params: { locale, tenantCode } }: PageProps) {
  setRequestLocale(locale);
  const lang = locale as 'en' | 'fr';

  const config = await getPortalConfig(tenantCode);

  if (!config) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-navy-deepest px-6 text-center">
        <div className="max-w-md">
          <Globe className="mx-auto mb-4 h-10 w-10 text-surface/30" />
          <h1 className="text-xl font-bold text-white">Portal not available</h1>
          <p className="mt-2 text-sm text-surface/60">
            This portal is not currently active. Contact your government&apos;s diaspora office or visit{' '}
            <a href="https://civisos.com" className="text-gold hover:underline">civisos.com</a> for more information.
          </p>
        </div>
      </main>
    );
  }

  const { tenant, brand, tier } = config;
  const displayName = brand?.displayName[lang] ?? brand?.displayName.en ?? tenant.name;
  const officialName = brand?.officialName?.[lang] ?? brand?.officialName?.en ?? tenant.officialName ?? displayName;
  const primary = brand?.palette.primary ?? '#C9A84C';
  const seal = brand?.assets.sealUrl;

  const [messages, registrantCount] = await Promise.all([
    getPortalMessages(tenant.id, lang),
    getPortalRegistrantCount(tenant.id),
  ]);

  // Fall back to a single default slide when no messages are configured.
  const slides: CarouselSlide[] = messages.length > 0
    ? messages
    : [{
        id: 'default',
        headline: lang === 'fr'
          ? `Inscrivez-vous auprès de ${displayName} et accédez aux services souverains de la diaspora.`
          : `Register with ${displayName} and access sovereign diaspora services.`,
        subtitle: lang === 'fr'
          ? 'Vos données sont protégées sous une infrastructure souveraine.'
          : 'Your data is protected under sovereign infrastructure.',
      }];

  const countLabel = lang === 'fr' ? 'citoyens déjà inscrits' : 'citizens already registered';

  // Tier-dependent attribution (D006-D rules).
  const attributionSovereign = tier === 'sovereign';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name: `${officialName} Diaspora Registration`,
    description: `Official diaspora registration portal for citizens of ${tenant.name} living abroad.`,
    provider: { '@type': 'GovernmentOrganization', name: officialName, url: `${SITE}/portal/${tenantCode}` },
    areaServed: { '@type': 'Country', name: tenant.name },
    serviceType: 'Citizen Registration',
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: `${SITE}/portal/${tenantCode}`,
      serviceLanguage: tenant.supportedLanguages.map((l) => (l === 'fr' ? 'French' : 'English')),
    },
    isRelatedTo: { '@type': 'WebApplication', name: 'CivisOS', url: SITE, applicationCategory: 'GovernmentApplication' },
  };

  const trustCards = [
    { Icon: ShieldCheck, title: lang === 'fr' ? 'Protection souveraine' : 'Sovereign Data Protection', text: lang === 'fr' ? 'Votre gouvernement contrôle vos données' : 'Your government controls your data' },
    { Icon: Check, title: lang === 'fr' ? 'Consentement d’abord' : 'Consent-First', text: lang === 'fr' ? 'Vous décidez quoi partager' : 'You decide what to share' },
    { Icon: Globe, title: lang === 'fr' ? 'Accès mondial' : 'Global Access', text: lang === 'fr' ? 'Inscrivez-vous de partout' : 'Register from anywhere in the world' },
    { Icon: Zap, title: lang === 'fr' ? 'Inscription en 2 min' : '2-Minute Registration', text: lang === 'fr' ? 'Profil de base en moins de 2 minutes' : 'Complete your basic profile in under 2 minutes' },
  ];

  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* JSON-LD structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {seal && <link rel="preload" as="image" href={seal} />}

      {/* Left — branding (50%). Renders BELOW the form on mobile. */}
      <header className="relative order-2 flex flex-col justify-between overflow-hidden bg-navy-deepest p-8 lg:order-1 lg:p-12">
        {/* Background layers */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.05),_transparent_70%)]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:radial-gradient(rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:22px_22px]" />
        {seal && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={seal} alt="" aria-hidden="true" loading="lazy" className="pointer-events-none absolute left-1/2 top-1/2 h-[120%] -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.04]" />
        )}

        {/* Top: wordmark + seal/name */}
        <div className="relative">
          <Link href="/" className="text-base font-bold tracking-[0.2em] text-white">CIVIS<span style={{ color: primary }}>.</span></Link>
          <div className="mt-8 flex items-center gap-4">
            {seal && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={seal} alt={`${officialName} seal`} width={64} height={64} className="h-16 w-16 shrink-0 object-contain" />
            )}
            <div>
              <h1 className="text-2xl font-bold leading-tight text-white">{officialName}</h1>
              <p className="text-sm font-semibold" style={{ color: primary }}>{lang === 'fr' ? 'Portail d’inscription de la diaspora' : 'Diaspora Registration Portal'}</p>
            </div>
          </div>
        </div>

        {/* Center: carousel */}
        <section className="relative my-10" aria-label={lang === 'fr' ? 'Messages du portail' : 'Portal messages'}>
          <PortalCarousel slides={slides} registrantCount={registrantCount} primary={primary} countLabel={countLabel} />
        </section>

        {/* Bottom: trust mini-cards + attribution */}
        <div className="relative space-y-5">
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {trustCards.map(({ Icon, title, text }) => (
              <li key={title} className="flex items-start gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: primary }} aria-hidden="true" />
                <span className="text-[11px] leading-tight text-surface/70"><span className="font-semibold text-surface/90">{title}</span> — {text}</span>
              </li>
            ))}
          </ul>
          <footer className="text-xs text-surface/40">
            {attributionSovereign ? (
              <span>
                {lang === 'fr' ? 'Technologie par' : 'Technology by'}{' '}
                <a href="https://www.afronovation.com" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: primary }}>Afronovation, Inc.</a>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <span className="text-white/40">Powered by CivisOS</span>
                <span className="text-white/20">|</span>
                <a href="https://www.afronovation.com" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: primary }}>Afronovation, Inc.</a>
              </span>
            )}
          </footer>
        </div>
      </header>

      {/* Right — auth (50%). Renders ABOVE on mobile (above the fold). */}
      <section className="order-1 flex items-center justify-center bg-navy-deep p-8 lg:order-2 lg:p-12" aria-label={lang === 'fr' ? 'Connexion ou inscription' : 'Sign in or register'}>
        <PortalAuthPanel
          tenantId={tenant.id}
          countryCode={tenant.countryCode}
          displayName={displayName}
          brandPrimary={primary}
          supportedLanguages={tenant.supportedLanguages}
        />
      </section>
    </main>
  );
}
