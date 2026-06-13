import { AlertTriangle, ChevronRight, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { AnimatedCard } from '@/components/animation/AnimatedCard';
import { FadeUp } from '@/components/animation/FadeUp';
import { StaggerContainer } from '@/components/animation/StaggerContainer';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { CtaStrip } from '@/components/marketing/CtaStrip';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';

export type PlatformSection = 'registry' | 'embassy' | 'analytics' | 'dia';

interface FeatureMessage {
  title: string;
  description: string;
}

interface MetricMessage {
  value: string;
  label: string;
}

interface PlatformSubpageProps {
  section: PlatformSection;
  /** One icon per solution feature card, in order (six expected). */
  featureIcons: readonly LucideIcon[];
}

/**
 * Shared structure for the four /platform subpages (Mission 001-A §4):
 * breadcrumb → hero → challenge → solution cards → metrics bar → CTA strip.
 */
export function PlatformSubpage({ section, featureIcons }: PlatformSubpageProps) {
  const t = useTranslations(`Platform.${section}`);
  const tCommon = useTranslations('Platform.common');
  const tNav = useTranslations('Common');

  const challenges = t.raw('challenges') as string[];
  const features = t.raw('features') as FeatureMessage[];
  const metrics = t.raw('metrics') as MetricMessage[];

  return (
    <>
      {/* Hero with breadcrumb */}
      <SectionWrapper className="bg-navy-deepest py-20 text-surface md:py-28">
        <FadeUp>
          <nav aria-label={tCommon('breadcrumbLabel')} className="mb-8">
            <ol className="flex items-center gap-1 text-xs font-medium text-surface/60">
              <li>
                <Link href="/" className="transition-colors hover:text-gold">
                  {tNav('home')}
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
              <li>
                <Link href="/platform" className="transition-colors hover:text-gold">
                  {tCommon('breadcrumbPlatform')}
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
              <li aria-current="page" className="text-gold">
                {t('title')}
              </li>
            </ol>
          </nav>
          <div className="max-w-3xl space-y-6">
            <h1 className="text-display text-white md:text-display-lg">{t('title')}</h1>
            <p className="text-lg leading-relaxed text-surface/80">{t('subtitle')}</p>
          </div>
        </FadeUp>
      </SectionWrapper>

      {/* The Challenge */}
      <SectionWrapper>
        <FadeUp>
          <h2 className="mb-10 text-heading text-navy md:text-heading-lg">
            {tCommon('challengeTitle')}
          </h2>
        </FadeUp>
        <StaggerContainer className="grid gap-4" staggerDelay={80}>
          {challenges.map((challenge) => (
            <div
              key={challenge}
              className="flex items-start gap-4 rounded-md border border-neutral-200 bg-neutral-100 p-5"
            >
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-alert-amber" aria-hidden="true" />
              <p className="text-sm leading-relaxed text-ink">{challenge}</p>
            </div>
          ))}
        </StaggerContainer>
      </SectionWrapper>

      {/* The Civis Solution */}
      <SectionWrapper className="bg-surface">
        <FadeUp>
          <h2 className="mb-10 text-heading text-navy md:text-heading-lg">
            {tCommon('solutionTitle')}
          </h2>
        </FadeUp>
        <StaggerContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={100}>
          {features.map((feature, index) => {
            const Icon = featureIcons[index] ?? AlertTriangle;
            return (
              <AnimatedCard key={feature.title}>
                <CardHeader>
                  <span className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-md bg-navy/5 transition-colors duration-200 motion-safe:group-hover:bg-gold/10">
                    <Icon className="h-6 w-6 text-navy" aria-hidden="true" />
                  </span>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </AnimatedCard>
            );
          })}
        </StaggerContainer>
      </SectionWrapper>

      {/* Metrics bar */}
      <SectionWrapper className="bg-navy text-surface">
        <StaggerContainer className="grid gap-10 text-center sm:grid-cols-2 lg:grid-cols-4" staggerDelay={100}>
          {metrics.map((metric) => (
            <div key={metric.label} className="space-y-2">
              <p className="text-3xl font-bold text-gold md:text-4xl">{metric.value}</p>
              <p className="text-sm font-medium text-surface/80">{metric.label}</p>
            </div>
          ))}
        </StaggerContainer>
      </SectionWrapper>

      <CtaStrip />
    </>
  );
}
