import { createServerClient, type SetAllCookies } from '@supabase/ssr';
import createIntlMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';

import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

// Path segments (after stripping locale) that require an active session
const PROTECTED_PREFIXES = ['/admin', '/workspace', '/intelligence', '/executive', '/portal'];

function isProtectedPath(pathname: string): boolean {
  const withoutLocale = pathname.replace(/^\/(en|fr)/, '');
  return PROTECTED_PREFIXES.some((prefix) => withoutLocale.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isProtectedPath(pathname)) {
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

    // getUser() makes a server-side token verification — more secure than getSession()
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const locale = pathname.split('/')[1] ?? 'en';
      return NextResponse.redirect(new URL(`/${locale}/auth/signin`, request.url));
    }

    return response;
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(en|fr)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
