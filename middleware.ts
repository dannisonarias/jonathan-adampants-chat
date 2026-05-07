import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  // Only rate-limit the chat API
  if (!req.nextUrl.pathname.startsWith('/api/chat')) {
    return NextResponse.next()
  }

  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

  // Skip rate limiting if Upstash is not configured (local / self-hosted)
  if (!upstashUrl || !upstashToken) {
    return NextResponse.next()
  }

  const { Ratelimit } = await import('@upstash/ratelimit')
  const { Redis } = await import('@upstash/redis')

  const ratelimit = new Ratelimit({
    redis: new Redis({ url: upstashUrl, token: upstashToken }),
    limiter: Ratelimit.slidingWindow(10, '24 h'),
  })

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'anonymous'
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return new NextResponse('Daily message limit reached. Try again tomorrow.', { status: 429 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/chat',
}
