'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';

import { FadeUp } from '@/components/animation/FadeUp';
import { getDefaultRoute } from '@/lib/rbac/roles';
import { signIn } from '@/lib/services/auth/auth.client.service';

export function SignInForm() {
  const t = useTranslations('Auth.signin');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const errorParam = searchParams.get('error');

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState(
    errorParam === 'tenant_suspended'
      ? "Your government's deployment has been temporarily suspended. Contact your administrator."
      : '',
  );
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn({ email: email.trim(), password });

      if (!result.success || !result.session) {
        setError(result.error ?? t('errorGeneric'));
        return;
      }

      const role = result.session.user.role;
      const destination = redirectTo && redirectTo.startsWith(`/${locale}/`)
        ? redirectTo
        : getDefaultRoute(role, locale);
      router.push(destination);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const hasError = error.length > 0;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy-deepest px-6 py-16">
      {/* Wordmark */}
      <FadeUp delay={0}>
        <div className="mb-10 text-center">
          <p className="text-2xl font-bold tracking-widest text-white">
            CIVIS<span className="text-gold">.</span>
          </p>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.15em] text-surface/50">
            {t('brandTagline')}
          </p>
        </div>
      </FadeUp>

      {/* Card */}
      <FadeUp delay={100}>
        <div className="w-full max-w-[440px] rounded-2xl border border-gold/20 bg-navy-deepest p-12 shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
          {/* Card header */}
          <p className="mb-1 text-center text-xs font-semibold uppercase tracking-[0.15em] text-gold">
            {t('subtitle')}
          </p>
          <h1 className="mb-8 text-center text-2xl font-bold text-white">{t('title')}</h1>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-surface/60">
                {t('emailLabel')}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full rounded-lg border px-4 py-3 text-sm text-white outline-none transition-colors
                  bg-navy-panel placeholder:text-surface/30
                  focus:border-gold/60 focus:ring-1 focus:ring-gold/30
                  ${hasError ? 'border-red-400/70' : 'border-white/10'}`}
                placeholder="you@organisation.gov"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-medium text-surface/60"
              >
                {t('passwordLabel')}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full rounded-lg border px-4 py-3 text-sm text-white outline-none transition-colors
                  bg-navy-panel placeholder:text-surface/30
                  focus:border-gold/60 focus:ring-1 focus:ring-gold/30
                  ${hasError ? 'border-red-400/70' : 'border-white/10'}`}
                placeholder="••••••••"
              />
            </div>

            {/* Error */}
            {hasError && (
              <p role="alert" className="text-xs text-red-400">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-navy-deepest transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? t('signingIn') : t('submit')}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-surface/40">{t('trouble')}</p>
        </div>
      </FadeUp>

      {/* Footer */}
      <FadeUp delay={200}>
        <p className="mt-8 text-center text-xs text-white/20">{t('footer')}</p>
      </FadeUp>
    </div>
  );
}
