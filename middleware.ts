import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

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
  const { pathname } = req.nextUrl
  const isPublic = publicPages.some((path) => new RegExp(`^${path}$`, 'i').test(pathname))
  const isAdminPage = pathname.startsWith('/admin') || pathname.includes('/admin')

  // ✅ Grab token with explicit secret
  const token = await getToken({ req, secret: process.env.AUTH_SECRET })
  if (isPublic) {
    return intlMiddleware(req)
  }
  console.log('pathname:', pathname)
  console.log('Request URL:', req.url)
  console.log('Token:', token)
  console.log('isPublic:', isPublic)
  if (!token) {
    return NextResponse.redirect(
      new URL(`/sign-in?callbackUrl=${encodeURIComponent(pathname)}`, req.url)
    )
  }

  if (isAdminPage && token.role !== 'Admin') {
    return NextResponse.redirect(new URL('/access-denied', req.url))
  }

  return intlMiddleware(req)
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
