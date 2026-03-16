import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, issueTokens, ApiError, handleError } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) throw new ApiError(400, '이메일과 비밀번호를 입력해주세요')

    const user = await db.user.findFirst({
      where: { email, oauth_provider: 'email' },
    })
    if (!user || !user.password_hash) throw new ApiError(401, '이메일 또는 비밀번호가 올바르지 않습니다')

    if (!verifyPassword(password, user.password_hash)) {
      throw new ApiError(401, '이메일 또는 비밀번호가 올바르지 않습니다')
    }

    const { accessToken, refreshToken } = issueTokens({ userId: user.id, role: user.role as any })

    const res = NextResponse.json({
      accessToken,
      user: { id: user.id, nickname: user.nickname, role: user.role },
    })

    res.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 7 * 24 * 3600,
    })
    return res
  } catch (err) {
    return handleError(err)
  }
}
