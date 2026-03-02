import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, requireRole, handleError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const category = searchParams.get('category')
    const target   = searchParams.get('target')
    const region   = searchParams.get('region')
    const sort     = searchParams.get('sort') ?? 'popular'
    const q        = searchParams.get('q')
    const page     = Math.max(1, Number(searchParams.get('page') ?? 1))
    const limit    = 12

    const where: any = { status: 'active' }
    if (category) where.category = category
    if (region)   where.region   = { has: region }
    if (target)   where.target_levels = { has: target }
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { tags: { has: q } },
      ]
    }

    const orderBy =
      sort === 'popular'   ? { review_count: 'desc' as const } :
      sort === 'price_asc' ? { price: 'asc' as const }         :
      sort === 'rating'    ? { rating_avg: 'desc' as const }    :
                             { created_at: 'desc' as const }

    const [programs, total] = await Promise.all([
      db.program.findMany({
        where,
        include: {
          seller: { select: { id: true, nickname: true, profile_image: true } },
          _count: { select: { reviews: true } },
        },
        orderBy,
        take: limit,
        skip: (page - 1) * limit,
      }),
      db.program.count({ where }),
    ])

    return Response.json({ programs, total, page, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    requireRole(user, 'seller')

    const body = await req.json()
    const { title, subtitle, category, description, targetLevels,
            regions, price, duration, maxParticipants, tags } = body

    const program = await db.program.create({
      data: {
        seller_id: user.userId,
        title, subtitle, category, description,
        target_levels: targetLevels ?? [],
        region: regions ?? [],
        price, duration,
        max_participants: maxParticipants,
        tags: tags ?? [],
        status: 'draft',
      },
    })

    return Response.json({ program }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
