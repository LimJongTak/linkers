import { NextResponse, type NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // CORS
  const origin = req.headers.get('origin') ?? ''
  const allowed = process.env.ALLOWED_ORIGIN ?? 'http://localhost:3000'
  if (origin === allowed || process.env.NODE_ENV === 'development') {
    res.headers.set('Access-Control-Allow-Origin', origin || '*')
    res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    res.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  // Preflight
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: res.headers })
  }

  // 보안 헤더
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return res
}

export const config = {
  matcher: ['/api/:path*'],
}
