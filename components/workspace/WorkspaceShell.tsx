import { redirect } from 'next/navigation';

import { BrandProvider } from '@/components/providers/BrandProvider';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { WorkspaceHeader } from '@/components/workspace/WorkspaceHeader';
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebar';
import { tierForBrandSource } from '@/lib/branding/tier-rules';
import { getCurrentUser } from '@/lib/services/auth';
import { getDefaultBrand, getTenantBrand } from '@/lib/services/branding';

interface WorkspaceShellProps {
  children: React.ReactNode;
  locale: string;
  title?: string;
}

// Shared authenticated workspace chrome — sidebar + top header + content area.
// Used by /admin, /workspace, /intelligence, /executive, /portal layouts.
// Performs its own session check as defense-in-depth (middleware is first line).
export async function WorkspaceShell({ children, locale, title }: WorkspaceShellProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/auth/signin`);
  }

  // Resolve the tenant's sovereign brand (falls back to the Afronovation platform brand).
  const brand = user.tenantId ? await getTenantBrand(user.tenantId) : await getDefaultBrand();
  const tier = tierForBrandSource(brand?.brandSource);

  return (
    <SessionProvider user={user}>
      <BrandProvider initialBrand={brand} tier={tier}>
        <div className="flex h-screen overflow-hidden bg-navy-deepest text-surface">
          <WorkspaceSidebar user={user} locale={locale} />
          <div className="flex flex-1 flex-col overflow-hidden">
            <WorkspaceHeader user={user} title={title} />
            <main className="flex-1 overflow-y-auto bg-navy-deepest px-6 py-8 lg:px-10">
              {children}
            </main>
          </div>
        </div>
      </BrandProvider>
    </SessionProvider>
  );
}
