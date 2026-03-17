import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, requireRole, handleError, ApiError } from '@/lib/auth'
import { randomUUID } from 'crypto'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = verifyAccessToken(req)
    requireRole(admin, 'admin', 'manager')

    const { id } = await params
    const { action, role, points, reason, nickname, phone, email } = await req.json()

    const target = await db.user.findUnique({ where: { id } })
    if (!target) throw new ApiError(404, 'USER_NOT_FOUND')

    if (action === 'change_role') {
      // 역할 변경은 관리자만 가능
      if (admin.role !== 'admin') throw new ApiError(403, '역할 변경은 관리자만 가능합니다')
      if (!['buyer', 'seller', 'manager', 'admin'].includes(role)) throw new ApiError(400, 'INVALID_ROLE')

      // 매니저 역할은 관리자만 부여/변경 가능
      if ((role === 'manager' || target.role === 'manager') && admin.role !== 'admin') {
        throw new ApiError(403, '매니저 역할은 관리자만 변경할 수 있습니다')
      }

      // 관리자 역할은 관리자만 부여 가능하며 최대 3명
      if (role === 'admin') {
        if (admin.role !== 'admin') throw new ApiError(403, '관리자 역할은 관리자만 부여할 수 있습니다')
        const adminCount = await db.user.count({ where: { role: 'admin' } })
        if (adminCount >= 3) throw new ApiError(400, '관리자는 최대 3명까지만 설정할 수 있습니다')
      }

      const updated = await db.user.update({
        where: { id },
        data: { role },
        select: { id: true, nickname: true, role: true },
      })
      return Response.json({ user: updated })
    }

    if (action === 'grant_points') {
      const amount = parseInt(points)
      if (!amount || amount <= 0 || amount > 1_000_000) throw new ApiError(400, 'INVALID_AMOUNT')
      const updated = await db.user.update({
        where: { id },
        data: {
          points: { increment: amount },
          point_transactions: {
            create: {
              amount,
              type: 'charge_admin',
              description: reason ? `관리자 지급: ${reason}` : '관리자 포인트 지급',
            },
          },
        },
        select: { id: true, nickname: true, points: true },
      })
      return Response.json({ user: updated })
    }

    if (action === 'deduct_points') {
      const amount = parseInt(points)
      if (!amount || amount <= 0) throw new ApiError(400, 'INVALID_AMOUNT')
      if (target.points < amount) throw new ApiError(400, 'INSUFFICIENT_POINTS')
      const updated = await db.user.update({
        where: { id },
        data: {
          points: { decrement: amount },
          point_transactions: {
            create: {
              amount: -amount,
              type: 'charge_admin',
              description: reason ? `관리자 차감: ${reason}` : '관리자 포인트 차감',
            },
          },
        },
        select: { id: true, nickname: true, points: true },
      })
      return Response.json({ user: updated })
    }

    if (action === 'update_profile') {
      const data: Record<string, string | null> = {}
      if (nickname !== undefined) {
        if (typeof nickname !== 'string' || nickname.trim().length < 2) throw new ApiError(400, '닉네임은 2자 이상이어야 합니다')
        data.nickname = nickname.trim()
      }
      if (phone !== undefined) data.phone = phone || null
      if (email !== undefined) {
        if (admin.role !== 'admin') throw new ApiError(403, '이메일 변경은 관리자만 가능합니다')
        data.email = email || null
      }
      if (Object.keys(data).length === 0) throw new ApiError(400, '변경할 항목이 없습니다')
      const updated = await db.user.update({
        where: { id },
        data,
        select: { id: true, nickname: true, email: true, phone: true, role: true },
      })
      return Response.json({ user: updated })
    }

    throw new ApiError(400, 'INVALID_ACTION')
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = verifyAccessToken(req)
    requireRole(admin, 'admin')
    const { id } = await params
    const { secret } = await req.json()

    if (!secret || secret !== process.env.ADMIN_INIT_SECRET) {
      throw new ApiError(403, '관리자 시크릿 키가 올바르지 않습니다')
    }
    if (admin.userId === id) throw new ApiError(400, '자기 자신은 탈퇴시킬 수 없습니다')

    const target = await db.user.findUnique({ where: { id } })
    if (!target) throw new ApiError(404, '사용자를 찾을 수 없습니다')

    // 개인정보 익명화 (기록 보존, PII 삭제)
    await db.user.update({
      where: { id },
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
