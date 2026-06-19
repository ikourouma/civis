import { createServerClient, type SetAllCookies } from '@supabase/ssr';
import createIntlMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';

import { routing } from './i18n/routing';
import { ROUTE_PERMISSIONS, getDefaultRoute, getProtectedPrefix } from './lib/rbac/roles';
import type { PlatformRole } from './lib/services/auth/auth.types';

const intlMiddleware = createIntlMiddleware(routing);

function stripLocale(pathname: string): { withoutLocale: string; locale: 'en' | 'fr' } {
  const locale = pathname.startsWith('/fr') ? 'fr' : 'en';
  const withoutLocale = pathname.replace(/^\/(en|fr)/, '') || '/';
  return { withoutLocale, locale };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { withoutLocale, locale } = stripLocale(pathname);
  const protectedPrefix = getProtectedPrefix(withoutLocale);

  if (!protectedPrefix) {
    return intlMiddleware(request);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll: ((cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        }) satisfies SetAllCookies,
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const signInUrl = new URL(`/${locale}/auth/signin`, request.url);
    signInUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Pull the role + active state to enforce route permissions
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active, tenant_id')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.is_active) {
    return NextResponse.redirect(new URL(`/${locale}/auth/signin`, request.url));
  }

  const userRole = profile.role as PlatformRole;

  // Tenant lifecycle: block sign-in for suspended / archived deployments (D3).
  if (userRole !== 'super_admin' && profile.tenant_id) {
    const { data: tenant } = await supabase
      .from('civis_tenants')
      .select('status, deleted_at')
      .eq('id', profile.tenant_id)
      .single();
    if (tenant && (tenant.status === 'suspended' || tenant.status === 'archived' || tenant.deleted_at)) {
      const signInUrl = new URL(`/${locale}/auth/signin`, request.url);
      signInUrl.searchParams.set('error', 'tenant_suspended');
      return NextResponse.redirect(signInUrl);
    }
  }
  const allowedRoles = ROUTE_PERMISSIONS[protectedPrefix];

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return NextResponse.redirect(new URL(getDefaultRoute(userRole, locale), request.url));
  }

  return response;
}

export const config = {
  matcher: ['/', '/(en|fr)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
