import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';

import { SignInForm } from '@/components/auth/SignInForm';

interface PageProps {
  params: { locale: string };
}

export default function SignInPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  return (
    <Suspense fallback={<div className="min-h-screen bg-navy-deepest" />}>
      <SignInForm />
    </Suspense>
  );
}
