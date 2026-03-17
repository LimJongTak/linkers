import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, verifyPassword, ApiError, handleError } from '@/lib/auth'
import { randomUUID } from 'crypto'

export async function DELETE(req: NextRequest) {
  try {
    const auth = verifyAccessToken(req)
    const { password, confirm } = await req.json()

    const user = await db.user.findUnique({ where: { id: auth.userId } })
    if (!user) throw new ApiError(404, '사용자를 찾을 수 없습니다')

    // 이메일 계정: 비밀번호 확인
    if (user.oauth_provider === 'email' || user.oauth_provider === 'internal') {
      if (!password) throw new ApiError(400, '비밀번호를 입력해주세요')
      if (!user.password_hash || !verifyPassword(password, user.password_hash)) {
        throw new ApiError(401, '비밀번호가 올바르지 않습니다')
      }
    } else {
      // 소셜 계정: "탈퇴합니다" 타이핑 확인
      if (confirm !== '탈퇴합니다') {
        throw new ApiError(400, '확인 문구가 올바르지 않습니다')
      }
    }

    // 개인정보 익명화 (기록 보존, PII 삭제)
    await db.user.update({
      where: { id: auth.userId },
      data: {
        email: null,
        nickname: '탈퇴한 사용자',
        phone: null,
        profile_image: null,
        password_hash: null,
        oauth_provider: 'deleted',
        oauth_id: randomUUID(),
        points: 0,
      },
    })

    return Response.json({ success: true })
  } catch (err) {
    return handleError(err)
  }
}
