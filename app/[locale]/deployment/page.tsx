import type { Metadata } from 'next';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { DeploymentTierComparison } from '@/components/marketing/DeploymentTierComparison';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';

interface PageProps {
  params: { locale: string };
}

// Three-tier sovereign deployment model — Doc 08 §5, Doc 09.
const TIERS = ['cloud', 'government', 'sovereign'] as const;
const TIER_POINTS = ['point1', 'point2', 'point3'] as const;

export async function generateMetadata({ params: { locale } }: PageProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Deployment' });
  return { title: t('title') };
}

export default function DeploymentPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const t = useTranslations('Deployment');

  return (
    <>
      <SectionWrapper className="bg-navy-deep text-surface">
        <div className="max-w-3xl space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
            {t('eyebrow')}
          </p>
          <h1 className="text-display text-white">{t('title')}</h1>
          <p className="text-lg leading-relaxed text-surface/80">{t('intro')}</p>
        </div>
      </SectionWrapper>

      <SectionWrapper>
        <div className="grid gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <Card key={tier} className="flex flex-col border-t-2 border-t-gold">
              <CardHeader>
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                  {t(`tiers.${tier}.label`)}
                </p>
                <CardTitle className="text-xl">{t(`tiers.${tier}.name`)}</CardTitle>
                <CardDescription className="leading-relaxed">
                  {t(`tiers.${tier}.description`)}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <ul className="space-y-3">
                  {TIER_POINTS.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-sm text-ink">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-success-teal"
                        aria-hidden="true"
                      />
                      {t(`tiers.${tier}.${point}`)}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-12 border-l-2 border-gold pl-6 text-sm leading-relaxed text-neutral-500">
          {t('residencyNote')}
        </p>
      </SectionWrapper>

      <DeploymentTierComparison locale={locale as 'en' | 'fr'} />

      <SectionWrapper className="bg-surface">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <h2 className="text-heading text-navy">{t('cta.title')}</h2>
          <p className="leading-relaxed text-ink">{t('cta.subtitle')}</p>
          <Button asChild size="lg">
            <Link href="/contact">{t('cta.button')}</Link>
          </Button>
        </div>
      </SectionWrapper>
    </>
  );
}
