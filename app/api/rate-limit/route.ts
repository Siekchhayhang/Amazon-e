import { checkRateLimit } from '@/lib/rate-limit'
import { NextRequest, NextResponse } from 'next/server'

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || '127.0.0.1'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, type = 'signin' } = body

    const ip = getClientIP(req)
    const identifier = `${email ?? 'anon'}_${ip}`

    const { success, remaining, reset } = await checkRateLimit(identifier, type)

    if (!success) {
      const retryAfterSeconds = reset ? Math.ceil((reset - Date.now()) / 1000) : 10

      return NextResponse.json(
        {
          message: 'Too many requests. Please try again later.',
          retryAfter: new Date(reset ?? Date.now()).toISOString(),
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfterSeconds.toString(),
            'RateLimit-Remaining': '0',
          },
        }
      )
    }

    return NextResponse.json(
      { allowed: true, remaining },
      {
        status: 200,
        headers: {
          'RateLimit-Remaining': remaining.toString(),
        },
      }
    )
  } catch (error) {
    console.error('[RateLimit API] Error:', error)
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
