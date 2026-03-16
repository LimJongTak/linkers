import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, handleError } from '@/lib/auth'

export async function PATCH(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    await db.notification.updateMany({
      where: { user_id: user.userId, is_read: false },
      data: { is_read: true },
    })
    return Response.json({ ok: true })
  } catch (err) {
    return handleError(err)
  }
}
