import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, handleError, ApiError } from '@/lib/auth'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const user = verifyAccessToken(req)
    const { itemId } = await params

    const item = await db.cartItem.findUnique({ where: { id: itemId } })
    if (!item || item.user_id !== user.userId) throw new ApiError(404, 'NOT_FOUND')

    await db.cartItem.delete({ where: { id: itemId } })
    return Response.json({ ok: true })
  } catch (err) {
    return handleError(err)
  }
}
