import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, handleError, ApiError } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyAccessToken(req)
    const { id } = await params

    const notif = await db.notification.findUnique({ where: { id } })
    if (!notif || notif.user_id !== user.userId) throw new ApiError(404, 'NOT_FOUND')

    await db.notification.update({ where: { id }, data: { is_read: true } })
    return Response.json({ ok: true })
  } catch (err) {
    return handleError(err)
  }
}
