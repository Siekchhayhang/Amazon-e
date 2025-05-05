import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

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

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Modified isPublic check to allow for optional trailing slashes and query parameters
  const isPublic = publicPages.some((path) => new RegExp(`^${path}(\\?.*)?$`, 'i').test(pathname) || new RegExp(`^${path}/(\\?.*)?$`, 'i').test(pathname));
  const isAdminPage = pathname.startsWith('/admin') || pathname.includes('/admin');

  const token = await getToken({ req, secret: process.env.AUTH_SECRET });

  if (isPublic) {
    return intlMiddleware(req);
  }

  if (!token) {
    return NextResponse.redirect(
      new URL(`/sign-in?callbackUrl=${encodeURIComponent(pathname)}`, req.url)
    );
  }

  if (isAdminPage && token.role !== 'Admin') {
    return NextResponse.redirect(new URL('/access-denied', req.url));
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};