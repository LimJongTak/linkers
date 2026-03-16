import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, requireRole, handleError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const category    = searchParams.get('category')
    const target      = searchParams.get('target')
    const region      = searchParams.get('region')
    const productType = searchParams.get('productType')
    const sort        = searchParams.get('sort') ?? 'popular'
    const q           = searchParams.get('q')
    const page        = Math.max(1, Number(searchParams.get('page') ?? 1))
    const limit       = 24
    const minPrice    = searchParams.get('minPrice')
    const maxPrice    = searchParams.get('maxPrice')
    const minRating   = searchParams.get('minRating')

    const where: any = { status: 'active' }
    if (category)    where.category     = category
    if (region)      where.region       = { has: region }
    if (target)      where.target_levels = { has: target }
    if (productType) where.product_type  = productType
    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = Number(minPrice)
      if (maxPrice) where.price.lte = Number(maxPrice)
    }
    if (minRating) where.rating_avg = { gte: Number(minRating) }
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

    const body = await req.json()
    const {
      productType, title, subtitle, category, description,
      targetLevels, regions, price, duration, maxParticipants,
      tags, fileFormat, pageCount, isOnline,
    } = body

    const createData = {
      seller_id: user.userId,
      product_type: (productType ?? 'file_product') as 'file_product' | 'class',
      title: title as string,
      subtitle: subtitle ?? null,
      category: category as string,
      description: description as string,
      target_levels: (targetLevels ?? []) as string[],
      region: (productType === 'file_product' ? ['전국'] : (regions ?? [])) as string[],
      price: Number(price),
      duration: duration ?? null,
      max_participants: maxParticipants ? Number(maxParticipants) : null,
      tags: (tags ?? []) as string[],
      file_format: fileFormat ?? null,
      page_count: pageCount ? Number(pageCount) : null,
      status: 'draft' as const,
    }
    const program = await db.program.create({ data: createData })

    return Response.json({ program }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
