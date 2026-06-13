import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { FadeUp } from '@/components/animation/FadeUp';
import { StaggerContainer } from '@/components/animation/StaggerContainer';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { Card, CardContent } from '@/components/ui/card';

interface PageProps {
  params: { locale: string };
}

const SERVICES = ['api', 'webApp', 'database', 'ai'] as const;

export async function generateMetadata({ params: { locale } }: PageProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Resources.status' });
  return { title: t('title') };
}

export default function StatusPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const t = useTranslations('Resources.status');

  return (
    <>
      <SectionWrapper className="bg-navy-deepest py-20 text-surface md:py-28">
        <FadeUp>
          <div className="max-w-3xl space-y-6">
            <h1 className="text-display text-white md:text-display-lg">{t('title')}</h1>
            <p className="text-lg leading-relaxed text-surface/80">{t('subtitle')}</p>
          </div>
        </FadeUp>
      </SectionWrapper>

      <SectionWrapper width="narrow">
        <FadeUp>
          <h2 className="mb-8 text-subheading text-navy">{t('servicesTitle')}</h2>
        </FadeUp>
        <StaggerContainer className="grid gap-4" staggerDelay={80}>
          {SERVICES.map((key) => (
            <Card key={key}>
              <CardContent className="flex items-center justify-between p-5">
                <span className="text-sm font-medium text-ink">{t(`services.${key}`)}</span>
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-success-teal" aria-hidden="true" />
                  <span className="text-sm font-semibold text-success-teal">
                    {t('operational')}
                  </span>
                </span>
              </CardContent>
            </Card>
          ))}
        </StaggerContainer>

        <FadeUp>
          <div className="mt-16 space-y-12">
            <article className="space-y-3">
              <h2 className="text-subheading text-navy">{t('incidentsTitle')}</h2>
              <p className="leading-relaxed text-ink">{t('incidentsBody')}</p>
            </article>
            <article className="space-y-3 border-l-2 border-gold pl-6">
              <h2 className="text-subheading text-navy">{t('uptimeTitle')}</h2>
              <p className="leading-relaxed text-ink">{t('uptimeBody')}</p>
            </article>
          </div>
        </FadeUp>
      </SectionWrapper>
    </>
  );
}
