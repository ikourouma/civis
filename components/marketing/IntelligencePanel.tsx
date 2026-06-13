import { useTranslations } from 'next-intl';

import { CountUp } from '@/components/animation/CountUp';

// Hub-city markers over the map, positioned as percentages of the map
// container. Class strings are literal so Tailwind picks them up; ping
// delays are staggered per Mission 001-B §3.3.
const HOTSPOTS = [
  { key: 'montreal', pos: 'left-[19%] top-[22%]', delay: '[animation-delay:0s]' },
  { key: 'newYork', pos: 'left-[18%] top-[28%]', delay: '[animation-delay:0.4s]' },
  { key: 'london', pos: 'left-[46%] top-[21%]', delay: '[animation-delay:0.8s]' },
  { key: 'paris', pos: 'left-[47%] top-[24%]', delay: '[animation-delay:1.2s]' },
  { key: 'dubai', pos: 'left-[61%] top-[32%]', delay: '[animation-delay:1.6s]' },
  { key: 'johannesburg', pos: 'left-[52%] top-[65%]', delay: '[animation-delay:2s]' },
] as const;

const STATS = [
  { key: 'records', value: 2.4, decimals: 1 },
  { key: 'countries', value: 47, decimals: 0 },
  { key: 'embassies', value: 180, decimals: 0 },
] as const;

const FEED_TONES = ['bg-green-500', 'bg-gold', 'bg-blue-400'] as const;

/**
 * Static, live-feel intelligence card for the home hero (Mission 001-B §3.3):
 * header with active pulse, Africa map with pulsing diaspora hotspots,
 * three CountUp stat tiles, and a three-item intelligence feed.
 * No backend data — capability visual only.
 */
export function IntelligencePanel() {
  const t = useTranslations('Home.hero.panel');

  return (
    <div className="rounded-2xl border border-gold/20 bg-navy-deepest p-6 shadow-[0_24px_64px_rgba(0,0,0,0.4)]">
      {/* Section A — card header */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">{t('label')}</p>
        <p className="flex items-center gap-2 text-xs font-medium text-green-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
          </span>
          {t('status')}
        </p>
      </div>

      {/* Section B — world map with pulsing diaspora hotspots */}
      <div
        role="img"
        aria-label={t('mapLabel')}
        className="relative h-[120px] overflow-hidden rounded-lg bg-navy-panel lg:h-[200px]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/map/world.svg"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover p-2"
        />
        {HOTSPOTS.map(({ key, pos, delay }) => (
          <span
            key={key}
            aria-hidden="true"
            className={`absolute ${pos} flex h-4 w-4 -translate-x-1/2 -translate-y-1/2`}
          >
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-30 ${delay}`}
            />
            <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold" />
          </span>
        ))}
      </div>

      {/* Section C — stat tiles */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {STATS.map(({ key, value, decimals }) => (
          <div key={key} className="rounded-lg bg-navy-panel px-4 py-3">
            <p className="text-2xl font-bold text-white">
              <CountUp value={value} decimals={decimals} />
              <span className="text-gold">{t(`stats.${key}.suffix`)}</span>
            </p>
            <p className="mt-1 text-xs text-surface/60">{t(`stats.${key}.label`)}</p>
          </div>
        ))}
      </div>

      {/* Section D — intelligence feed */}
      <ul className="mt-4 border-t border-white/[0.06] pt-2">
        {FEED_TONES.map((tone, index) => (
          <li
            key={tone}
            className="flex items-center gap-3 border-b border-white/5 py-2 last:border-b-0"
          >
            <span className={`h-2 w-[3px] shrink-0 rounded-sm ${tone}`} aria-hidden="true" />
            <span className="flex-1 text-xs text-surface/70">{t(`feed.item${index + 1}.text`)}</span>
            <span className="shrink-0 text-xs text-surface/40">{t(`feed.item${index + 1}.time`)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
