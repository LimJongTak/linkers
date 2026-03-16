// POST /api/admin/init — 최초 관리자 계정 생성 (관리자가 0명일 때만 작동)
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { issueTokens, handleError, ApiError } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const adminCount = await db.user.count({ where: { role: 'admin' } })
    if (adminCount > 0) throw new ApiError(403, 'ADMIN_ALREADY_EXISTS')

    const { nickname, secretKey } = await req.json()
    if (secretKey !== process.env.ADMIN_INIT_SECRET) {
      throw new ApiError(401, 'INVALID_SECRET_KEY')
    }
    if (!nickname?.trim()) throw new ApiError(400, 'NICKNAME_REQUIRED')

    const admin = await db.user.create({
      data: {
        nickname: nickname.trim(),
        role: 'admin',
        oauth_provider: 'internal',
        oauth_id: `admin_${Date.now()}`,
        points: 0,
      },
    })

    const { accessToken, refreshToken } = issueTokens({ userId: admin.id, role: 'admin' })

    const response = Response.json({
      success: true,
      admin: { id: admin.id, nickname: admin.nickname, role: admin.role },
      accessToken,
    })
    response.headers.append(
      'Set-Cookie',
      `refresh_token=${refreshToken}; HttpOnly; Path=/api/auth; Max-Age=${7 * 24 * 3600}`
    )
    return response
  } catch (err) {
    return handleError(err)
  }
}
