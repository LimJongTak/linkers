import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, handleError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)

    const reviews = await db.review.findMany({
      where: { program: { seller_id: user.userId } },
      include: {
        buyer: { select: { id: true, nickname: true, profile_image: true } },
        program: { select: { id: true, title: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 100,
    })

    return Response.json({
      reviews: reviews.map(r => ({
        id: r.id,
        rating: r.rating,
        content: r.content,
        photoUrls: r.photo_urls,
        createdAt: r.created_at,
        buyerName: r.buyer.nickname,
        buyerImage: r.buyer.profile_image,
        programId: r.program.id,
        programTitle: r.program.title,
      })),
    })
  } catch (err) {
    return handleError(err)
  }
}
