import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, requireRole, handleError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    requireRole(user, 'admin', 'manager')

    const { searchParams } = req.nextUrl
    const status = searchParams.get('status') ?? ''
    const search = searchParams.get('search') ?? ''
    const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit  = 20

    const where: any = {}
    if (status && ['draft', 'active', 'paused', 'deleted'].includes(status)) where.status = status
    if (search) where.title = { contains: search, mode: 'insensitive' }

    const [programs, total] = await Promise.all([
      db.program.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          seller: { select: { id: true, nickname: true, email: true } },
          _count: { select: { orders: true, reviews: true } },
        },
      }),
      db.program.count({ where }),
    ])

    return Response.json({ programs, total, page, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    return handleError(err)
  }
}
