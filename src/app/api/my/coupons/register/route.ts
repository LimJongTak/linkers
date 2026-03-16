import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, handleError, ApiError } from '@/lib/auth'

// 구매·판매자: 쿠폰 코드 입력 → 지갑에 등록
export async function POST(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    const { code } = await req.json()
    if (!code) throw new ApiError(400, '쿠폰 코드를 입력해주세요')

    const coupon = await db.coupon.findUnique({ where: { code: (code as string).toUpperCase().trim() } })
    if (!coupon) throw new ApiError(404, '존재하지 않는 쿠폰 코드입니다')
    if (!coupon.is_active) throw new ApiError(400, '사용할 수 없는 쿠폰입니다')
    if (coupon.expires_at && coupon.expires_at < new Date()) throw new ApiError(400, '만료된 쿠폰입니다')
    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) throw new ApiError(400, '이미 소진된 쿠폰입니다')

    // 이미 등록됐는지 확인
    const existing = await db.userCoupon.findUnique({
      where: { user_id_coupon_id: { user_id: user.userId, coupon_id: coupon.id } },
    })
    if (existing) throw new ApiError(400, '이미 등록된 쿠폰입니다')

    // 인당 사용 횟수 초과 여부 (이미 모두 썼으면 등록 의미 없음)
    const usedCount = await db.couponUsage.count({ where: { coupon_id: coupon.id, user_id: user.userId } })
    if (usedCount >= coupon.per_user_limit) throw new ApiError(400, '이미 사용한 쿠폰입니다')

    await db.userCoupon.create({ data: { user_id: user.userId, coupon_id: coupon.id } })

    return Response.json({
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        discount_value: coupon.discount_value,
        max_discount: coupon.max_discount,
        scope: coupon.scope,
        min_price: coupon.min_price,
        expires_at: coupon.expires_at,
        description: coupon.description,
      },
    }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
