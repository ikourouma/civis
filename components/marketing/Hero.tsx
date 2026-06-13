import { useTranslations } from 'next-intl';

import { FadeUp } from '@/components/animation/FadeUp';
import { IntelligencePanel } from '@/components/marketing/IntelligencePanel';
import { ScrollIndicator } from '@/components/marketing/ScrollIndicator';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

/**
 * Home hero — Mission 001-B §3: two-column on desktop with left-aligned
 * narrative and a live-feel intelligence panel; single column on mobile
 * with the panel stacked below the narrative.
 */
export function Hero() {
  const t = useTranslations('Home');

  const heroBadges = t.raw('hero.badges') as string[];

  return (
    <section className="relative flex min-h-screen items-center bg-navy-deepest px-6 py-24 text-surface">
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]"
        aria-hidden="true"
      >
        <defs>
          <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="#EAF2FA" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>

      <div className="relative mx-auto w-full max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-[55fr_45fr]">
          {/* Left column — narrative */}
          <div className="flex flex-col items-start text-left">
            <FadeUp delay={0}>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">
                {t('hero.eyebrow')}
              </p>
            </FadeUp>
            <FadeUp delay={100}>
              <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-white lg:text-6xl">
                {t('hero.headline1')}
                <br />
                {t('hero.headline2')}
              </h1>
            </FadeUp>
            <FadeUp delay={200}>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-surface/80 lg:text-xl">
                {t('hero.subtitle')}
              </p>
            </FadeUp>
            <FadeUp delay={300}>
              <div className="mt-10 flex flex-wrap gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-gold px-8 text-navy-deepest hover:bg-gold/90"
                >
                  <Link href="/contact">{t('hero.primaryCta')}</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-surface/40 bg-transparent px-8 text-surface hover:bg-surface hover:text-navy"
                >
                  <Link href="/platform">{t('hero.secondaryCta')}</Link>
                </Button>
              </div>
            </FadeUp>
            <FadeUp delay={400}>
              <ul className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2">
                {heroBadges.map((badge, index) => (
                  <li key={badge} className="flex items-center gap-6">
                    {index > 0 && (
                      <span
                        className="hidden h-1 w-1 rounded-full bg-gold/60 sm:block"
                        aria-hidden="true"
                      />
                    )}
                    <span className="text-xs font-medium uppercase tracking-wider text-surface/60">
                      {badge}
                    </span>
                  </li>
                ))}
              </ul>
            </FadeUp>
          </div>

          {/* Right column — intelligence panel, arrives with the subtitle */}
          <FadeUp delay={200} className="mt-12 mb-16 lg:my-0">
            <IntelligencePanel />
          </FadeUp>
        </div>
      </div>

      <ScrollIndicator />
    </section>
  );
}
