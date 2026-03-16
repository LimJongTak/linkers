import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, handleError, ApiError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') ?? 'admin'   // 'admin' | 'seller'
    const target = searchParams.get('target') ?? 'sent' // 'sent' | 'received'

    let where: Record<string, unknown> = {}

    if (type === 'admin') {
      // 1:1 문의 (관리자 대상) — 철저한 비공개
      if (target === 'received') {
        // 관리자/매니저만 받은 문의 조회 가능
        if (user.role !== 'admin' && user.role !== 'manager') throw new ApiError(403, 'FORBIDDEN')
        where = { target_type: 'admin' }
      } else {
        // 본인이 보낸 1:1 문의만
        where = { target_type: 'admin', user_id: user.userId }
      }
    } else {
      // 프로그램 문의 (판매자 대상)
      if (target === 'received') {
        if (user.role === 'admin' || user.role === 'manager') {
          where = { target_type: 'seller' }
        } else if (user.role === 'seller') {
          const myPrograms = await db.program.findMany({
            where: { seller_id: user.userId },
            select: { id: true },
          })
          where = { program_id: { in: myPrograms.map(p => p.id) }, target_type: 'seller' }
        } else {
          throw new ApiError(403, 'FORBIDDEN')
        }
      } else {
        where = { target_type: 'seller', user_id: user.userId }
      }
    }

    const inquiries = await db.inquiry.findMany({
      where,
      include: {
        user: { select: { id: true, nickname: true } },
        program: { select: { id: true, title: true } },
        replies: { select: { id: true }, orderBy: { created_at: 'desc' } },
      },
      orderBy: { created_at: 'desc' },
    })

    return Response.json({ inquiries })
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    const { programId, targetType, title, content } = await req.json()

    if (!targetType || !title?.trim() || !content?.trim()) {
      throw new ApiError(400, 'targetType, title, content 필수')
    }
    if (!['seller', 'admin'].includes(targetType)) throw new ApiError(400, '잘못된 targetType')

    // 1:1 문의(admin)는 programId 없어야 함
    if (targetType === 'admin' && programId) throw new ApiError(400, '1:1 문의에는 프로그램을 지정할 수 없습니다')

    // 판매자 문의는 programId 필수
    if (targetType === 'seller' && !programId) throw new ApiError(400, '판매자 문의는 programId 필수')

    if (programId) {
      const program = await db.program.findUnique({ where: { id: programId } })
      if (!program) throw new ApiError(404, '프로그램을 찾을 수 없습니다')
    }

    const inquiry = await db.inquiry.create({
      data: {
        user_id: user.userId,
        program_id: programId ?? null,
        target_type: targetType,
        title: title.trim(),
        content: content.trim(),
      },
    })

    return Response.json({ inquiry }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
