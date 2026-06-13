'use client';

import { usePathname } from 'next/navigation';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { CookieBanner } from '@/components/legal/CookieBanner';

// Workspace + auth routes own their own full-screen chrome and skip the
// marketing Header/Footer. Everything else gets the public chrome.
const NON_MARKETING = /^\/(en|fr)\/(admin|workspace|intelligence|executive|portal|auth|account)(\/|$)/;

export function LayoutChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const skipChrome = NON_MARKETING.test(pathname);

  if (skipChrome) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CookieBanner />
    </>
  );
}
