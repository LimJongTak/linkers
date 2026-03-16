import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, handleError, ApiError } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyAccessToken(req)
    const { id } = await params

    const inquiry = await db.inquiry.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, nickname: true } },
        program: { select: { id: true, title: true, seller_id: true } },
        replies: {
          include: { author: { select: { id: true, nickname: true, role: true } } },
          orderBy: { created_at: 'asc' },
        },
      },
    })
    if (!inquiry) throw new ApiError(404, 'NOT_FOUND')

    // 접근 권한: 작성자 본인, 관리자/매니저, 해당 프로그램 판매자
    const isOwner = inquiry.user_id === user.userId
    const isAdmin = user.role === 'admin' || user.role === 'manager'
    const isSeller = inquiry.program?.seller_id === user.userId
    if (!isOwner && !isAdmin && !isSeller) throw new ApiError(403, 'FORBIDDEN')

    return Response.json({ inquiry })
  } catch (err) {
    return handleError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyAccessToken(req)
    const { id } = await params
    const { status } = await req.json()

    const inquiry = await db.inquiry.findUnique({
      where: { id },
      include: { program: { select: { seller_id: true } } },
    })
    if (!inquiry) throw new ApiError(404, 'NOT_FOUND')

    const isAdmin = user.role === 'admin' || user.role === 'manager'
    const isSeller = inquiry.program?.seller_id === user.userId
    if (!isAdmin && !isSeller) throw new ApiError(403, 'FORBIDDEN')

    const updated = await db.inquiry.update({ where: { id }, data: { status } })
    return Response.json({ inquiry: updated })
  } catch (err) {
    return handleError(err)
  }
}
