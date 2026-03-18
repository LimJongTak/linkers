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

// GET /api/chat/rooms/[id]/status
// 반환: { isTyping: boolean, readMessageIds: string[] }
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyAccessToken(req)
    const { id } = await params

    const room = await db.chatRoom.findUnique({ where: { id } })
    if (!room) throw new ApiError(404, '채팅방을 찾을 수 없습니다')
    if (!canAccessRoom(user, room)) throw new ApiError(403, 'FORBIDDEN')

    // 상대방이 4초 이내에 타이핑 신호를 보냈는지 확인
    const TYPING_WINDOW_MS = 4000
    const cutoff = new Date(Date.now() - TYPING_WINDOW_MS)
    let isTyping = false
    try {
      const record = await db.chatTyping.findFirst({
        where: {
          room_id: id,
          user_id: { not: user.userId },
          typed_at: { gt: cutoff },
        },
      })
      isTyping = record !== null
    } catch {
      // chat_typing 테이블 미존재 시 무시
      isTyping = false
    }

    // 내가 보낸 메시지 중 읽힌 것들의 ID (최근 100개)
    const readMessages = await db.chatMessage.findMany({
      where: {
        room_id: id,
        sender_id: user.userId,
        is_read: true,
      },
      select: { id: true },
      orderBy: { created_at: 'desc' },
      take: 100,
    })

    return Response.json({
      isTyping,
      readMessageIds: readMessages.map(m => m.id),
    })
  } catch (err) {
    return handleError(err)
  }
}
