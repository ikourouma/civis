import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { FadeUp } from '@/components/animation/FadeUp';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

interface PageProps {
  params: { locale: string };
}

interface WhitepaperSection {
  title: string;
  body: string;
}

export async function generateMetadata({ params: { locale } }: PageProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Resources.whitepaper' });
  return { title: t('title') };
}

export default function SecurityWhitepaperPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const t = useTranslations('Resources.whitepaper');

  const sections = t.raw('sections') as WhitepaperSection[];

  return (
    <>
      <SectionWrapper className="bg-navy-deepest py-20 text-surface md:py-28">
        <FadeUp>
          <div className="max-w-3xl space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
              {t('eyebrow')}
            </p>
            <h1 className="text-display text-white md:text-display-lg">{t('title')}</h1>
            <p className="text-lg leading-relaxed text-surface/80">{t('subtitle')}</p>
          </div>
        </FadeUp>
      </SectionWrapper>

      <SectionWrapper width="narrow">
        <div className="space-y-12">
          {sections.map((section, index) => (
            <FadeUp key={section.title}>
              <article className="space-y-4">
                <h2 className="flex items-baseline gap-4 text-subheading text-navy">
                  <span className="text-sm font-bold tracking-widest text-gold" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {section.title}
                </h2>
                <p className="leading-relaxed text-ink">{section.body}</p>
              </article>
            </FadeUp>
          ))}
        </div>
      </SectionWrapper>

      <SectionWrapper className="bg-navy text-surface">
        <FadeUp>
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
            <h2 className="text-heading text-white">{t('ctaTitle')}</h2>
            <p className="leading-relaxed text-surface/80">{t('ctaBody')}</p>
            <Button asChild size="lg" className="bg-gold text-navy-deepest hover:bg-gold/90">
              <Link href="/contact">{t('ctaButton')}</Link>
            </Button>
          </div>
        </FadeUp>
      </SectionWrapper>
    </>
  );
}
