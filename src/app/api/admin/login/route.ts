import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { issueTokens, handleError, ApiError, verifyPassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { secretKey, identifier, password } = await req.json()
    if (!secretKey) throw new ApiError(400, 'SECRET_KEY_REQUIRED')
    if (secretKey !== process.env.ADMIN_INIT_SECRET) {
      throw new ApiError(401, 'INVALID_SECRET_KEY')
    }

    // 관리자 계정이 여러 명일 수 있으므로 identifier(이메일 또는 닉네임)로 특정
    let admin
    if (identifier?.trim()) {
      const id = identifier.trim()
      admin = await db.user.findFirst({
        where: {
          role: { in: ['admin', 'manager'] },
          OR: [
            { email: id },
            { nickname: id },
          ],
        },
        select: { id: true, nickname: true, role: true, password_hash: true },
      })
      if (!admin) throw new ApiError(404, '해당 계정을 찾을 수 없거나 관리자/매니저 권한이 없습니다')

      // 이메일 계정(password_hash 있음)은 비밀번호도 확인
      if (admin.password_hash) {
        if (!password) throw new ApiError(400, '이메일 계정은 비밀번호를 입력해주세요')
        const ok = await verifyPassword(password, admin.password_hash)
        if (!ok) throw new ApiError(401, '비밀번호가 올바르지 않습니다')
      }
    } else {
      // identifier 미입력 시 admin 계정이 1명뿐이면 자동 선택
      const admins = await db.user.findMany({
        where: { role: 'admin' },
        select: { id: true, nickname: true, role: true, password_hash: true },
      })
      if (admins.length === 0) throw new ApiError(404, 'NO_ADMIN_ACCOUNT')
      if (admins.length > 1) throw new ApiError(400, '관리자 계정이 여러 명입니다. 이메일 또는 닉네임을 입력해주세요')
      admin = admins[0]

      if (admin.password_hash) {
        if (!password) throw new ApiError(400, '이메일 계정은 비밀번호를 입력해주세요')
        const ok = await verifyPassword(password, admin.password_hash)
        if (!ok) throw new ApiError(401, '비밀번호가 올바르지 않습니다')
      }
    }

    const { accessToken, refreshToken } = issueTokens({ userId: admin.id, role: admin.role as 'admin' | 'manager' })

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
