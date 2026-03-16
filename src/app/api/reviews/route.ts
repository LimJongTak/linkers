import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, ApiError, handleError } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    const { orderId, rating, content, photoUrls } = await req.json()

    if (!orderId || !rating || !content) throw new ApiError(400, '필수 필드 누락')
    if (rating < 1 || rating > 5) throw new ApiError(400, '별점은 1~5 사이여야 합니다')
    if (content.length < 10) throw new ApiError(400, '리뷰는 최소 10자 이상이어야 합니다')

    // 실구매자 검증 (결제완료 또는 진행완료 상태)
    const order = await db.order.findFirst({
      where: { id: orderId, buyer_id: user.userId, status: { in: ['paid', 'confirmed'] } },
    })
    if (!order) throw new ApiError(403, '결제 완료 후 리뷰 작성이 가능합니다')

    // 중복 리뷰 방지
    const existing = await db.review.findUnique({ where: { order_id: orderId } })
    if (existing) throw new ApiError(409, '이미 리뷰를 작성하셨습니다')

    const review = await db.review.create({
      data: {
        order_id: orderId,
        buyer_id: user.userId,
        program_id: order.program_id,
        rating,
        content,
        photo_urls: photoUrls ?? [],
      },
    })

    // 평균 별점 캐시 업데이트
    const agg = await db.review.aggregate({
      where: { program_id: order.program_id, is_visible: true },
      _avg: { rating: true },
      _count: { id: true },
    })
    await db.program.update({
      where: { id: order.program_id },
      data: {
        rating_avg: agg._avg.rating ?? 0,
        review_count: agg._count.id,
      },
    })

    return Response.json({ review }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const programId = searchParams.get('programId')
    const sort = searchParams.get('sort') ?? 'recent'
    const ratingFilter = searchParams.get('rating')
    const page = Math.max(1, Number(searchParams.get('page') ?? 1))

    if (!programId) throw new ApiError(400, 'programId 필수')

    const where: any = { program_id: programId, is_visible: true }
    if (ratingFilter) where.rating = Number(ratingFilter)

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        include: { buyer: { select: { nickname: true, profile_image: true } } },
        orderBy: sort === 'helpful' ? { helpful_count: 'desc' } : { created_at: 'desc' },
        take: 10,
        skip: (page - 1) * 10,
      }),
      db.review.count({ where }),
    ])

    return Response.json({ reviews, total, page, hasMore: page * 10 < total })
  } catch (err) {
    return handleError(err)
  }
}
