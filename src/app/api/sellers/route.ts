import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { handleError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 20)))

    // 활성 프로그램이 있는 판매자만, 리뷰 수 기준 정렬
    const sellers = await db.user.findMany({
      where: {
        role: { in: ['seller', 'admin'] },
        programs: { some: { status: 'active' } },
      },
      select: {
        id: true,
        nickname: true,
        profile_image: true,
        created_at: true,
        programs: {
          where: { status: 'active' },
          select: {
            id: true,
            title: true,
            category: true,
            price: true,
            rating_avg: true,
            review_count: true,
            thumbnail_url: true,
            product_type: true,
          },
          orderBy: { review_count: 'desc' },
          take: 3,
        },
        _count: {
          select: {
            programs: { where: { status: 'active' } },
          },
        },
      },
      take: limit * 3, // 필터 후 limit 맞추기 위해 여유분
    })

    // 각 판매자의 전체 리뷰 집계
    const sellerIds = sellers.map(s => s.id)
    const reviewAggs = await db.review.groupBy({
      by: ['program_id'],
      where: {
        program: { seller_id: { in: sellerIds } },
      },
      _count: { id: true },
      _avg: { rating: true },
    })

    // program_id → seller_id 매핑
    const programSellers = await db.program.findMany({
      where: { seller_id: { in: sellerIds } },
      select: { id: true, seller_id: true },
    })
    const progToSeller: Record<string, string> = {}
    for (const p of programSellers) progToSeller[p.id] = p.seller_id

    // seller별 리뷰 집계 합산
    const sellerReviews: Record<string, { count: number; ratingSum: number }> = {}
    for (const agg of reviewAggs) {
      const sid = progToSeller[agg.program_id]
      if (!sid) continue
      if (!sellerReviews[sid]) sellerReviews[sid] = { count: 0, ratingSum: 0 }
      sellerReviews[sid].count += agg._count.id
      sellerReviews[sid].ratingSum += (agg._avg.rating ?? 0) * agg._count.id
    }

    const result = sellers
      .map(s => {
        const rev = sellerReviews[s.id]
        const totalReviews = rev?.count ?? 0
        const avgRating = rev && rev.count > 0 ? rev.ratingSum / rev.count : 0
        return {
          id: s.id,
          nickname: s.nickname,
          profileImage: s.profile_image,
          programCount: s._count.programs,
          totalReviews,
          avgRating: Math.round(avgRating * 10) / 10,
          joinedAt: s.created_at,
          programs: s.programs.map(p => ({
            id: p.id,
            title: p.title,
            category: p.category,
            price: p.price,
            rating: parseFloat(String(p.rating_avg)) || 0,
            reviewCount: p.review_count,
            thumbnailUrl: p.thumbnail_url,
            productType: p.product_type,
          })),
        }
      })
      // 리뷰 많은 순 정렬
      .sort((a, b) => b.totalReviews - a.totalReviews || b.programCount - a.programCount)
      .slice(0, limit)

    return Response.json({ sellers: result })
  } catch (err) {
    return handleError(err)
  }
}
