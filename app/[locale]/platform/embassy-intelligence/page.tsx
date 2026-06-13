import type { Metadata } from 'next';
import { Building2, CalendarClock, Eye, FileText, ShieldCheck, UserRound } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PlatformSubpage } from '@/components/marketing/PlatformSubpage';

interface PageProps {
  params: { locale: string };
}

const FEATURE_ICONS = [Building2, UserRound, Eye, FileText, CalendarClock, ShieldCheck] as const;

export async function generateMetadata({ params: { locale } }: PageProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Platform.embassy' });
  return { title: t('title') };
}

export default function EmbassyIntelligencePage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  return <PlatformSubpage section="embassy" featureIcons={FEATURE_ICONS} />;
}
