import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, requireRole, handleError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const admin = verifyAccessToken(req)
    requireRole(admin, 'admin', 'manager')

    const status = req.nextUrl.searchParams.get('status') ?? 'pending'
    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') ?? '1'))
    const take = 20

    const where = status === 'all' ? {} : { status: status as any }

    const [deposits, total] = await Promise.all([
      db.depositRequest.findMany({
        where,
        include: { user: { select: { id: true, nickname: true, email: true } } },
        orderBy: { requested_at: 'desc' },
        skip: (page - 1) * take,
        take,
      }),
      db.depositRequest.count({ where }),
    ])

    return Response.json({ deposits, total, totalPages: Math.ceil(total / take) })
  } catch (err) {
    return handleError(err)
  }
}
