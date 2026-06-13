import type { Metadata } from 'next';
import { CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { FadeUp } from '@/components/animation/FadeUp';
import { SectionWrapper } from '@/components/layout/SectionWrapper';

interface PageProps {
  params: { locale: string };
}

interface ChangelogEntry {
  version: string;
  date: string;
  summary: string;
  items: string[];
}

export async function generateMetadata({ params: { locale } }: PageProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Resources.changelog' });
  return { title: t('title') };
}

export default function ChangelogPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const t = useTranslations('Resources.changelog');

  const entries = t.raw('entries') as ChangelogEntry[];

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

      <SectionWrapper width="narrow">
        <div className="space-y-16">
          {entries.map((entry) => (
            <FadeUp key={entry.version}>
              <article className="space-y-6 border-l-2 border-gold pl-8">
                <header className="space-y-1">
                  <p className="text-sm font-medium text-neutral-500">{entry.date}</p>
                  <h2 className="text-subheading text-navy">{entry.version}</h2>
                  <p className="leading-relaxed text-ink">{entry.summary}</p>
                </header>
                <ul className="space-y-3">
                  {entry.items.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success-teal" aria-hidden="true" />
                      <span className="text-sm leading-relaxed text-ink">{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </FadeUp>
          ))}
        </div>
      </SectionWrapper>
    </>
  );
}
