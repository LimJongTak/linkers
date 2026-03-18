import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, handleError, ApiError } from '@/lib/auth'

function canAccessRoom(
  user: { userId: string; role: string },
  room: { user_id: string; seller_id: string | null }
) {
  if (user.role === 'admin' || user.role === 'manager') return true
  if (room.user_id === user.userId) return true
  if (room.seller_id === user.userId) return true
  return false
}

// PATCH /api/chat/rooms/[id]/typing — 타이핑 중 신호 갱신
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyAccessToken(req)
    const { id } = await params

    const room = await db.chatRoom.findUnique({ where: { id } })
    if (!room) throw new ApiError(404, '채팅방을 찾을 수 없습니다')
    if (!canAccessRoom(user, room)) throw new ApiError(403, 'FORBIDDEN')

    try {
      await db.chatTyping.upsert({
        where: { room_id_user_id: { room_id: id, user_id: user.userId } },
        create: { room_id: id, user_id: user.userId, typed_at: new Date() },
        update: { typed_at: new Date() },
      })
    } catch {
      // chat_typing 테이블이 없으면 무시 (migration 미실행)
    }

    return Response.json({ ok: true })
  } catch (err) {
    return handleError(err)
  }
}
