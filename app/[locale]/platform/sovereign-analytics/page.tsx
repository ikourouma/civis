import type { Metadata } from 'next';
import { BarChart3, FileOutput, FileSpreadsheet, Map, Target, TrendingUp } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PlatformSubpage } from '@/components/marketing/PlatformSubpage';

interface PageProps {
  params: { locale: string };
}

const FEATURE_ICONS = [BarChart3, Map, TrendingUp, FileSpreadsheet, Target, FileOutput] as const;

export async function generateMetadata({ params: { locale } }: PageProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Platform.analytics' });
  return { title: t('title') };
}

export default function SovereignAnalyticsPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  return <PlatformSubpage section="analytics" featureIcons={FEATURE_ICONS} />;
}
