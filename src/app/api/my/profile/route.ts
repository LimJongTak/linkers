import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, ApiError, handleError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const auth = verifyAccessToken(req)
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, nickname: true, email: true, phone: true, profile_image: true, oauth_provider: true, role: true },
    })
    if (!user) throw new ApiError(404, '사용자를 찾을 수 없습니다')
    return Response.json({ user })
  } catch (err) {
    return handleError(err)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = verifyAccessToken(req)
    const { nickname, phone, profile_image, role } = await req.json()

    if (nickname !== undefined) {
      if (typeof nickname !== 'string' || nickname.trim().length < 2) {
        throw new ApiError(400, '닉네임은 2자 이상이어야 합니다')
      }
    }

    if (phone !== undefined && phone !== '' && phone !== null) {
      if (!/^[0-9]{10,11}$/.test(phone.replace(/-/g, ''))) {
        throw new ApiError(400, '올바른 전화번호 형식이 아닙니다')
      }
    }

    if (role !== undefined && !['buyer', 'seller'].includes(role)) {
      throw new ApiError(400, '유효하지 않은 역할입니다')
    }

    const data: Record<string, string | null> = {}
    if (nickname !== undefined) data.nickname = nickname.trim()
    if (phone !== undefined) data.phone = phone || null
    if (profile_image !== undefined) data.profile_image = profile_image || null
    if (role !== undefined) data.role = role

    const updated = await db.user.update({
      where: { id: auth.userId },
      data,
      select: { id: true, nickname: true, email: true, phone: true, profile_image: true, role: true },
    })

    return Response.json({ user: updated })
  } catch (err) {
    return handleError(err)
  }
}
