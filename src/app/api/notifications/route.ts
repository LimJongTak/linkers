import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, handleError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)

    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: { user_id: user.userId },
        orderBy: { created_at: 'desc' },
        take: 50,
      }),
      db.notification.count({ where: { user_id: user.userId, is_read: false } }),
    ])

    return Response.json({ notifications, unreadCount })
  } catch (err) {
    return handleError(err)
  }
}
