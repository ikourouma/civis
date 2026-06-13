import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { FadeUp } from '@/components/animation/FadeUp';
import { SectionWrapper } from '@/components/layout/SectionWrapper';

interface PageProps {
  params: { locale: string };
}

interface LegalSection {
  title: string;
  body: string;
  items: string[];
}

interface ComplianceRow {
  standard: string;
  status: string;
  scope: string;
}

const DOCUMENTS = [
  { key: 'privacy', id: 'privacy-policy' },
  { key: 'terms', id: 'terms-of-service' },
  { key: 'dpa', id: 'data-processing-agreement' },
  { key: 'cookies', id: 'cookie-policy' },
] as const;

const COMPLIANCE_ID = 'compliance';

export async function generateMetadata({ params: { locale } }: PageProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Legal' });
  return { title: t('title') };
}

export default function LegalPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const t = useTranslations('Legal');

  const complianceRows = t.raw('compliance.rows') as ComplianceRow[];

  return (
    <>
      <SectionWrapper className="bg-navy-deepest py-20 text-surface md:py-24">
        <FadeUp>
          <div className="max-w-3xl space-y-6">
            <h1 className="text-display text-white md:text-display-lg">{t('title')}</h1>
            <p className="text-lg leading-relaxed text-surface/80">{t('subtitle')}</p>
            <p className="text-sm text-surface/60">
              {t('effectiveDate')} · {t('version')}
            </p>
          </div>
        </FadeUp>
      </SectionWrapper>

      <SectionWrapper>
        <div className="grid gap-12 lg:grid-cols-[240px_1fr]">
          {/* Sticky anchor navigation */}
          <nav aria-label={t('navLabel')} className="lg:sticky lg:top-24 lg:self-start">
            <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
              {DOCUMENTS.map(({ key, id }) => (
                <li key={key}>
                  <a
                    href={`#${id}`}
                    className="block rounded-md px-3 py-2 text-sm font-medium text-neutral-500 transition-colors hover:bg-surface hover:text-navy"
                  >
                    {t(`nav.${key}`)}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={`#${COMPLIANCE_ID}`}
                  className="block rounded-md px-3 py-2 text-sm font-medium text-neutral-500 transition-colors hover:bg-surface hover:text-navy"
                >
                  {t('nav.compliance')}
                </a>
              </li>
            </ul>
          </nav>

          {/* Documents */}
          <div className="min-w-0 space-y-20">
            {DOCUMENTS.map(({ key, id }) => {
              const sections = t.raw(`${key}.sections`) as LegalSection[];
              return (
                <section key={key} id={id} className="scroll-mt-24 space-y-8">
                  <header className="space-y-2 border-b-2 border-gold pb-4">
                    <h2 className="text-heading text-navy">{t(`${key}.title`)}</h2>
                    <p className="text-sm text-neutral-500">
                      {t('effectiveDate')} · {t('version')}
                    </p>
                  </header>
                  {sections.map((section, index) => (
                    <article key={section.title} className="space-y-3">
                      <h3 className="text-lg font-semibold text-navy">
                        {index + 1}. {section.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-ink">{section.body}</p>
                      {section.items.length > 0 && (
                        <ul className="list-disc space-y-2 pl-6">
                          {section.items.map((item) => (
                            <li key={item} className="text-sm leading-relaxed text-ink">
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </article>
                  ))}
                </section>
              );
            })}

            {/* Compliance table */}
            <section id={COMPLIANCE_ID} className="scroll-mt-24 space-y-8">
              <header className="space-y-2 border-b-2 border-gold pb-4">
                <h2 className="text-heading text-navy">{t('compliance.title')}</h2>
                <p className="text-sm text-neutral-500">{t('compliance.intro')}</p>
              </header>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-surface text-left">
                      <th scope="col" className="px-4 py-3 font-semibold text-navy">
                        {t('compliance.headers.standard')}
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold text-navy">
                        {t('compliance.headers.status')}
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold text-navy">
                        {t('compliance.headers.scope')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {complianceRows.map((row) => (
                      <tr key={row.standard} className="border-b border-neutral-200">
                        <td className="px-4 py-3 font-medium text-navy">{row.standard}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-2 text-success-teal">
                            <span className="h-2 w-2 rounded-full bg-success-teal" aria-hidden="true" />
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-ink">{row.scope}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm leading-relaxed text-neutral-500">{t('compliance.contact')}</p>
            </section>
          </div>
        </div>
      </SectionWrapper>
    </>
  );
}
