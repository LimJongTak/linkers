import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, requireRole, handleError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    requireRole(user, 'admin', 'manager')

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') ?? 'pending'
    const page = Math.max(1, Number(searchParams.get('page') ?? 1))
    const limit = 20

    const where = status === 'all' ? {} : { status: status as any }

    const [reports, total] = await Promise.all([
      db.report.findMany({
        where,
        include: {
          reporter: { select: { id: true, nickname: true } },
          reviewer: { select: { id: true, nickname: true } },
          program:  { select: { id: true, title: true, seller_id: true,
            seller: { select: { nickname: true } } } },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.report.count({ where }),
    ])

    return Response.json({ reports, total, page })
  } catch (err) {
    return handleError(err)
  }
}
