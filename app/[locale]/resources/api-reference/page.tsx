import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { FadeUp } from '@/components/animation/FadeUp';
import { StaggerContainer } from '@/components/animation/StaggerContainer';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';

interface PageProps {
  params: { locale: string };
}

// Endpoint identifiers are code, not prose — they are identical in every
// locale (Doc 12 §5). Group names and descriptions come from translations.
const ENDPOINT_GROUPS = [
  {
    key: 'registry',
    endpoints: [
      'GET /api/v1/registry/registrants',
      'POST /api/v1/registry/registrants',
      'POST /api/v1/registry/registrants/:id/verify',
    ],
  },
  {
    key: 'embassy',
    endpoints: [
      'GET /api/v1/embassies',
      'GET /api/v1/embassies/:id/stats',
      'GET /api/v1/embassies/:id/queue',
    ],
  },
  {
    key: 'analytics',
    endpoints: [
      'GET /api/v1/analytics/summary',
      'GET /api/v1/analytics/geographic',
      'GET /api/v1/analytics/economic',
    ],
  },
  {
    key: 'dia',
    endpoints: ['POST /api/v1/dia/query', 'GET /api/v1/dia/forecasts', 'POST /api/v1/dia/brief'],
  },
  {
    key: 'webhooks',
    endpoints: ['POST /api/webhooks/embassyos', 'POST /api/webhooks/bridgevault', 'POST /api/webhooks/bridgeai'],
  },
] as const;

export async function generateMetadata({ params: { locale } }: PageProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Resources.api' });
  return { title: t('title') };
}

export default function ApiReferencePage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const t = useTranslations('Resources.api');

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

      {/* Authentication, base URL and versioning */}
      <SectionWrapper width="narrow">
        <div className="space-y-12">
          <FadeUp>
            <article className="space-y-4">
              <h2 className="text-subheading text-navy">{t('auth.title')}</h2>
              <p className="leading-relaxed text-ink">{t('auth.body')}</p>
              <pre className="overflow-x-auto rounded-md bg-navy-deepest p-4 font-mono text-sm text-surface">
                Authorization: Bearer &lt;jwt_access_token&gt;
              </pre>
            </article>
          </FadeUp>
          <FadeUp>
            <article className="space-y-4">
              <h2 className="text-subheading text-navy">{t('versioning.title')}</h2>
              <p className="leading-relaxed text-ink">{t('versioning.body')}</p>
              <pre className="overflow-x-auto rounded-md bg-navy-deepest p-4 font-mono text-sm text-surface">
                /api/v1/...
              </pre>
            </article>
          </FadeUp>
        </div>
      </SectionWrapper>

      {/* Endpoint groups */}
      <SectionWrapper className="bg-surface">
        <FadeUp>
          <h2 className="mb-10 text-heading text-navy md:text-heading-lg">{t('groupsTitle')}</h2>
        </FadeUp>
        <StaggerContainer className="grid gap-6 md:grid-cols-2" staggerDelay={80}>
          {ENDPOINT_GROUPS.map(({ key, endpoints }) => (
            <Card key={key} className="border-t-2 border-t-gold">
              <CardHeader>
                <CardTitle className="text-base">{t(`groups.${key}.name`)}</CardTitle>
                <CardDescription className="leading-relaxed">
                  {t(`groups.${key}.description`)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {endpoints.map((endpoint) => (
                    <li
                      key={endpoint}
                      className="overflow-x-auto rounded-sm bg-neutral-100 px-3 py-2 font-mono text-xs text-navy"
                    >
                      {endpoint}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </StaggerContainer>
      </SectionWrapper>

      {/* Rate limiting, pagination, SDK */}
      <SectionWrapper width="narrow">
        <div className="space-y-12">
          <FadeUp>
            <article className="space-y-4">
              <h2 className="text-subheading text-navy">{t('rateLimits.title')}</h2>
              <p className="leading-relaxed text-ink">{t('rateLimits.body')}</p>
            </article>
          </FadeUp>
          <FadeUp>
            <article className="space-y-4">
              <h2 className="text-subheading text-navy">{t('pagination.title')}</h2>
              <p className="leading-relaxed text-ink">{t('pagination.body')}</p>
            </article>
          </FadeUp>
          <FadeUp>
            <article className="space-y-4 border-l-2 border-gold pl-6">
              <h2 className="text-subheading text-navy">{t('sdk.title')}</h2>
              <p className="leading-relaxed text-ink">{t('sdk.body')}</p>
            </article>
          </FadeUp>
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
