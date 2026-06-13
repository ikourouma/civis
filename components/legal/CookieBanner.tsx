'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

const CONSENT_COOKIE = 'civis_cookie_consent';
const CONSENT_MAX_AGE = 60 * 60 * 24 * 365; // 365 days

function hasConsentCookie(): boolean {
  return document.cookie.split('; ').some((entry) => entry.startsWith(`${CONSENT_COOKIE}=`));
}

/**
 * Privacy consent banner — fixed to the bottom of the viewport on first
 * load. Not dismissible without a choice; the decision is stored in the
 * `civis_cookie_consent` cookie (native cookie API, no library).
 */
export function CookieBanner() {
  const t = useTranslations('CookieBanner');
  const [visible, setVisible] = React.useState(false);

  // Cookie state is only knowable client-side — defer the visibility
  // decision to mount so server and client markup stay consistent.
  React.useEffect(() => {
    if (!hasConsentCookie()) {
      setVisible(true);
    }
  }, []);

  function decide(value: 'essential' | 'all') {
    document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${CONSENT_MAX_AGE}; samesite=lax`;
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label={t('regionLabel')}
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-gold bg-navy-deepest text-surface"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
        <p className="max-w-3xl text-sm leading-relaxed text-surface/80">
          {t('message')}{' '}
          <Link
            href="/legal#cookie-policy"
            className="font-medium text-gold underline-offset-4 hover:underline"
          >
            {t('privacyLink')}
          </Link>
        </p>
        <div className="flex flex-col gap-3 sm:flex-row md:shrink-0">
          <Button
            variant="outline"
            className="w-full border-surface/40 bg-transparent text-surface hover:bg-surface hover:text-navy sm:w-auto"
            onClick={() => decide('essential')}
          >
            {t('essentialOnly')}
          </Button>
          <Button
            className="w-full bg-gold text-navy-deepest hover:bg-gold/90 sm:w-auto"
            onClick={() => decide('all')}
          >
            {t('acceptAll')}
          </Button>
        </div>
      </div>
    </div>
  );
}
