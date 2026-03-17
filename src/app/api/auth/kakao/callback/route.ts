// src/app/api/auth/kakao/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { db } from '@/lib/db'
import { issueTokens, handleError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code')
    if (!code) return Response.json({ error: 'No code' }, { status: 400 })

    // code → access_token
    const tokenRes = await axios.post(
      'https://kauth.kakao.com/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_CLIENT_ID!,
        client_secret: process.env.KAKAO_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_API_BASE ?? req.nextUrl.origin}/api/auth/kakao/callback`,
        code,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )

    // 사용자 정보
    const userRes = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
    })

    const { id, kakao_account } = userRes.data

    const user = await db.user.upsert({
      where: {
        oauth_provider_oauth_id: { oauth_provider: 'kakao', oauth_id: String(id) },
      },
      create: {
        email: kakao_account?.email ?? null,
        nickname: kakao_account?.profile?.nickname ?? `사용자_${String(id).slice(-4)}`,
        profile_image: kakao_account?.profile?.thumbnail_image_url ?? null,
        oauth_provider: 'kakao',
        oauth_id: String(id),
        role: 'buyer',
      },
      update: {
        nickname: kakao_account?.profile?.nickname,
        profile_image: kakao_account?.profile?.thumbnail_image_url,
      },
    })

    const { accessToken, refreshToken } = issueTokens({
      userId: user.id,
      role: user.role as any,
    })

    // Access Token은 쿼리스트링으로 전달, /login에서 처리 후 /my로 이동
    const redirectUrl = new URL('/login', process.env.NEXT_PUBLIC_API_BASE ?? req.nextUrl.origin)
    redirectUrl.searchParams.set('at', accessToken)
    redirectUrl.searchParams.set('uid', user.id)
    redirectUrl.searchParams.set('nick', user.nickname)
    redirectUrl.searchParams.set('role', user.role)

    const response = NextResponse.redirect(redirectUrl)
    // Refresh Token → HttpOnly 쿠키
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
