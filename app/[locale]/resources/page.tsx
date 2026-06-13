import type { Metadata } from 'next';
import {
  ArrowRight,
  Activity,
  BookOpen,
  Code2,
  FileClock,
  Landmark,
  ServerCog,
  ShieldCheck,
  UserCog,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { AnimatedCard } from '@/components/animation/AnimatedCard';
import { FadeUp } from '@/components/animation/FadeUp';
import { StaggerContainer } from '@/components/animation/StaggerContainer';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';

interface PageProps {
  params: { locale: string };
}

const AUDIENCES = [
  { key: 'decisionMakers', Icon: Landmark },
  { key: 'admins', Icon: UserCog },
  { key: 'technical', Icon: ServerCog },
] as const;

const RESOURCE_CARDS = [
  { key: 'whitepaper', href: '/resources/security-whitepaper', Icon: ShieldCheck },
  { key: 'api', href: '/resources/api-reference', Icon: Code2 },
  { key: 'changelog', href: '/resources/changelog', Icon: FileClock },
  { key: 'status', href: '/resources/status', Icon: Activity },
] as const;

export async function generateMetadata({ params: { locale } }: PageProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Resources.hub' });
  return { title: t('title') };
}

export default function ResourcesHubPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const t = useTranslations('Resources.hub');

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

      {/* Audience cards — all route to documentation */}
      <SectionWrapper>
        <FadeUp>
          <h2 className="mb-10 text-heading text-navy md:text-heading-lg">
            {t('audiencesTitle')}
          </h2>
        </FadeUp>
        <StaggerContainer className="grid gap-6 lg:grid-cols-3" staggerDelay={100}>
          {AUDIENCES.map(({ key, Icon }) => (
            <AnimatedCard key={key}>
              <Link href="/resources/documentation" className="block h-full">
                <CardHeader>
                  <span className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-md bg-navy/5 transition-colors duration-200 motion-safe:group-hover:bg-gold/10">
                    <Icon className="h-6 w-6 text-navy" aria-hidden="true" />
                  </span>
                  <CardTitle>{t(`audiences.${key}.title`)}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {t(`audiences.${key}.description`)}
                  </CardDescription>
                  <span className="flex items-center gap-1 pt-2 text-sm font-medium text-navy">
                    <BookOpen className="h-4 w-4" aria-hidden="true" />
                    {t('viewDocumentation')}
                  </span>
                </CardHeader>
              </Link>
            </AnimatedCard>
          ))}
        </StaggerContainer>
      </SectionWrapper>

      {/* Additional resource cards */}
      <SectionWrapper className="bg-surface">
        <StaggerContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={100}>
          {RESOURCE_CARDS.map(({ key, href, Icon }) => (
            <AnimatedCard key={key}>
              <Link href={href} className="block h-full">
                <CardHeader>
                  <span className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-md bg-navy/5 transition-colors duration-200 motion-safe:group-hover:bg-gold/10">
                    <Icon className="h-6 w-6 text-navy" aria-hidden="true" />
                  </span>
                  <CardTitle className="text-base">{t(`cards.${key}.title`)}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {t(`cards.${key}.description`)}
                  </CardDescription>
                  <span className="flex items-center gap-1 pt-2 text-sm font-medium text-navy">
                    {t('open')}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </CardHeader>
              </Link>
            </AnimatedCard>
          ))}
        </StaggerContainer>
      </SectionWrapper>
    </>
  );
}
