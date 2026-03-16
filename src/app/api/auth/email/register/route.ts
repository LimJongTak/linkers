import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, issueTokens, ApiError, handleError } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password, nickname } = await req.json()

    if (!email || !password || !nickname) throw new ApiError(400, '이메일, 비밀번호, 닉네임을 모두 입력해주세요')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, '올바른 이메일 형식이 아닙니다')
    if (password.length < 8) throw new ApiError(400, '비밀번호는 8자 이상이어야 합니다')
    if (nickname.trim().length < 2) throw new ApiError(400, '닉네임은 2자 이상이어야 합니다')

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) throw new ApiError(409, '이미 사용 중인 이메일입니다')

    const user = await db.user.create({
      data: {
        email,
        nickname: nickname.trim(),
        oauth_provider: 'email',
        oauth_id: email,
        password_hash: hashPassword(password),
        role: 'buyer',
      },
    })

    const { accessToken, refreshToken } = issueTokens({ userId: user.id, role: user.role as any })

    const res = NextResponse.json({
      accessToken,
      user: { id: user.id, nickname: user.nickname, role: user.role },
    }, { status: 201 })

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
