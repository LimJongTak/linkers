import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, handleError, ApiError } from '@/lib/auth'
import { grantDownloadPermissions } from '@/lib/permissions'
import { createNotification } from '@/lib/notify'
import { awardPurchasePoints } from '@/lib/pointReward'

export async function POST(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    const { paymentMethod = 'point', usePoints } = await req.json()

    const cartItems = await db.cartItem.findMany({
      where: { user_id: user.userId },
      include: { program: { select: { id: true, price: true, title: true, seller_id: true, status: true } } },
    })
    if (cartItems.length === 0) throw new ApiError(400, '장바구니가 비어 있습니다')

    const availableItems = cartItems.filter(ci => ci.program.status !== 'deleted')
    if (availableItems.length === 0) throw new ApiError(400, '구매 가능한 상품이 없습니다')

    const totalPrice = availableItems.reduce((sum, ci) => sum + ci.program.price, 0)

    const buyer = await db.user.findUniqueOrThrow({
      where: { id: user.userId },
      select: { points: true },
    })

    const pointsToUse = paymentMethod === 'point'
      ? Math.min(Math.floor(usePoints ?? totalPrice), totalPrice, buyer.points)
      : 0

    if (paymentMethod === 'point' && buyer.points < totalPrice) {
      throw new ApiError(400, `포인트가 부족합니다. 보유 ${buyer.points.toLocaleString()}P / 필요 ${totalPrice.toLocaleString()}P`)
    }

    const portoneConfigured = !!process.env.NEXT_PUBLIC_PORTONE_STORE_ID
    const isPaid = paymentMethod === 'point' || !portoneConfigured

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')

    const orders: { id: string; program_id: string }[] = []

    for (let i = 0; i < availableItems.length; i++) {
      const ci = availableItems[i]
      const randSuffix = Math.random().toString(36).slice(2, 8).toUpperCase()
      const orderNumber = `LK-${today}-${randSuffix}`
      const itemPoints = paymentMethod === 'point' ? ci.program.price : 0

      const order = await db.order.create({
        data: {
          order_number: orderNumber,
          buyer_id: user.userId,
          program_id: ci.program.id,
          amount: ci.program.price,
          point_amount: itemPoints,
          payment_method: paymentMethod,
          status: isPaid ? 'paid' : 'pending',
          payment_id: crypto.randomUUID(),
        },
      })
      orders.push({ id: order.id, program_id: ci.program.id })
    }

    // 포인트 차감
    if (pointsToUse > 0) {
      await db.user.update({
        where: { id: user.userId },
        data: {
          points: { decrement: pointsToUse },
          point_transactions: {
            create: {
              amount: -pointsToUse,
              type: 'purchase',
              description: `장바구니 ${availableItems.length}개 상품 구매`,
              reference_id: orders[0].id,
            },
          },
        },
      })
    }

    // 다운로드 권한 부여 + 알림
    if (isPaid) {
      await Promise.all(orders.map(o => grantDownloadPermissions(o.id)))
      await createNotification(
        user.userId,
        'order_paid',
        '결제가 완료되었습니다',
        `장바구니 ${orders.length}개 상품 구매가 완료되었습니다.`,
        '/my/orders'
      )
      awardPurchasePoints(user.userId, totalPrice, orders[0].id)
    }

    // 장바구니 비우기
    await db.cartItem.deleteMany({ where: { user_id: user.userId, program_id: { in: availableItems.map(ci => ci.program.id) } } })

    return Response.json({ orders, total: totalPrice, pointsUsed: pointsToUse }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
