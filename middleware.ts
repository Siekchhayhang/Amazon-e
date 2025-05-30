import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import createMiddleware from 'next-intl/middleware';
import authConfig from './auth.config';
import { routing } from './i18n/routing';

const publicPages = [
  '/',
  '/search',
  '/sign-in',
  '/sign-up',
  '/cart',
  '/cart/(.*)',
  '/product/(.*)',
  '/page/(.*)',
  '/forgot-password',
  '/reset-password',
  '/access-denied',
];

const intlMiddleware = createMiddleware(routing);
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  // ⛔️ Force HTTPS in production
  if (
    process.env.NODE_ENV === 'production' &&
    req.headers.get('x-forwarded-proto') !== 'https'
  ) {
    const secureUrl = new URL(req.url);
    secureUrl.protocol = 'https:';
    return NextResponse.redirect(secureUrl);
  }

  // 🌍 Handle i18n public routing
  const publicPathnameRegex = RegExp(
    `^(/(${routing.locales.join('|')}))?(${publicPages
      .flatMap((p) => (p === '/' ? ['', '/'] : p))
      .join('|')})/?$`,
    'i'
  );

  const isPublicPage = publicPathnameRegex.test(req.nextUrl.pathname);

  if (isPublicPage) {
    return intlMiddleware(req);
  }

  // 🔒 Authentication check
  if (!req.auth) {
    const callbackUrl = encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search);
    const newUrl = new URL(`/sign-in?callbackUrl=${callbackUrl}`, req.nextUrl.origin);
    return NextResponse.redirect(newUrl);
  }

  // 🔐 Admin protection
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (req.auth?.user?.role !== 'admin') {
      return NextResponse.redirect(new URL('/access-denied', req.nextUrl.origin));
    }
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
