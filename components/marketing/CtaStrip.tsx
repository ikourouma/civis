import { useTranslations } from 'next-intl';

import { FadeUp } from '@/components/animation/FadeUp';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

interface CtaStripProps {
  /** Secondary CTA target — defaults to the deployment tiers page. */
  secondaryHref?: string;
  /** Translation key under Common for the secondary CTA label. */
  secondaryLabelKey?: 'viewDeployment' | 'viewSecurity';
}

/**
 * Closing call-to-action band shared by platform subpages and hub pages —
 * primary action always routes to the government briefing request.
 */
export function CtaStrip({
  secondaryHref = '/deployment',
  secondaryLabelKey = 'viewDeployment',
}: CtaStripProps) {
  const t = useTranslations('Common');

  return (
    <SectionWrapper className="bg-navy-deepest text-surface">
      <FadeUp>
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <h2 className="text-heading text-white md:text-heading-lg">{t('ctaStripTitle')}</h2>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg" className="bg-gold text-navy-deepest hover:bg-gold/90">
              <Link href="/contact">{t('requestBriefing')}</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-surface/40 bg-transparent text-surface hover:bg-surface hover:text-navy"
            >
              <Link href={secondaryHref}>{t(secondaryLabelKey)}</Link>
            </Button>
          </div>
        </div>
      </FadeUp>
    </SectionWrapper>
  );
}
