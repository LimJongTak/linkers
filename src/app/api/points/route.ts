// GET  /api/points  — 잔액 + 내역
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, handleError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { userId } = verifyAccessToken(req)

    const [user, transactions] = await Promise.all([
      db.user.findUniqueOrThrow({ where: { id: userId }, select: { points: true } }),
      db.pointTransaction.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        take: 50,
      }),
    ])

    return Response.json({ points: user.points, transactions })
  } catch (err) {
    return handleError(err)
  }
}
