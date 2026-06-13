import { setRequestLocale } from 'next-intl/server';

import { SignInForm } from '@/components/auth/SignInForm';

interface PageProps {
  params: { locale: string };
}

export default function SignInPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  return <SignInForm />;
}
