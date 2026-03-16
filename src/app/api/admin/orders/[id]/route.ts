import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, requireRole, handleError, ApiError } from '@/lib/auth'
import { grantDownloadPermissions } from '@/lib/permissions'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = verifyAccessToken(req)
    requireRole(user, 'admin', 'manager')

    const { action } = await req.json()

    const order = await db.order.findUnique({ where: { id } })
    if (!order) throw new ApiError(404, '주문을 찾을 수 없습니다')

    switch (action) {
      case 'confirm':
        await db.order.update({ where: { id }, data: { status: 'confirmed' } })
        break
      case 'refund':
        await db.order.update({ where: { id }, data: { status: 'refunded' } })
        // 다운로드 권한 취소
        await db.downloadPermission.updateMany({
          where: { order_id: id },
          data: { is_revoked: true },
        })
        // 포인트 환불
        if (order.point_amount > 0) {
          await db.user.update({
            where: { id: order.buyer_id },
            data: {
              points: { increment: order.point_amount },
              point_transactions: {
                create: {
                  amount: order.point_amount,
                  type: 'refund',
                  description: '주문 환불 포인트 복구',
                  reference_id: order.order_number,
                },
              },
            },
          })
        }
        break
      case 'cancel':
        await db.order.update({ where: { id }, data: { status: 'cancelled' } })
        await db.downloadPermission.updateMany({
          where: { order_id: id },
          data: { is_revoked: true },
        })
        break
      case 'grant_permissions':
        await grantDownloadPermissions(id)
        break
      default:
        throw new ApiError(400, '알 수 없는 액션입니다')
    }

    return Response.json({ success: true })
  } catch (err) {
    return handleError(err)
  }
}
