import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, requireRole, handleError, ApiError } from '@/lib/auth'
import { createNotification } from '@/lib/notify'
import { sendWithdrawalEmail } from '@/lib/email'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = verifyAccessToken(req)
    requireRole(user, 'admin', 'manager')

    const { id } = await params
    const { action, note } = await req.json()

    const withdrawal = await db.withdrawal.findUnique({ where: { id } })
    if (!withdrawal) throw new ApiError(404, 'WITHDRAWAL_NOT_FOUND')

    const statusMap: Record<string, string> = {
      approve:  'processing',
      complete: 'completed',
      reject:   'rejected',
    }
    const newStatus = statusMap[action]
    if (!newStatus) throw new ApiError(400, 'INVALID_ACTION')

    const updated = await db.withdrawal.update({
      where: { id },
      data: {
        status:       newStatus as any,
        admin_note:   note ?? withdrawal.admin_note,
        processed_at: ['completed', 'rejected'].includes(newStatus) ? new Date() : withdrawal.processed_at,
      },
    })

    if (newStatus === 'completed') {
      await createNotification(
        withdrawal.seller_id,
        'withdrawal_processed',
        '환전 신청이 처리되었습니다',
        `${withdrawal.amount.toLocaleString()}원 환전이 완료되었습니다.`,
        '/my/sales'
      )
      const seller = await db.user.findUnique({ where: { id: withdrawal.seller_id }, select: { email: true, nickname: true } })
      if (seller?.email) sendWithdrawalEmail(seller.email, seller.nickname, withdrawal.amount, 'completed')
    } else if (newStatus === 'rejected') {
      await createNotification(
        withdrawal.seller_id,
        'withdrawal_processed',
        '환전 신청이 반려되었습니다',
        `${withdrawal.amount.toLocaleString()}원 환전 신청이 반려되었습니다.${note ? ` 사유: ${note}` : ''}`,
        '/my/sales'
      )
      const seller = await db.user.findUnique({ where: { id: withdrawal.seller_id }, select: { email: true, nickname: true } })
      if (seller?.email) sendWithdrawalEmail(seller.email, seller.nickname, withdrawal.amount, 'rejected', note)
    }

    return Response.json({ withdrawal: updated })
  } catch (err) {
    return handleError(err)
  }
}
