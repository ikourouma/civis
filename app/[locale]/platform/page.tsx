import type { Metadata } from 'next';
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Building2,
  ChevronRight,
  Database,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { AnimatedCard } from '@/components/animation/AnimatedCard';
import { FadeUp } from '@/components/animation/FadeUp';
import { StaggerContainer } from '@/components/animation/StaggerContainer';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { CtaStrip } from '@/components/marketing/CtaStrip';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';

interface PageProps {
  params: { locale: string };
}

const SUBPAGES = [
  { key: 'registry', href: '/platform/diaspora-registry', Icon: Database },
  { key: 'embassy', href: '/platform/embassy-intelligence', Icon: Building2 },
  { key: 'analytics', href: '/platform/sovereign-analytics', Icon: BarChart3 },
  { key: 'dia', href: '/platform/dia-ai', Icon: BrainCircuit },
] as const;

export async function generateMetadata({ params: { locale } }: PageProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Platform.hub' });
  return { title: t('breadcrumb') };
}

export default function PlatformHubPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const t = useTranslations('Platform.hub');
  const tCommon = useTranslations('Common');

  return (
    <>
      {/* Hero with breadcrumb — no CTAs, the subpages carry them */}
      <SectionWrapper className="bg-navy-deepest py-20 text-surface md:py-28">
        <FadeUp>
          <nav aria-label={tCommon('breadcrumbLabel')} className="mb-8">
            <ol className="flex items-center gap-1 text-xs font-medium text-surface/60">
              <li>
                <Link href="/" className="transition-colors hover:text-gold">
                  {tCommon('home')}
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
              <li aria-current="page" className="text-gold">
                {t('breadcrumb')}
              </li>
            </ol>
          </nav>
          <div className="max-w-3xl space-y-6">
            <h1 className="text-display text-white md:text-display-lg">{t('title')}</h1>
            <p className="text-lg leading-relaxed text-surface/80">{t('subtitle')}</p>
          </div>
        </FadeUp>
      </SectionWrapper>

      {/* Intro + four subpage cards */}
      <SectionWrapper>
        <FadeUp>
          <p className="mb-12 max-w-3xl text-base leading-relaxed text-neutral-500">{t('intro')}</p>
        </FadeUp>
        <StaggerContainer className="grid gap-6 md:grid-cols-2" staggerDelay={100}>
          {SUBPAGES.map(({ key, href, Icon }, index) => (
            <AnimatedCard key={key}>
              <Link href={href} className="block h-full">
                <CardHeader>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-navy/5 transition-colors duration-200 motion-safe:group-hover:bg-gold/10">
                      <Icon className="h-6 w-6 text-navy" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-bold tracking-widest text-gold/70">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <CardTitle className="text-xl">{t(`cards.${key}.title`)}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {t(`cards.${key}.teaser`)}
                  </CardDescription>
                  <span className="flex items-center gap-1 pt-2 text-sm font-medium text-navy">
                    {t('explore')}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </CardHeader>
              </Link>
            </AnimatedCard>
          ))}
        </StaggerContainer>
      </SectionWrapper>

      <CtaStrip />
    </>
  );
}
