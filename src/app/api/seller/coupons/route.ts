import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, handleError, ApiError } from '@/lib/auth'
import { randomUUID } from 'crypto'

export async function GET(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)

    const coupons = await db.coupon.findMany({
      where: { created_by: user.userId, scope: { in: ['seller', 'program'] } },
      include: {
        _count: { select: { usages: true } },
      },
      orderBy: { created_at: 'desc' },
    })

    return Response.json({
      coupons: coupons.map(c => ({
        id: c.id,
        code: c.code,
        type: c.type,
        discountValue: c.discount_value,
        scope: c.scope,
        programId: c.program_id,
        minPrice: c.min_price,
        maxDiscount: c.max_discount,
        usageLimit: c.usage_limit,
        perUserLimit: c.per_user_limit,
        usedCount: c._count.usages,
        isActive: c.is_active,
        expiresAt: c.expires_at,
        description: c.description,
        createdAt: c.created_at,
      })),
    })
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    const {
      type, discountValue, scope, programId,
      minPrice, maxDiscount, usageLimit, perUserLimit,
      expiresAt, description,
    } = await req.json()

    if (!type || !['fixed', 'percent'].includes(type)) throw new ApiError(400, 'type은 fixed 또는 percent')
    if (!discountValue || discountValue <= 0) throw new ApiError(400, '할인값은 0보다 커야 합니다')
    if (type === 'percent' && discountValue > 100) throw new ApiError(400, '비율 할인은 100% 이하')
    if (!scope || !['seller', 'program'].includes(scope)) throw new ApiError(400, 'scope은 seller 또는 program')

    // program scope이면 programId 확인 및 소유 검증
    if (scope === 'program') {
      if (!programId) throw new ApiError(400, '프로그램 쿠폰은 programId 필수')
      const prog = await db.program.findUnique({ where: { id: programId } })
      if (!prog) throw new ApiError(404, '프로그램을 찾을 수 없습니다')
      if (prog.seller_id !== user.userId) throw new ApiError(403, '본인 프로그램에만 쿠폰을 만들 수 있습니다')
    }

    // 고유 코드 생성 (6자리 대문자)
    const code = randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()

    const coupon = await db.coupon.create({
      data: {
        code,
        type,
        discount_value: parseInt(discountValue),
        scope,
        seller_id: scope === 'seller' ? user.userId : null,
        program_id: scope === 'program' ? programId : null,
        min_price: minPrice ? parseInt(minPrice) : 0,
        max_discount: maxDiscount ? parseInt(maxDiscount) : null,
        usage_limit: usageLimit ? parseInt(usageLimit) : null,
        per_user_limit: perUserLimit ? parseInt(perUserLimit) : 1,
        expires_at: expiresAt ? new Date(expiresAt) : null,
        description: description?.trim() || null,
        created_by: user.userId,
      },
    })

    return Response.json({ coupon }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
