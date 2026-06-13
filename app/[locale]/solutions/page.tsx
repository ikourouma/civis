import type { Metadata } from 'next';
import { ArrowRight, Banknote, Check, Globe2, Handshake, Landmark, ServerCog } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { AnimatedCard } from '@/components/animation/AnimatedCard';
import { FadeUp } from '@/components/animation/FadeUp';
import { StaggerContainer } from '@/components/animation/StaggerContainer';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { CtaStrip } from '@/components/marketing/CtaStrip';
import { Link } from '@/i18n/navigation';

interface PageProps {
  params: { locale: string };
}

// One solution card per procurement persona — Doc 00 §5, Mission 001-A §5.
// Each "See how Civis serves…" link routes to the most relevant surface.
const PERSONAS = [
  { key: 'minister', Icon: Landmark, href: '/platform/sovereign-analytics' },
  { key: 'centralBank', Icon: Banknote, href: '/platform/dia-ai' },
  { key: 'diasporaDirector', Icon: Globe2, href: '/platform/diaspora-registry' },
  { key: 'devPartner', Icon: Handshake, href: '/security' },
  { key: 'cio', Icon: ServerCog, href: '/deployment' },
] as const;

export async function generateMetadata({ params: { locale } }: PageProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Solutions' });
  return { title: t('eyebrow') };
}

export default function SolutionsPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const t = useTranslations('Solutions');

  return (
    <>
      <SectionWrapper className="bg-navy-deepest py-20 text-surface md:py-28">
        <FadeUp>
          <div className="max-w-3xl space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
              {t('eyebrow')}
            </p>
            <h1 className="text-display text-white md:text-display-lg">{t('title')}</h1>
            <p className="text-lg leading-relaxed text-surface/80">{t('intro')}</p>
          </div>
        </FadeUp>
      </SectionWrapper>

      <SectionWrapper className="bg-navy-deep text-surface">
        <StaggerContainer className="grid gap-8" staggerDelay={120}>
          {PERSONAS.map(({ key, Icon, href }) => {
            const outcomes = t.raw(`personas.${key}.outcomes`) as string[];
            return (
              <AnimatedCard
                key={key}
                className="border-surface/10 bg-navy-deepest/70 text-surface"
              >
                <div className="grid gap-8 p-8 lg:grid-cols-[1fr_1fr]">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-gold/10 transition-colors duration-200 motion-safe:group-hover:bg-gold/20">
                        <Icon className="h-5 w-5 text-gold" aria-hidden="true" />
                      </span>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                        {t(`personas.${key}.eyebrow`)}
                      </p>
                    </div>
                    <h2 className="text-subheading text-white">{t(`personas.${key}.challenge`)}</h2>
                    <p className="text-sm leading-relaxed text-surface/70">
                      {t(`personas.${key}.description`)}
                    </p>
                  </div>
                  <div className="flex flex-col justify-between gap-6">
                    <ul className="space-y-3">
                      {outcomes.map((outcome) => (
                        <li key={outcome} className="flex items-start gap-3">
                          <Check className="mt-0.5 h-5 w-5 shrink-0 text-success-teal" aria-hidden="true" />
                          <span className="text-sm leading-relaxed text-surface/85">{outcome}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={href}
                      className="flex items-center gap-1 text-sm font-medium text-gold transition-colors hover:text-gold/80"
                    >
                      {t(`personas.${key}.linkLabel`)}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </AnimatedCard>
            );
          })}
        </StaggerContainer>
      </SectionWrapper>

      <CtaStrip />
    </>
  );
}
