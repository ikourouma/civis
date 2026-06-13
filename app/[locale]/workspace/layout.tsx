import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';

export default function WorkspaceLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return <WorkspaceShell locale={locale}>{children}</WorkspaceShell>;
}
