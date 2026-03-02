import { db } from './db'

const FEE_RATE = 0.1 // 10%

export async function createSettlement(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { program: true },
  })
  if (!order) throw new Error(`Order not found: ${orderId}`)

  const grossAmount = order.amount
  const feeAmount = Math.floor(grossAmount * FEE_RATE)
  const netAmount = grossAmount - feeAmount

  // 구매 확정 후 7일 뒤 정산 예정
  const scheduledAt = new Date()
  scheduledAt.setDate(scheduledAt.getDate() + 7)

  await db.settlement.upsert({
    where: { order_id: orderId },
    create: {
      seller_id: order.program.seller_id,
      order_id: orderId,
      gross_amount: grossAmount,
      fee_rate: FEE_RATE,
      fee_amount: feeAmount,
      net_amount: netAmount,
      status: 'pending',
      scheduled_at: scheduledAt,
    },
    update: {},
  })
}
