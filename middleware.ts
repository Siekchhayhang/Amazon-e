import NextAuth from 'next-auth';
import createMiddleware from 'next-intl/middleware';
import authConfig from './auth.config';
import { routing } from './i18n/routing';
import { NextResponse } from 'next/server';

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
  '/verify-email',
];

const intlMiddleware = createMiddleware(routing)
const { auth } = NextAuth(authConfig)

export default auth(async (req) => {
  const publicPathnameRegex = RegExp(
    `^(/(${routing.locales.join('|')}))?(${publicPages
      .flatMap((p) => (p === '/' ? ['', '/'] : p))
      .join('|')})/?$`,
    'i'
  )
  const isPublicPage = publicPathnameRegex.test(req.nextUrl.pathname)

  // --- Rate Limiting Logic for Sign-in Routes ---
  const isSignInAttempt =
    req.nextUrl.pathname.includes('/sign-in') || // For your direct /sign-in page
    req.nextUrl.pathname.includes('/api/auth/callback/credentials'); // For Auth.js Credentials provider callback

  if (isSignInAttempt) {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      '127.0.0.1';

    try {
      // Call your new API route for rate limiting
      const response = await fetch(
        new URL('/api/rate-limit', req.nextUrl.origin).toString(), // Ensure correct URL
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ip, type: 'signin' }),
        }
      );

      if (!response.ok) {
        // If the API route returns an error (e.g., 429 Too Many Requests)
        const errorData = await response.json();
        return new NextResponse(
          JSON.stringify({ message: errorData.message || 'Too many requests.' }),
          { status: response.status, headers: { 'Content-Type': 'application/json' } }
        );
      }
      // If response.ok, it means allowed: true, so continue
    } catch (error) {
      console.error('Middleware fetch rate limiting error:', error);
      // Decide fail-open or fail-closed on network errors
      // For now, we'll log and continue to avoid blocking valid users if the rate limit service is down.
    }
  }

  if (isPublicPage) {
    //return NextResponse.next()
    return intlMiddleware(req)
  } else {
    if (!req.auth) {
      const newUrl = new URL(
        `/sign-in?callbackUrl=${encodeURIComponent(req.nextUrl.pathname) || '/'
        }`,
        req.nextUrl.origin
      )
      return Response.redirect(newUrl)
    } else {
      return intlMiddleware(req)
    }
  }
})

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};