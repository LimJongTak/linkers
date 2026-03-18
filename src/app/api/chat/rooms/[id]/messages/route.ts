import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, handleError, ApiError } from '@/lib/auth'
import { createNotification } from '@/lib/notify'

function canAccessRoom(
  user: { userId: string; role: string },
  room: { user_id: string; seller_id: string | null; type: string }
) {
  if (user.role === 'admin' || user.role === 'manager') return true
  if (room.user_id === user.userId) return true
  if (room.seller_id === user.userId) return true
  return false
}

// GET /api/chat/rooms/[id]/messages
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyAccessToken(req)
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const since = searchParams.get('since') // ISO timestamp for polling

    const room = await db.chatRoom.findUnique({ where: { id } })
    if (!room) throw new ApiError(404, '채팅방을 찾을 수 없습니다')
    if (!canAccessRoom(user, room)) throw new ApiError(403, 'FORBIDDEN')

    const messages = await db.chatMessage.findMany({
      where: {
        room_id: id,
        ...(since ? { created_at: { gt: new Date(since) } } : {}),
      },
      include: {
        sender: { select: { id: true, nickname: true, profile_image: true, role: true } },
      },
      orderBy: { created_at: 'asc' },
    })

    return Response.json({ messages })
  } catch (err) {
    return handleError(err)
  }
}

// POST /api/chat/rooms/[id]/messages
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyAccessToken(req)
    const { id } = await params
    const { content, imageUrl } = await req.json()

    if (!content?.trim() && !imageUrl) throw new ApiError(400, '메시지 내용 또는 이미지를 첨부해주세요')

    const room = await db.chatRoom.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, nickname: true } },
        seller: { select: { id: true, nickname: true } },
      },
    })
    if (!room) throw new ApiError(404, '채팅방을 찾을 수 없습니다')
    if (!canAccessRoom(user, room)) throw new ApiError(403, 'FORBIDDEN')

    const message = await db.chatMessage.create({
      data: {
        room_id: id,
        sender_id: user.userId,
        content: content?.trim() ?? '',
        image_url: imageUrl ?? null,
      },
      include: {
        sender: { select: { id: true, nickname: true, profile_image: true, role: true } },
      },
    })

    // 채팅방 updated_at 갱신
    await db.chatRoom.update({
      where: { id },
      data: { updated_at: new Date() },
    })

    // 상대방에게 알림 전송
    const senderNickname = message.sender.nickname
    const notifBody = content?.trim()
      ? content.trim().slice(0, 50)
      : imageUrl
        ? '[이미지]'
        : ''
    if (room.type === 'admin') {
      // admin 채팅: 관리자가 보냈으면 → user에게, user가 보냈으면 → 관리자들에게는 알림 없음(관리자는 목록에서 확인)
      if (user.userId !== room.user_id) {
        await createNotification(
          room.user_id,
          'chat_message',
          '새 채팅 메시지',
          `관리자: ${notifBody}`,
          `/my/chat/${id}`
        )
      }
    } else {
      // seller 채팅: 보낸 사람이 user면 → seller에게, seller면 → user에게
      const recipientId = user.userId === room.user_id ? room.seller_id! : room.user_id
      await createNotification(
        recipientId,
        'chat_message',
        `${senderNickname}님의 새 메시지`,
        notifBody,
        user.userId === room.user_id ? `/seller/chat/${id}` : `/my/chat/${id}`
      )
    }

    return Response.json({ message }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
