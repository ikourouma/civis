import type { Metadata } from 'next';
import { Landmark, ServerCog, UserCog } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { FadeUp } from '@/components/animation/FadeUp';
import { StaggerContainer } from '@/components/animation/StaggerContainer';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PageProps {
  params: { locale: string };
}

interface DocItem {
  title: string;
  body: string;
}

const SECTIONS = [
  { key: 'decisionMakers', Icon: Landmark },
  { key: 'admins', Icon: UserCog },
  { key: 'technical', Icon: ServerCog },
] as const;

export async function generateMetadata({ params: { locale } }: PageProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Resources.documentation' });
  return { title: t('title') };
}

export default function DocumentationPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const t = useTranslations('Resources.documentation');

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

      {SECTIONS.map(({ key, Icon }, sectionIndex) => {
        const items = t.raw(`${key}.items`) as DocItem[];
        return (
          <SectionWrapper key={key} className={sectionIndex % 2 === 1 ? 'bg-surface' : undefined}>
            <FadeUp>
              <div className="mb-10 flex items-center gap-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-navy/5">
                  <Icon className="h-6 w-6 text-navy" aria-hidden="true" />
                </span>
                <h2 className="text-heading text-navy md:text-heading-lg">{t(`${key}.title`)}</h2>
              </div>
            </FadeUp>
            <StaggerContainer className="grid gap-6 md:grid-cols-2" staggerDelay={80}>
              {items.map((item) => (
                <Card key={item.title} className="border-t-2 border-t-gold">
                  <CardHeader>
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <CardDescription className="leading-relaxed">{item.body}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </StaggerContainer>
          </SectionWrapper>
        );
      })}
    </>
  );
}
