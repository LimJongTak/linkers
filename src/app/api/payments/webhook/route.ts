import { NextRequest } from 'next/server'
import { PortOne } from '@portone/server-sdk'
import { db } from '@/lib/db'
import { grantDownloadPermissions } from '@/lib/permissions'
import { handleError } from '@/lib/auth'

const portone = PortOne.init(process.env.PORTONE_API_SECRET!)

export async function POST(req: NextRequest) {
  try {
    const body = await req.text() // raw body 필수 (서명 검증)

    let webhook: any
    try {
      webhook = await portone.webhook.verify(
        process.env.PORTONE_WEBHOOK_SECRET!,
        body,
        {
          'webhook-id': req.headers.get('webhook-id')!,
          'webhook-timestamp': req.headers.get('webhook-timestamp')!,
          'webhook-signature': req.headers.get('webhook-signature')!,
        }
      )
    } catch {
      console.error('[Webhook] 서명 검증 실패')
      return new Response('Invalid signature', { status: 401 })
    }

    switch (webhook.type) {
      case 'Transaction.Paid': {
        const payment = await portone.payment.getPayment(webhook.data.paymentId)
        const orderId = (payment as any).customData?.orderId
        if (!orderId) break

        await db.payment.upsert({
          where: { imp_uid: payment.paymentId },
          create: {
            order_id: orderId,
            pg_provider: (payment as any).channel?.pgProvider ?? 'unknown',
            pg_tid: (payment as any).pgTxId ?? '',
            imp_uid: payment.paymentId,
            paid_amount: payment.amount.total,
            paid_at: new Date(),
            raw_response: payment as any,
          },
          update: {},
        })

        await db.order.updateMany({
          where: { id: orderId, status: 'pending' },
          data: { status: 'paid' },
        })

        await grantDownloadPermissions(orderId)
        break
      }

      case 'Transaction.Cancelled': {
        const imp_uid = webhook.data.paymentId
        await db.order.updateMany({
          where: { payment: { imp_uid } },
          data: { status: 'refunded' },
        })
        // 다운로드 권한 회수
        const payment = await db.payment.findUnique({ where: { imp_uid } })
        if (payment) {
          await db.downloadPermission.updateMany({
            where: { order_id: payment.order_id },
            data: { is_revoked: true },
          })
        }
        break
      }
    }

    return new Response('OK')
  } catch (err) {
    return handleError(err)
  }
}
