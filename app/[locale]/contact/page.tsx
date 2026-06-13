import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { RequestDemoForm } from '@/components/marketing/RequestDemoForm';

interface PageProps {
  params: { locale: string };
}

export async function generateMetadata({ params: { locale } }: PageProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Contact' });
  return { title: t('title') };
}

export default function ContactPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const t = useTranslations('Contact');

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
        <RequestDemoForm />
      </SectionWrapper>
    </>
  );
}
