import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, handleError, ApiError } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    const { code, programId } = await req.json()
    if (!code || !programId) throw new ApiError(400, '쿠폰 코드와 프로그램 ID가 필요합니다')

    const program = await db.program.findUnique({
      where: { id: programId },
      select: { id: true, price: true, seller_id: true, title: true, sale_price: true, sale_start_at: true, sale_end_at: true },
    })
    if (!program) throw new ApiError(404, '프로그램을 찾을 수 없습니다')

    // 세일 유효 여부 확인 후 실제 적용 가격 계산
    const now = new Date()
    const isSaleActive = !!(
      program.sale_price && program.sale_price > 0 && program.sale_price < program.price &&
      (!program.sale_start_at || program.sale_start_at <= now) &&
      (!program.sale_end_at || program.sale_end_at >= now)
    )
    const effectivePrice = isSaleActive ? program.sale_price! : program.price

    const coupon = await db.coupon.findUnique({ where: { code: code.toUpperCase().trim() } })
    if (!coupon) throw new ApiError(404, '존재하지 않는 쿠폰 코드입니다')
    if (!coupon.is_active) throw new ApiError(400, '비활성화된 쿠폰입니다')
    if (coupon.expires_at && coupon.expires_at < new Date()) throw new ApiError(400, '만료된 쿠폰입니다')
    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) throw new ApiError(400, '사용 한도가 초과된 쿠폰입니다')

    // 적용 범위 확인
    if (coupon.scope === 'seller' && coupon.seller_id !== program.seller_id) throw new ApiError(400, '이 판매자의 상품에는 사용할 수 없는 쿠폰입니다')
    if (coupon.scope === 'program' && coupon.program_id !== program.id) throw new ApiError(400, '이 상품에는 사용할 수 없는 쿠폰입니다')

    // 최소 금액 확인 (세일가 기준)
    if (effectivePrice < coupon.min_price) throw new ApiError(400, `최소 ${coupon.min_price.toLocaleString()}원 이상 구매 시 사용 가능합니다`)

    // 유저별 사용 횟수 확인
    const userUsageCount = await db.couponUsage.count({ where: { coupon_id: coupon.id, user_id: user.userId } })
    if (userUsageCount >= coupon.per_user_limit) throw new ApiError(400, '이미 사용한 쿠폰입니다')

    // 할인 금액 계산 (세일가 기준)
    let discount = 0
    if (coupon.type === 'percentage') {
      discount = Math.floor(effectivePrice * coupon.discount_value / 100)
      if (coupon.max_discount) discount = Math.min(discount, coupon.max_discount)
    } else {
      discount = Math.min(coupon.discount_value, effectivePrice)
    }
    discount = Math.max(0, discount)

    return Response.json({
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        discountValue: coupon.discount_value,
        maxDiscount: coupon.max_discount,
        description: coupon.description,
      },
      discount,
      finalPrice: effectivePrice - discount,
    })
  } catch (err) {
    return handleError(err)
  }
}
