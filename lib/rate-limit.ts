import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } from './constants'

let redis: Redis | null = null
let ratelimit: Ratelimit | null = null

const redisUrl = UPSTASH_REDIS_REST_URL
const redisToken = UPSTASH_REDIS_REST_TOKEN

if (redisUrl && redisToken) {
  try {
    redis = new Redis({
      url: redisUrl,
      token: redisToken,
    })
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '10 s'),
      analytics: true,
      timeout: 1000,
    })
  } catch (error) {
    console.error('Failed to initialize Redis or Ratelimit:', error)
  }
}

export async function checkRateLimit(
  identifier: string,
  type: 'signin' | 'general' = 'general'
) {
  if (!redis || !ratelimit) {
    console.warn('[RateLimit] Redis not configured. Skipping checks.')
    return { success: true, remaining: 10 }
  }

  try {
    const result = await ratelimit.limit(`${type}_${identifier}`)
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset, // timestamp (ms)
    }
  } catch (error) {
    console.error('[RateLimit] Failed to check:', error)
    return { success: true, remaining: 10 }
  }
}

