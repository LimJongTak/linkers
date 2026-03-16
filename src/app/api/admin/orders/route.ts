import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, requireRole, handleError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    requireRole(user, 'admin', 'manager')

    const { searchParams } = req.nextUrl
    const status = searchParams.get('status') ?? ''
    const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit  = 20

    const where: any = {}
    if (status) where.status = status

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          buyer:   { select: { id: true, nickname: true } },
          program: { select: { id: true, title: true, price: true } },
          payment: { select: { paid_at: true, pg_provider: true } },
        },
      }),
      db.order.count({ where }),
    ])

    return Response.json({ orders, total, page, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    return handleError(err)
  }
}
