import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, handleError, ApiError } from '@/lib/auth'
import { createNotification } from '@/lib/notify'

const AUTO_REPLY =
  '안녕하세요! 링커스 고객지원입니다. 😊 담당자가 확인 후 빠르게 답변드리겠습니다. 잠시만 기다려주세요!'

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
    const since = searchParams.get('since')

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
    const { content, imageUrl, fileUrl, fileName } = await req.json()

    if (!content?.trim() && !imageUrl && !fileUrl) {
      throw new ApiError(400, '메시지 내용 또는 첨부파일이 필요합니다')
    }

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
        file_url: fileUrl ?? null,
        file_name: fileName ?? null,
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

    // 상대방 알림
    const senderNickname = message.sender.nickname
    const notifBody = content?.trim()
      ? content.trim().slice(0, 50)
      : imageUrl
        ? '[이미지]'
        : fileUrl
          ? `[파일] ${fileName ?? ''}`
          : ''

    if (room.type === 'admin') {
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
      const recipientId = user.userId === room.user_id ? room.seller_id! : room.user_id
      await createNotification(
        recipientId,
        'chat_message',
        `${senderNickname}님의 새 메시지`,
        notifBody,
        user.userId === room.user_id ? `/seller/chat/${id}` : `/my/chat/${id}`
      )
    }

    // 관리자 채팅 첫 메시지 자동응답
    if (room.type === 'admin' && user.userId === room.user_id) {
      const prevCount = await db.chatMessage.count({
        where: { room_id: id, id: { not: message.id } },
      })
      if (prevCount === 0) {
        const adminUser = await db.user.findFirst({
          where: { role: { in: ['admin', 'manager'] } },
        })
        if (adminUser) {
          await db.chatMessage.create({
            data: {
              room_id: id,
              sender_id: adminUser.id,
              content: AUTO_REPLY,
            },
          })
          await db.chatRoom.update({
            where: { id },
            data: { updated_at: new Date() },
          })
        }
      }
    }

    return Response.json({ message }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
