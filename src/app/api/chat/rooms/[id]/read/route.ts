import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, handleError, ApiError } from '@/lib/auth'

// PATCH /api/chat/rooms/[id]/read — 내가 받은 메시지를 읽음 처리
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyAccessToken(req)
    const { id } = await params

    const room = await db.chatRoom.findUnique({ where: { id } })
    if (!room) throw new ApiError(404, '채팅방을 찾을 수 없습니다')

    const canAccess =
      user.role === 'admin' || user.role === 'manager' ||
      room.user_id === user.userId ||
      room.seller_id === user.userId
    if (!canAccess) throw new ApiError(403, 'FORBIDDEN')

    await db.chatMessage.updateMany({
      where: {
        room_id: id,
        is_read: false,
        sender_id: { not: user.userId },
      },
      data: { is_read: true },
    })

    return Response.json({ ok: true })
  } catch (err) {
    return handleError(err)
  }
}
