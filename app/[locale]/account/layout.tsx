import { setRequestLocale } from 'next-intl/server';

import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';

interface AccountLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export default function AccountLayout({ children, params: { locale } }: AccountLayoutProps) {
  setRequestLocale(locale);
  return <WorkspaceShell locale={locale}>{children}</WorkspaceShell>;
}
