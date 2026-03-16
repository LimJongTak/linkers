import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, handleError } from '@/lib/auth'

// 구매·판매자: 내가 등록한 쿠폰 목록 (사용 여부 포함)
export async function GET(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)

    const userCoupons = await db.userCoupon.findMany({
      where: { user_id: user.userId },
      include: {
        coupon: {
          select: {
            id: true, code: true, type: true, discount_value: true,
            scope: true, min_price: true, max_discount: true,
            usage_limit: true, per_user_limit: true, used_count: true,
            is_active: true, expires_at: true, description: true,
          },
        },
      },
      orderBy: { registered_at: 'desc' },
    })

    // 각 쿠폰의 내 사용 횟수 확인
    const couponIds = userCoupons.map(uc => uc.coupon_id)
    const myUsages = await db.couponUsage.groupBy({
      by: ['coupon_id'],
      where: { coupon_id: { in: couponIds }, user_id: user.userId },
      _count: { id: true },
    })
    const usageMap: Record<string, number> = {}
    for (const u of myUsages) usageMap[u.coupon_id] = u._count.id

    const result = userCoupons.map(uc => {
      const c = uc.coupon
      const myUsed = usageMap[c.id] ?? 0
      const expired = c.expires_at ? c.expires_at < new Date() : false
      const exhausted = c.usage_limit !== null && c.used_count >= c.usage_limit
      const usedByMe = myUsed >= c.per_user_limit
      const usable = c.is_active && !expired && !exhausted && !usedByMe
      return {
        id: uc.id,
        registeredAt: uc.registered_at,
        coupon: c,
        myUsedCount: myUsed,
        status: usedByMe ? 'used' : expired ? 'expired' : exhausted ? 'exhausted' : !c.is_active ? 'inactive' : 'available',
        usable,
      }
    })

    return Response.json({ coupons: result })
  } catch (err) {
    return handleError(err)
  }
}
