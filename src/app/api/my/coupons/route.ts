import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, requireRole, handleError, ApiError } from '@/lib/auth'

const couponSelect = {
  id: true, code: true, type: true, discount_value: true, scope: true,
  seller_id: true, program_id: true, min_price: true, max_discount: true,
  usage_limit: true, per_user_limit: true, used_count: true,
  is_active: true, expires_at: true, description: true, created_at: true,
  creator: { select: { id: true, nickname: true } },
  program: { select: { id: true, title: true } },
}

export async function GET(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    const isAdmin = user.role === 'admin' || user.role === 'manager'

    const { searchParams } = req.nextUrl
    const page  = Math.max(1, Number(searchParams.get('page') ?? 1))
    const limit = 20

    const where = isAdmin ? {} : { created_by: user.userId }

    const [coupons, total] = await Promise.all([
      db.coupon.findMany({ where, select: couponSelect, orderBy: { created_at: 'desc' }, take: limit, skip: (page - 1) * limit }),
      db.coupon.count({ where }),
    ])

    return Response.json({ coupons, total, page, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    // 쿠폰 발급은 admin/manager 전용
    requireRole(user, 'admin', 'manager')

    const { code, type, discountValue, scope, sellerId, programId, minPrice, maxDiscount, usageLimit, perUserLimit, expiresAt, description } = await req.json()

    if (!code || !type || !discountValue || !scope) throw new ApiError(400, '코드, 종류, 할인값, 범위는 필수입니다')
    if (type === 'percentage' && (discountValue < 1 || discountValue > 100)) throw new ApiError(400, '퍼센트 할인은 1~100 사이여야 합니다')
    if (type === 'fixed' && discountValue < 100) throw new ApiError(400, '금액 할인은 100원 이상이어야 합니다')

    const upperCode = (code as string).toUpperCase().trim()
    const exists = await db.coupon.findUnique({ where: { code: upperCode } })
    if (exists) throw new ApiError(400, '이미 사용 중인 쿠폰 코드입니다')

    const coupon = await db.coupon.create({
      data: {
        code: upperCode,
        type,
        discount_value: Number(discountValue),
        scope,
        seller_id: scope === 'seller' ? (sellerId ?? null) : null,
        program_id: scope === 'program' ? programId : null,
        min_price: minPrice ? Number(minPrice) : 0,
        max_discount: maxDiscount ? Number(maxDiscount) : null,
        usage_limit: usageLimit ? Number(usageLimit) : null,
        per_user_limit: perUserLimit ? Number(perUserLimit) : 1,
        expires_at: expiresAt ? new Date(expiresAt) : null,
        description: description ?? null,
        created_by: user.userId,
      },
      select: couponSelect,
    })

    return Response.json({ coupon }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
