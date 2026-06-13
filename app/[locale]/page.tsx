import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Building2,
  Check,
  Database,
  FileCheck2,
  Globe2,
  Lock,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

import { FadeUp } from '@/components/animation/FadeUp';
import { StaggerContainer } from '@/components/animation/StaggerContainer';
import { AnimatedCard } from '@/components/animation/AnimatedCard';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { AuFlagRow } from '@/components/marketing/AuFlagRow';
import { Hero } from '@/components/marketing/Hero';
import { Button } from '@/components/ui/button';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';

interface PageProps {
  params: { locale: string };
}

const PILLARS = [
  { key: 'registry', href: '/platform/diaspora-registry', Icon: Database },
  { key: 'embassy', href: '/platform/embassy-intelligence', Icon: Building2 },
  { key: 'analytics', href: '/platform/sovereign-analytics', Icon: BarChart3 },
  { key: 'dia', href: '/platform/dia-ai', Icon: BrainCircuit },
] as const;

const COMPLIANCE_BADGES = [
  { key: 'iso', Icon: ShieldCheck },
  { key: 'gdpr', Icon: Lock },
  { key: 'soc2', Icon: FileCheck2 },
  { key: 'malabo', Icon: Globe2 },
] as const;

const TIERS = [
  { key: 'cloud', badgeClass: 'bg-intelligence/10 text-intelligence' },
  { key: 'government', badgeClass: 'bg-gold/10 text-gold' },
  { key: 'sovereign', badgeClass: 'bg-navy/10 text-navy' },
] as const;

export default function HomePage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const t = useTranslations('Home');

  const contrastWithout = t.raw('contrast.without') as string[];
  const contrastWith = t.raw('contrast.with') as string[];
  const ctaPromises = t.raw('cta.promises') as string[];

  return (
    <>
      {/* Hero — left narrative + right intelligence panel (Mission 001-B) */}
      <Hero />

      {/* Four pillars — 2×2 grid linking to platform subpages */}
      <SectionWrapper className="bg-surface">
        <FadeUp>
          <h2 className="mb-12 max-w-2xl text-heading text-navy md:text-heading-lg">
            {t('pillars.title')}
          </h2>
        </FadeUp>
        <StaggerContainer className="grid gap-6 md:grid-cols-2" staggerDelay={100}>
          {PILLARS.map(({ key, href, Icon }, index) => (
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
                  <CardTitle>{t(`pillars.${key}.title`)}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {t(`pillars.${key}.description`)}
                  </CardDescription>
                  <span className="flex items-center gap-1 pt-2 text-sm font-medium text-navy">
                    {t('pillars.explore')}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </CardHeader>
              </Link>
            </AnimatedCard>
          ))}
        </StaggerContainer>
      </SectionWrapper>

      {/* Before / after contrast */}
      <SectionWrapper className="bg-navy-deepest text-surface">
        <FadeUp>
          <h2 className="mb-12 max-w-2xl text-heading text-white md:text-heading-lg">
            {t('contrast.title')}
          </h2>
        </FadeUp>
        <div className="grid gap-8 lg:grid-cols-2">
          <FadeUp>
            <div className="h-full rounded-lg border border-red-400/20 bg-navy-deep/60 p-8">
              <h3 className="mb-6 text-subheading text-red-400">{t('contrast.withoutTitle')}</h3>
              <ul className="space-y-4">
                {contrastWithout.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <X className="mt-0.5 h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />
                    <span className="text-sm leading-relaxed text-surface/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </FadeUp>
          <FadeUp delay={150}>
            <div className="h-full rounded-lg border border-gold/30 bg-navy-deep/60 p-8">
              <h3 className="mb-6 text-subheading text-gold">{t('contrast.withTitle')}</h3>
              <ul className="space-y-4">
                {contrastWith.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-success-teal" aria-hidden="true" />
                    <span className="text-sm leading-relaxed text-surface/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </FadeUp>
        </div>
      </SectionWrapper>

      {/* AU member states trust */}
      <SectionWrapper>
        <FadeUp>
          <h2 className="mb-12 max-w-2xl text-heading text-navy md:text-heading-lg">
            {t('auTrust.title')}
          </h2>
        </FadeUp>
        <FadeUp delay={100}>
          <AuFlagRow />
        </FadeUp>
        <StaggerContainer className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={100}>
          {COMPLIANCE_BADGES.map(({ key, Icon }) => (
            <div
              key={key}
              className="flex items-start gap-4 rounded-md border border-neutral-200 bg-white p-5"
            >
              <Icon className="mt-0.5 h-6 w-6 shrink-0 text-gold" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-navy">{t(`auTrust.badges.${key}.name`)}</p>
                <p className="text-xs leading-relaxed text-neutral-500">
                  {t(`auTrust.badges.${key}.description`)}
                </p>
              </div>
            </div>
          ))}
        </StaggerContainer>
      </SectionWrapper>

      {/* Deployment tier preview */}
      <SectionWrapper className="bg-surface">
        <FadeUp>
          <h2 className="mb-12 max-w-2xl text-heading text-navy md:text-heading-lg">
            {t('tiers.title')}
          </h2>
        </FadeUp>
        <StaggerContainer className="grid gap-6 lg:grid-cols-3" staggerDelay={150}>
          {TIERS.map(({ key, badgeClass }) => (
            <AnimatedCard key={key}>
              <Link href="/deployment" className="block h-full">
                <CardHeader>
                  <span
                    className={`mb-2 inline-flex w-fit rounded-sm px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${badgeClass}`}
                  >
                    {t(`tiers.${key}.name`)}
                  </span>
                  <CardTitle>{t(`tiers.${key}.audience`)}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {t(`tiers.${key}.line`)}
                  </CardDescription>
                  <span className="flex items-center gap-1 pt-2 text-sm font-medium text-navy">
                    {t('tiers.compare')}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </CardHeader>
              </Link>
            </AnimatedCard>
          ))}
        </StaggerContainer>
      </SectionWrapper>

      {/* Government briefing CTA */}
      <SectionWrapper className="bg-navy-deepest text-surface">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-10 text-center">
          <FadeUp>
            <h2 className="text-heading text-white md:text-heading-lg">{t('cta.title')}</h2>
            <p className="mt-6 leading-relaxed text-surface/75">{t('cta.body')}</p>
          </FadeUp>
          <FadeUp delay={100} className="w-full">
            <ul className="grid gap-4 text-left sm:grid-cols-2">
              {ctaPromises.map((promise) => (
                <li key={promise} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
                  <span className="text-sm leading-relaxed text-surface/80">{promise}</span>
                </li>
              ))}
            </ul>
          </FadeUp>
          <FadeUp delay={200} className="w-full">
            <div className="flex justify-center">
              <AuFlagRow tone="dark" />
            </div>
          </FadeUp>
          <FadeUp delay={300}>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg" className="bg-gold text-navy-deepest hover:bg-gold/90">
                <Link href="/contact">{t('cta.primaryCta')}</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-surface/40 bg-transparent text-surface hover:bg-surface hover:text-navy"
              >
                <Link href="/security">{t('cta.secondaryCta')}</Link>
              </Button>
            </div>
          </FadeUp>
        </div>
      </SectionWrapper>
    </>
  );
}
