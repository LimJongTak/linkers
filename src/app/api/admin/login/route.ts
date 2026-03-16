import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { issueTokens, handleError, ApiError } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { secretKey } = await req.json()
    if (!secretKey) throw new ApiError(400, 'SECRET_KEY_REQUIRED')
    if (secretKey !== process.env.ADMIN_INIT_SECRET) {
      throw new ApiError(401, 'INVALID_SECRET_KEY')
    }

    const admin = await db.user.findFirst({
      where: { role: 'admin' },
      select: { id: true, nickname: true, role: true },
    })
    if (!admin) throw new ApiError(404, 'NO_ADMIN_ACCOUNT')

    const { accessToken, refreshToken } = issueTokens({ userId: admin.id, role: 'admin' })

    const response = Response.json({
      accessToken,
      admin: { id: admin.id, nickname: admin.nickname, role: admin.role },
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
