import { NextRequest } from 'next/server'
import { PortOne } from '@portone/server-sdk'
import { db } from '@/lib/db'
import { verifyAccessToken, ApiError, handleError } from '@/lib/auth'
import { grantDownloadPermissions } from '@/lib/permissions'
import { createSettlement } from '@/lib/settlements'
import { sendPaymentCompleteNotifications } from '@/lib/kakao'

const portone = PortOne.init(process.env.PORTONE_API_SECRET!)

export async function POST(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    const { paymentId, orderId } = await req.json()

    if (!paymentId || !orderId) throw new ApiError(400, '필수 파라미터 누락')

    // 1. 주문 확인
    const order = await db.order.findFirst({
      where: { id: orderId, buyer_id: user.userId, status: 'pending' },
    })
    if (!order) throw new ApiError(404, '주문을 찾을 수 없습니다')

    // 2. 포트원 실제 결제 정보 조회
    const payment = await portone.payment.getPayment(paymentId)

    // 3. ⚠️ 금액 위변조 검증 (절대 생략 금지!)
    if (payment.amount.total !== order.amount) {
      console.error(`[FRAUD] 금액 불일치 주문:${order.amount} 실결제:${payment.amount.total} 사용자:${user.userId}`)
      throw new ApiError(400, '결제 금액이 일치하지 않습니다')
    }

    if (payment.status !== 'PAID') {
      throw new ApiError(400, `결제 미완료: ${payment.status}`)
    }

    // 4. 중복 처리 방지 (Webhook + Verify 경쟁 조건)
    const existing = await db.payment.findUnique({ where: { imp_uid: paymentId } })
    if (existing) return Response.json({ success: true, message: '이미 처리된 결제입니다' })

    // 5. 원자적 처리
    await db.$transaction([
      db.payment.create({
        data: {
          order_id: orderId,
          pg_provider: (payment as any).channel?.pgProvider ?? 'unknown',
          pg_tid: (payment as any).pgTxId ?? '',
          imp_uid: paymentId,
          paid_amount: payment.amount.total,
          paid_at: new Date((payment as any).paidAt ?? Date.now()),
          receipt_url: (payment as any).receiptUrl ?? '',
          raw_response: payment as any,
        },
      }),
      db.order.update({ where: { id: orderId }, data: { status: 'paid' } }),
    ])

    // 6. 후속 처리
    await Promise.allSettled([
      grantDownloadPermissions(orderId),
      createSettlement(orderId),
      sendPaymentCompleteNotifications(orderId),
    ])

    return Response.json({ success: true, orderId })
  } catch (err) {
    return handleError(err)
  }
}
