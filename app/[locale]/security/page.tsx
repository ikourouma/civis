import type { Metadata } from 'next';
import { FileCheck2, Globe2, KeyRound, Lock, Scale, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PageProps {
  params: { locale: string };
}

// Sovereign trust posture — Doc 06 §9 (Security Page Architecture).
const SECURITY_SECTIONS = [
  { key: 'tenantIsolation', Icon: Lock },
  { key: 'dataProtection', Icon: ShieldCheck },
  { key: 'auditLogs', Icon: FileCheck2 },
  { key: 'accessControls', Icon: KeyRound },
  { key: 'compliance', Icon: Scale },
  { key: 'dataResidency', Icon: Globe2 },
] as const;

export async function generateMetadata({ params: { locale } }: PageProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Security' });
  return { title: t('title') };
}

export default function SecurityPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const t = useTranslations('Security');

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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SECURITY_SECTIONS.map(({ key, Icon }) => (
            <Card key={key}>
              <CardHeader>
                <Icon className="mb-2 h-7 w-7 text-navy" aria-hidden="true" />
                <CardTitle className="text-base">{t(`sections.${key}.title`)}</CardTitle>
                <CardDescription className="leading-relaxed">
                  {t(`sections.${key}.description`)}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </SectionWrapper>

      <SectionWrapper className="bg-surface" width="narrow">
        <blockquote className="border-l-2 border-gold pl-6">
          <p className="text-lg font-medium leading-relaxed text-navy">{t('auditCallout')}</p>
        </blockquote>
      </SectionWrapper>
    </>
  );
}
