import { useTranslations } from 'next-intl';

// Representative African Union member states. Flag emojis are symbols, not
// translatable text; country names come from the Home.auTrust namespace.
const AU_STATES = [
  { key: 'nigeria', flag: '🇳🇬' },
  { key: 'ghana', flag: '🇬🇭' },
  { key: 'kenya', flag: '🇰🇪' },
  { key: 'senegal', flag: '🇸🇳' },
  { key: 'coteDIvoire', flag: '🇨🇮' },
  { key: 'cameroon', flag: '🇨🇲' },
  { key: 'ethiopia', flag: '🇪🇹' },
  { key: 'rwanda', flag: '🇷🇼' },
  { key: 'guinea', flag: '🇬🇳' },
  { key: 'morocco', flag: '🇲🇦' },
  { key: 'southAfrica', flag: '🇿🇦' },
  { key: 'tanzania', flag: '🇹🇿' },
] as const;

interface AuFlagRowProps {
  /** Visual context — adjusts text color for light or dark surfaces. */
  tone?: 'light' | 'dark';
}

export function AuFlagRow({ tone = 'light' }: AuFlagRowProps) {
  const t = useTranslations('Home.auTrust.countries');

  return (
    <ul className="flex gap-8 overflow-x-auto pb-2" aria-label={t('listLabel')}>
      {AU_STATES.map(({ key, flag }) => (
        <li key={key} className="flex min-w-fit flex-col items-center gap-2">
          <span className="text-3xl leading-none" aria-hidden="true">
            {flag}
          </span>
          <span
            className={
              tone === 'dark'
                ? 'whitespace-nowrap text-xs font-medium text-surface/70'
                : 'whitespace-nowrap text-xs font-medium text-neutral-500'
            }
          >
            {t(key)}
          </span>
        </li>
      ))}
    </ul>
  );
}
