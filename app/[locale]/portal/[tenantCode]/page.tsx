import { Globe, ShieldCheck, Check } from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { PortalAuthPanel } from '@/components/portal/PortalAuthPanel';
import { getPortalConfig } from '@/lib/services/portal/portal.service';

interface PageProps {
  params: { locale: string; tenantCode: string };
}

const ATTRIBUTION: Record<string, string | null> = {
  cloud: 'Powered by Civis — Sovereign Intelligence Platform',
  government: 'Powered by Civis',
  sovereign: null,
};

export default async function BrandedPortalPage({ params: { locale, tenantCode } }: PageProps) {
  setRequestLocale(locale);
  const lang = locale as 'en' | 'fr';

  const config = await getPortalConfig(tenantCode);

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-deepest px-6 text-center">
        <div className="max-w-md">
          <Globe className="mx-auto mb-4 h-10 w-10 text-surface/30" />
          <h1 className="text-xl font-bold text-white">Portal not available</h1>
          <p className="mt-2 text-sm text-surface/60">
            This portal is not currently active. Contact your government&apos;s diaspora office or visit{' '}
            <a href="https://civisos.com" className="text-gold hover:underline">civisos.com</a> for more information.
          </p>
        </div>
      </div>
    );
  }

  const { tenant, brand, tier } = config;
  const displayName = brand?.displayName[lang] ?? brand?.displayName.en ?? tenant.name;
  const officialName = brand?.officialName?.[lang] ?? brand?.officialName?.en ?? tenant.officialName ?? displayName;
  const primary = brand?.palette.primary ?? '#C9A84C';
  const seal = brand?.assets.sealUrl;
  const attribution = ATTRIBUTION[tier];

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Left — branding (60%) */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-navy-deepest p-10 lg:w-3/5">
        {seal && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={seal} alt="" aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-[120%] -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.06]" />
        )}
        <div className="relative">
          <Link href="/" className="text-base font-bold tracking-[0.2em] text-white">CIVIS<span className="text-gold">.</span></Link>
        </div>

        <div className="relative max-w-md">
          {seal && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={seal} alt={officialName} className="mb-6 h-20 w-20 object-contain" />
          )}
          <h1 className="text-3xl font-bold text-white">{officialName}</h1>
          <h2 className="mt-1 text-xl font-semibold" style={{ color: primary }}>Diaspora Registration Portal</h2>
          <p className="mt-4 text-sm leading-relaxed text-surface/70">
            Register with your government. Your data is held under {displayName}&apos;s sovereign data infrastructure.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-surface/70">
            <li className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-gold" /> Sovereign data protection — your government controls your data</li>
            <li className="flex items-center gap-3"><Check className="h-4 w-4 text-gold" /> Consent-first — you decide what to share</li>
            <li className="flex items-center gap-3"><Globe className="h-4 w-4 text-gold" /> Accessible from anywhere in the world</li>
          </ul>
        </div>

        <div className="relative">
          {attribution && <p className="text-xs text-surface/40">{attribution}</p>}
        </div>
      </div>

      {/* Right — auth (40%) */}
      <div className="flex flex-1 items-center justify-center bg-navy-deep p-10">
        <PortalAuthPanel
          tenantId={tenant.id}
          countryCode={tenant.countryCode}
          displayName={displayName}
          brandPrimary={primary}
          supportedLanguages={tenant.supportedLanguages}
        />
      </div>
    </div>
  );
}
