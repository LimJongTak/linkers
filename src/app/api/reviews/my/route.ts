import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, handleError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)

    const reviews = await db.review.findMany({
      where: { buyer_id: user.userId },
      include: {
        program: { select: { id: true, title: true, category: true, thumbnail_url: true } },
        order: { select: { id: true, order_number: true } },
      },
      orderBy: { created_at: 'desc' },
    })

    return Response.json({ reviews })
  } catch (err) {
    return handleError(err)
  }
}
