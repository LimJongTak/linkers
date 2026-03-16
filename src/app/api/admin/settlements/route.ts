import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, requireRole, handleError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    requireRole(user, 'admin')

    const { searchParams } = req.nextUrl
    const status = searchParams.get('status') ?? ''
    const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit  = 20

    const where: any = {}
    if (status) where.status = status

    const [settlements, total, summary] = await Promise.all([
      db.settlement.findMany({
        where,
        orderBy: { scheduled_at: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          seller: { select: { id: true, nickname: true, email: true } },
          order:  { select: { order_number: true, program: { select: { title: true } } } },
        },
      }),
      db.settlement.count({ where }),
      db.settlement.groupBy({
        by: ['status'],
        _sum: { net_amount: true },
        _count: true,
      }),
    ])

    return Response.json({ settlements, total, page, totalPages: Math.ceil(total / limit), summary })
  } catch (err) {
    return handleError(err)
  }
}
