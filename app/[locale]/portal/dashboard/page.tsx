import { ArrowRight, CheckCircle2, ClipboardList, FileText } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { getCurrentUser } from '@/lib/services/auth';
import { getMyRegistrantRecord } from '@/lib/services/registrants';
import { cn } from '@/lib/utils';

interface PageProps {
  params: { locale: string };
}

const STATUS_CONFIG: Record<string, { label: string; badge: string; description: string }> = {
  pending_review: {
    label: 'Under Review',
    badge: 'bg-gold/15 text-gold',
    description: 'Your registration is being reviewed by the consular team. You will be notified of any updates.',
  },
  verified: {
    label: 'Verified',
    badge: 'bg-emerald-400/15 text-emerald-400',
    description: 'Your registration has been approved. Welcome to the Civis diaspora registry.',
  },
  rejected: {
    label: 'Action Required',
    badge: 'bg-red-400/15 text-red-400',
    description: 'Your registration requires attention. Please review the notes from the consular team.',
  },
  unverified: {
    label: 'Submitted',
    badge: 'bg-white/5 text-surface/60',
    description: 'Your registration has been submitted and is awaiting review.',
  },
};

export default async function PortalDashboardPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const t = await getTranslations('Portal');

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth/signin`);

  const registrant = await getMyRegistrantRecord(user.id);
  const firstName = user.fullName?.split(' ')[0] ?? 'there';

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">{t('eyebrow')}</p>
        <h1 className="mt-2 text-3xl font-bold text-white">
          {t('welcome', { name: firstName })}
        </h1>
        <p className="mt-1 text-sm text-surface/60">{t('subtitle')}</p>
      </header>

      {!registrant ? (
        <div className="overflow-hidden rounded-xl border border-gold/20 bg-navy-deep">
          <div className="bg-gold/5 p-8 text-center">
            <ClipboardList className="mx-auto mb-4 h-10 w-10 text-gold/60" />
            <h2 className="text-lg font-bold text-white">{t('register_prompt_title')}</h2>
            <p className="mt-2 text-sm text-surface/60">{t('register_prompt_body')}</p>
            <Link
              href="/portal/register"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-bold text-navy-deepest transition-opacity hover:opacity-90"
            >
              {t('register_cta')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-3 divide-x divide-white/5 border-t border-white/5">
            {[t('step_1'), t('step_2'), t('step_3')].map((step, i) => (
              <div key={i} className="p-4 text-center">
                <div className="mx-auto mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-gold/10 text-xs font-bold text-gold">
                  {i + 1}
                </div>
                <p className="text-xs text-surface/60">{step}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-white/5 bg-navy-deep">
            <div className="flex items-start justify-between border-b border-white/5 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-surface/40">
                  {t('status_label')}
                </p>
                <h2 className="mt-1 text-xl font-bold text-white">
                  {registrant.firstName} {registrant.lastName}
                </h2>
              </div>
              <span
                className={cn(
                  'rounded px-2 py-1 text-xs font-semibold',
                  STATUS_CONFIG[registrant.verificationStatus]?.badge ?? 'bg-white/5 text-surface/60',
                )}
              >
                {STATUS_CONFIG[registrant.verificationStatus]?.label ?? registrant.verificationStatus}
              </span>
            </div>
            <div className="p-6">
              <p className="text-sm text-surface/70">
                {STATUS_CONFIG[registrant.verificationStatus]?.description}
              </p>
              {registrant.rejectionReason && (
                <div className="mt-4 rounded-lg border border-red-400/20 bg-red-400/5 p-4">
                  <p className="text-xs font-semibold text-red-400">Notes from consular team</p>
                  <p className="mt-1 text-sm text-surface/80">{registrant.rejectionReason}</p>
                </div>
              )}
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-surface/50">{t('completeness')}</p>
                  <p className="text-xs font-bold text-gold">{registrant.profileCompletenessScore}%</p>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gold transition-all"
                    style={{ width: `${registrant.profileCompletenessScore}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/5 bg-navy-deep p-5">
              <FileText className="mb-3 h-5 w-5 text-gold/60" />
              <h3 className="text-sm font-semibold text-white">{t('link_documents')}</h3>
              <p className="mt-1 text-xs text-surface/50">{t('link_documents_desc')}</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-navy-deep p-5">
              <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-400/60" />
              <h3 className="text-sm font-semibold text-white">{t('link_consent')}</h3>
              <p className="mt-1 text-xs text-surface/50">{t('link_consent_desc')}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
