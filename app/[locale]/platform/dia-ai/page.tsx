import type { Metadata } from 'next';
import { BrainCircuit, FileText, Lock, Network, SearchCheck, TrendingUp } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PlatformSubpage } from '@/components/marketing/PlatformSubpage';

interface PageProps {
  params: { locale: string };
}

const FEATURE_ICONS = [BrainCircuit, Network, TrendingUp, FileText, SearchCheck, Lock] as const;

export async function generateMetadata({ params: { locale } }: PageProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Platform.dia' });
  return { title: t('title') };
}

export default function DiaAiPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  return <PlatformSubpage section="dia" featureIcons={FEATURE_ICONS} />;
}
