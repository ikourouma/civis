import type { Metadata } from 'next';
import { ChartLine, Globe2, IdCard, ListChecks, Lock, Megaphone } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PlatformSubpage } from '@/components/marketing/PlatformSubpage';

interface PageProps {
  params: { locale: string };
}

const FEATURE_ICONS = [IdCard, Globe2, ListChecks, ChartLine, Lock, Megaphone] as const;

export async function generateMetadata({ params: { locale } }: PageProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Platform.registry' });
  return { title: t('title') };
}

export default function DiasporaRegistryPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  return <PlatformSubpage section="registry" featureIcons={FEATURE_ICONS} />;
}
