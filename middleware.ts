// import { getToken } from 'next-auth/jwt'
// import { NextRequest, NextResponse } from 'next/server'
// import createMiddleware from 'next-intl/middleware'
// import { routing } from './i18n/routing'

// const intlMiddleware = createMiddleware(routing)

// const publicPages = [
//   '/',
//   '/search',
//   '/sign-in',
//   '/sign-up',
//   '/cart',
//   '/cart/(.*)',
//   '/product/(.*)',
//   '/page/(.*)',
//   '/forgot-password',
//   '/reset-password',
//   '/access-denied',
// ]

// export default async function middleware(req: NextRequest) {
//   const { pathname } = req.nextUrl
//   const isPublic = publicPages.some((path) => new RegExp(`^${path}$`, 'i').test(pathname))
//   const isAdminPage = pathname.startsWith('/admin') || pathname.includes('/admin')

//   // ✅ Grab token with explicit secret
//   const token = await getToken({ req, secret: process.env.AUTH_SECRET })
//   if (isPublic) {
//     return intlMiddleware(req)
//   }
//   console.log('pathname:', pathname)
//   console.log('Request URL:', req.url)
//   console.log('Token:', token)
//   console.log('isPublic:', isPublic)
//   if (!token) {
//     return NextResponse.redirect(
//       new URL(`/sign-in?callbackUrl=${encodeURIComponent(pathname)}`, req.url)
//     )
//   }

//   if (isAdminPage && token.role !== 'Admin') {
//     return NextResponse.redirect(new URL('/access-denied', req.url))
//   }

//   return intlMiddleware(req)
// }

// export const config = {
//   matcher: [
//     '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
//   ],
// }


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
]

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = publicPages.some((path) => new RegExp(`^<span class="math-inline">\{path\}</span>`, 'i').test(pathname));
  const isAdminPage = pathname.startsWith('/admin') || pathname.includes('/admin');

  console.log('Vercel - Pathname:', pathname);
  console.log('Vercel - Request URL:', req.url);
  console.log('Vercel - Cookies:', req.headers.get('cookie'));

  // ✅ Grab token with explicit secret
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  console.log('Vercel - Token Result:', token);
  console.log('Vercel - isPublic:', isPublic);

  if (isPublic) {
    return intlMiddleware(req);
  }
  console.log('pathname:', pathname)
  console.log('Request URL:', req.url)
  console.log('Token:', token)
  console.log('isPublic:', isPublic)
  if (!token) {
    console.log('Vercel - Redirecting to sign-in due to no token');
    return NextResponse.redirect(
      new URL(`/sign-in?callbackUrl=${encodeURIComponent(pathname)}`, req.url)
    );
  }

  if (isAdminPage && token.role !== 'Admin') {
    console.log('Vercel - Redirecting to access-denied due to role:', token.role);
    return NextResponse.redirect(new URL('/access-denied', req.url));
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',],
};