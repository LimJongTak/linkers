import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, handleError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    const programs = await db.program.findMany({
      where: { seller_id: user.userId, status: { not: 'deleted' } },
      select: { id: true, title: true, status: true, price: true },
      orderBy: { created_at: 'desc' },
    })
    return Response.json({ programs })
  } catch (err) {
    return handleError(err)
  }
}
