import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { issueTokens, handleError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code')
    if (!code) return Response.json({ error: 'No code' }, { status: 400 })

    const clientId     = process.env.GOOGLE_CLIENT_ID!
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
    const redirectUri  = process.env.GOOGLE_REDIRECT_URI ?? `${process.env.NEXT_PUBLIC_API_BASE}/api/auth/google/callback`

    // code → access_token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) throw new Error('구글 토큰 발급 실패')

    // 사용자 정보
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const googleUser = await userRes.json()

    const user = await db.user.upsert({
      where: {
        oauth_provider_oauth_id: { oauth_provider: 'google', oauth_id: String(googleUser.id) },
      },
      create: {
        email: googleUser.email ?? null,
        nickname: googleUser.name ?? googleUser.email?.split('@')[0] ?? `user_${String(googleUser.id).slice(-4)}`,
        profile_image: googleUser.picture ?? null,
        oauth_provider: 'google',
        oauth_id: String(googleUser.id),
        role: 'buyer',
      },
      update: {
        nickname: googleUser.name,
        profile_image: googleUser.picture,
      },
    })

    const { accessToken, refreshToken } = issueTokens({ userId: user.id, role: user.role as any })

    const redirectUrl = new URL('/login', process.env.NEXT_PUBLIC_API_BASE!)
    redirectUrl.searchParams.set('at', accessToken)
    redirectUrl.searchParams.set('uid', user.id)
    redirectUrl.searchParams.set('nick', user.nickname)
    redirectUrl.searchParams.set('role', user.role)

    const response = NextResponse.redirect(redirectUrl)
    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 7 * 24 * 3600,
    })
    return response
  } catch (err) {
    return handleError(err)
  }
}
