import { ArrowLeft } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { BrandPreview } from '@/components/admin/BrandPreview';
import { Link } from '@/i18n/navigation';
import { getCurrentUser } from '@/lib/services/auth';
import { getBrandByCountry } from '@/lib/services/branding';

interface PageProps {
  params: { locale: string; country_code: string };
}

export default async function BrandPreviewPage({ params: { locale, country_code } }: PageProps) {
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') {
    redirect(`/${locale}/auth/signin`);
  }

  const brand = await getBrandByCountry(country_code);
  if (!brand) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/admin/branding"
        className="inline-flex items-center gap-2 text-sm text-surface/60 transition-colors hover:text-gold"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Branding
      </Link>

      <header className="mb-8 mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">Brand Preview</p>
        <h1 className="mt-2 text-3xl font-bold text-white">
          {brand.displayName[locale as 'en' | 'fr'] ?? brand.displayName.en}
        </h1>
        <p className="mt-2 text-sm text-surface/60">
          Preview how this brand renders across deployment tiers.
        </p>
      </header>

      <BrandPreview brand={brand} locale={locale as 'en' | 'fr'} />
    </div>
  );
}
