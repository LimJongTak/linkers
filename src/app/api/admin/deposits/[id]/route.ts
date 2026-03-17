import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, requireRole, ApiError, handleError } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = verifyAccessToken(req)
    requireRole(admin, 'admin', 'manager')

    const { id } = await params
    const { action, admin_note } = await req.json()

    const deposit = await db.depositRequest.findUnique({
      where: { id },
      include: { user: { select: { id: true, nickname: true } } },
    })
    if (!deposit) throw new ApiError(404, '입금 요청을 찾을 수 없습니다')
    if (deposit.status !== 'pending') throw new ApiError(400, '이미 처리된 요청입니다')

    if (action === 'complete') {
      await db.$transaction([
        db.depositRequest.update({
          where: { id },
          data: { status: 'completed', processed_at: new Date(), admin_note: admin_note ?? null },
        }),
        db.user.update({
          where: { id: deposit.user_id },
          data: {
            points: { increment: deposit.amount },
            point_transactions: {
              create: {
                amount: deposit.amount,
                type: 'charge_bank',
                description: `계좌이체 충전 ${deposit.amount.toLocaleString()}원`,
                reference_id: id,
              },
            },
          },
        }),
      ])
      return Response.json({ success: true })
    }

    if (action === 'reject') {
      await db.depositRequest.update({
        where: { id },
        data: { status: 'rejected', processed_at: new Date(), admin_note: admin_note ?? null },
      })
      return Response.json({ success: true })
    }

    throw new ApiError(400, 'INVALID_ACTION')
  } catch (err) {
    return handleError(err)
  }
}
