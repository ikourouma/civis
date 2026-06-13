import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { SectionWrapper } from '@/components/layout/SectionWrapper';

interface PageProps {
  params: { locale: string };
}

export async function generateMetadata({ params: { locale } }: PageProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'About' });
  return { title: t('title') };
}

export default function AboutPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const t = useTranslations('About');

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

      <SectionWrapper width="narrow">
        <div className="space-y-16">
          <div className="space-y-4">
            <h2 className="text-heading text-navy">{t('mission.title')}</h2>
            <p className="leading-relaxed text-ink">{t('mission.body')}</p>
          </div>
          <div className="space-y-4">
            <h2 className="text-heading text-navy">{t('vision.title')}</h2>
            <p className="leading-relaxed text-ink">{t('vision.body')}</p>
          </div>
          <div className="space-y-4 border-l-2 border-gold pl-6">
            <h2 className="text-heading text-navy">{t('program.title')}</h2>
            <p className="leading-relaxed text-ink">{t('program.body')}</p>
            <p className="leading-relaxed text-ink">{t('program.ecosystem')}</p>
          </div>
          <div className="space-y-4">
            <h2 className="text-heading text-navy">{t('philosophy.title')}</h2>
            <p className="leading-relaxed text-ink">{t('philosophy.body')}</p>
          </div>
        </div>
      </SectionWrapper>
    </>
  );
}
