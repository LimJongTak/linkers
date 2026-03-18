import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { handleError, ApiError } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const seller = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        nickname: true,
        profile_image: true,
        bio: true,
        created_at: true,
        programs: {
          where: { status: 'active' },
          select: {
            id: true, product_type: true, title: true, subtitle: true,
            category: true, target_levels: true, region: true, price: true,
            file_format: true, page_count: true, duration: true, max_participants: true,
            rating_avg: true, review_count: true, tags: true, thumbnail_url: true,
          },
          orderBy: { review_count: 'desc' },
        },
        _count: {
          select: { programs: { where: { status: 'active' } } },
        },
      },
    })

    if (!seller) throw new ApiError(404, 'SELLER_NOT_FOUND')

    // aggregate reviews
    const reviewAgg = await db.review.aggregate({
      where: { program: { seller_id: id } },
      _count: { id: true },
      _avg: { rating: true },
    })

    return Response.json({
      seller: {
        id: seller.id,
        nickname: seller.nickname,
        profileImage: seller.profile_image,
        bio: seller.bio ?? null,
        joinedAt: seller.created_at,
        programCount: seller._count.programs,
        totalReviews: reviewAgg._count.id,
        avgRating: reviewAgg._avg.rating ? Math.round(reviewAgg._avg.rating * 10) / 10 : 0,
        programs: seller.programs,
      },
    })
  } catch (err) {
    return handleError(err)
  }
}
