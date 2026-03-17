import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, ApiError, handleError, hashPassword, verifyPassword } from '@/lib/auth'

export async function PUT(req: NextRequest) {
  try {
    const auth = verifyAccessToken(req)
    const { currentPassword, newPassword } = await req.json()

    if (!currentPassword || !newPassword) {
      throw new ApiError(400, '현재 비밀번호와 새 비밀번호를 입력해주세요')
    }
    if (newPassword.length < 8) {
      throw new ApiError(400, '새 비밀번호는 8자 이상이어야 합니다')
    }

    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { oauth_provider: true, password_hash: true },
    })
    if (!user) throw new ApiError(404, '사용자를 찾을 수 없습니다')
    if (user.oauth_provider !== 'email') {
      throw new ApiError(400, '소셜 로그인 계정은 비밀번호를 변경할 수 없습니다')
    }
    if (!user.password_hash || !verifyPassword(currentPassword, user.password_hash)) {
      throw new ApiError(401, '현재 비밀번호가 올바르지 않습니다')
    }

    await db.user.update({
      where: { id: auth.userId },
      data: { password_hash: hashPassword(newPassword) },
    })

    return Response.json({ success: true })
  } catch (err) {
    return handleError(err)
  }
}
