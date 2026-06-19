import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';

import { LayoutChrome } from '@/components/layout/LayoutChrome';
import { ToastProvider } from '@/components/ui/Toast';
import { isLocale, routing } from '@/i18n/routing';

import '../globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: Omit<LocaleLayoutProps, 'children'>): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return {
    title: {
      default: t('title'),
      template: `%s — ${t('siteName')}`,
    },
    description: t('description'),
    icons: {
      icon: [
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      ],
      apple: '/apple-touch-icon.png',
      other: [{ rel: 'mask-icon', url: '/favicon.svg', color: '#0D1B2E' }],
    },
    manifest: '/manifest.webmanifest',
  };
}

export default async function LocaleLayout({ children, params: { locale } }: LocaleLayoutProps) {
  if (!isLocale(locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} className={inter.variable}>
      <body className="flex min-h-screen flex-col font-sans">
        <NextIntlClientProvider messages={messages}>
          <ToastProvider>
            <LayoutChrome>{children}</LayoutChrome>
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
