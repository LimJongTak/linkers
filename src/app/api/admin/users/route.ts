import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, requireRole, handleError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    requireRole(user, 'admin', 'manager')

    const { searchParams } = req.nextUrl
    const search = searchParams.get('search') ?? ''
    const role   = searchParams.get('role')   ?? ''
    const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit  = 20

    const where: any = {}
    if (role && ['buyer', 'seller', 'manager', 'admin'].includes(role)) where.role = role
    if (search) {
      where.OR = [
        { nickname: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, nickname: true, email: true, role: true,
          points: true, profile_image: true, phone: true,
          created_at: true, oauth_provider: true,
          _count: { select: { orders: true, programs: true } },
        },
      }),
      db.user.count({ where }),
    ])

    return Response.json({ users, total, page, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    return handleError(err)
  }
}
