import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, handleError } from '@/lib/auth'

// GET /api/chat/unread — 안읽은 채팅 메시지 총 개수
// role 무관하게 내가 참여한 방(user_id OR seller_id) 기준으로 계산
export async function GET(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)

    const rooms = await db.chatRoom.findMany({
      where: {
        OR: [
          { user_id: user.userId },
          { seller_id: user.userId },
        ],
      },
      select: { id: true },
    })
    const roomIds = rooms.map((r: { id: string }) => r.id)

    const count = await db.chatMessage.count({
      where: {
        room_id: { in: roomIds },
        is_read: false,
        sender_id: { not: user.userId },
      },
    })

    return Response.json({ count })
  } catch (err) {
    return handleError(err)
  }
}
