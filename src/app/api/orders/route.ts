import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, ApiError, handleError } from '@/lib/auth'
import { grantDownloadPermissions } from '@/lib/permissions'
import { createNotification } from '@/lib/notify'
import { sendOrderPaidEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    const { programId, scheduledAt, message, usePoints = 0, couponCode } = await req.json()

    if (!programId) throw new ApiError(400, 'programId 필수')

    const portoneConfigured = !!process.env.NEXT_PUBLIC_PORTONE_STORE_ID

    const [program, buyer] = await Promise.all([
      // PortOne 미설정(개발) 환경에서는 draft/active 모두 구매 가능
      db.program.findUnique({
        where: portoneConfigured
          ? { id: programId, status: 'active' }
          : { id: programId, status: { not: 'deleted' } },
        select: { id: true, price: true, title: true, seller_id: true },
      }),
      db.user.findUniqueOrThrow({ where: { id: user.userId }, select: { points: true } }),
    ])
    if (!program) throw new ApiError(404, '프로그램을 찾을 수 없습니다')

    // 쿠폰 검증
    let couponDiscount = 0
    let couponRecord: { id: string } | null = null
    if (couponCode) {
      const coupon = await db.coupon.findUnique({ where: { code: (couponCode as string).toUpperCase().trim() } })
      if (!coupon || !coupon.is_active) throw new ApiError(400, '유효하지 않은 쿠폰입니다')
      if (coupon.expires_at && coupon.expires_at < new Date()) throw new ApiError(400, '만료된 쿠폰입니다')
      if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) throw new ApiError(400, '사용 한도 초과 쿠폰입니다')
      if (coupon.scope === 'seller' && coupon.seller_id !== program.seller_id) throw new ApiError(400, '이 상품에 사용할 수 없는 쿠폰입니다')
      if (coupon.scope === 'program' && coupon.program_id !== program.id) throw new ApiError(400, '이 상품에 사용할 수 없는 쿠폰입니다')
      if (program.price < coupon.min_price) throw new ApiError(400, `최소 ${coupon.min_price.toLocaleString()}원 이상 구매 시 사용 가능합니다`)
      const userUsage = await db.couponUsage.count({ where: { coupon_id: coupon.id, user_id: user.userId } })
      if (userUsage >= coupon.per_user_limit) throw new ApiError(400, '이미 사용한 쿠폰입니다')
      if (coupon.type === 'percentage') {
        couponDiscount = Math.floor(program.price * coupon.discount_value / 100)
        if (coupon.max_discount) couponDiscount = Math.min(couponDiscount, coupon.max_discount)
      } else {
        couponDiscount = Math.min(coupon.discount_value, program.price)
      }
      couponRecord = coupon
    }

    const discountedPrice = Math.max(0, program.price - couponDiscount)
    const pointsToUse = Math.min(Math.max(0, Math.floor(usePoints)), discountedPrice, buyer.points)
    const cardAmount = discountedPrice - pointsToUse
    const paymentMethod = pointsToUse === 0 ? 'card' : cardAmount === 0 ? 'point' : 'mixed'

    // 주문번호: 날짜 + 랜덤 6자리 (hex) — 동시 요청 충돌 방지
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const randSuffix = Math.random().toString(36).slice(2, 8).toUpperCase()
    const orderNumber = `LK-${today}-${randSuffix}`

    // PortOne 미설정 시 카드 금액도 자동 승인 (개발 환경)
    const isPaid = cardAmount === 0 || !portoneConfigured

    const orderData = {
      order_number: orderNumber,
      buyer_id: user.userId,
      program_id: programId,
      amount: discountedPrice,
      point_amount: pointsToUse,
      payment_method: paymentMethod,
      status: (isPaid ? 'paid' : 'pending') as 'paid' | 'pending',
      payment_id: crypto.randomUUID(),
      scheduled_at: scheduledAt ? new Date(scheduledAt) : null,
      message: message ?? null,
      coupon_discount: couponDiscount,
    }

    let order
    if (pointsToUse > 0) {
      const results = await db.$transaction([
        db.user.update({
          where: { id: user.userId },
          data: {
            points: { decrement: pointsToUse },
            point_transactions: {
              create: {
                amount: -pointsToUse,
                type: 'purchase',
                description: `${program.title} 구매 포인트 차감`,
                reference_id: orderNumber,
              },
            },
          },
        }),
        db.order.create({ data: orderData }),
      ])
      order = results[1]
    } else {
      order = await db.order.create({ data: orderData })
    }

    // 쿠폰 사용 기록
    if (couponRecord) {
      await db.$transaction([
        db.couponUsage.create({
          data: { coupon_id: couponRecord.id, user_id: user.userId, order_id: order.id, discount: couponDiscount },
        }),
        db.coupon.update({
          where: { id: couponRecord.id },
          data: { used_count: { increment: 1 } },
        }),
      ])
    }

    // 결제 완료 시 즉시 다운로드 권한 부여 + 알림 + 이메일
    if (isPaid) {
      await grantDownloadPermissions(order.id)
      await createNotification(
        user.userId,
        'order_paid',
        '결제가 완료되었습니다',
        `"${program.title}" 구매가 완료되었습니다.`,
        '/my/orders'
      )
      const buyerUser = await db.user.findUnique({ where: { id: user.userId }, select: { email: true, nickname: true } })
      if (buyerUser?.email) {
        sendOrderPaidEmail(buyerUser.email, buyerUser.nickname, program.title, discountedPrice, order.id)
      }
    }

    return Response.json({ order, cardAmount, pointsUsed: pointsToUse }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)

    const orders = await db.order.findMany({
      where: { buyer_id: user.userId },
      include: {
        program: { select: { id: true, title: true, category: true, thumbnail_url: true } },
        payment: { select: { paid_at: true, receipt_url: true } },
        permissions: { select: { id: true } },
        review: { select: { id: true, rating: true } },
      },
      orderBy: { created_at: 'desc' },
    })

    return Response.json({ orders })
  } catch (err) {
    return handleError(err)
  }
}
