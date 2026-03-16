import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, handleError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    const wishlists = await db.wishlist.findMany({
      where: { user_id: user.userId },
      select: {
        program_id: true,
        created_at: true,
        program: {
          select: {
            id: true, product_type: true, title: true, subtitle: true,
            category: true, target_levels: true, region: true, price: true,
            file_format: true, page_count: true, duration: true, max_participants: true,
            rating_avg: true, review_count: true, tags: true, thumbnail_url: true,
            seller: { select: { id: true, nickname: true, profile_image: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    })
    const programIds = wishlists.map(w => w.program_id)
    const programs = wishlists.map(w => w.program)
    return Response.json({ programIds, programs })
  } catch (err) {
    return handleError(err)
  }
}

// POST: toggle (add if not exists, remove if exists)
export async function POST(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    const { programId } = await req.json()

    const existing = await db.wishlist.findUnique({
      where: { user_id_program_id: { user_id: user.userId, program_id: programId } },
    })

    if (existing) {
      await db.wishlist.delete({
        where: { user_id_program_id: { user_id: user.userId, program_id: programId } },
      })
      return Response.json({ wishlisted: false })
    } else {
      await db.wishlist.create({
        data: { user_id: user.userId, program_id: programId },
      })
      return Response.json({ wishlisted: true })
    }
  } catch (err) {
    return handleError(err)
  }
}
