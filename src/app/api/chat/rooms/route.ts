import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, handleError, ApiError } from '@/lib/auth'

// GET /api/chat/rooms — 내 채팅방 목록
export async function GET(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)

    let rooms
    if (user.role === 'admin' || user.role === 'manager') {
      // 관리자: admin 타입 채팅방 전체 조회
      rooms = await db.chatRoom.findMany({
        where: { type: 'admin' },
        include: {
          user: { select: { id: true, nickname: true, profile_image: true } },
          messages: { orderBy: { created_at: 'desc' }, take: 1 },
        },
        orderBy: { updated_at: 'desc' },
      })
    } else {
      // 구매자/판매자 공통: 본인이 user이거나 seller인 채팅방 전체
      // (role과 무관하게 — 구매자 계정으로도 판매자 역할 가능)
      rooms = await db.chatRoom.findMany({
        where: {
          OR: [
            { user_id: user.userId },
            { seller_id: user.userId },
          ],
        },
        include: {
          user: { select: { id: true, nickname: true, profile_image: true } },
          seller: { select: { id: true, nickname: true, profile_image: true } },
          messages: { orderBy: { created_at: 'desc' }, take: 1 },
        },
        orderBy: { updated_at: 'desc' },
      })
    }

    // 각 방의 안읽은 메시지 수 계산
    const roomsWithUnread = await Promise.all(
      rooms.map(async (room) => {
        const unreadCount = await db.chatMessage.count({
          where: {
            room_id: room.id,
            is_read: false,
            sender_id: { not: user.userId },
          },
        })
        return { ...room, unreadCount }
      })
    )

    return Response.json({ rooms: roomsWithUnread })
  } catch (err) {
    return handleError(err)
  }
}

// POST /api/chat/rooms — 채팅방 생성 or 기존 방 반환
export async function POST(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    const { type, sellerId } = await req.json()

    if (!type || !['seller', 'admin'].includes(type)) {
      throw new ApiError(400, 'type은 seller 또는 admin이어야 합니다')
    }
    if (type === 'seller' && !sellerId) {
      throw new ApiError(400, '판매자 채팅은 sellerId가 필요합니다')
    }
    if (type === 'seller' && sellerId === user.userId) {
      throw new ApiError(400, '자기 자신과는 채팅할 수 없습니다')
    }

    if (type === 'seller') {
      const seller = await db.user.findUnique({ where: { id: sellerId } })
      if (!seller) throw new ApiError(404, '판매자를 찾을 수 없습니다')
    }

    // 기존 채팅방 찾기
    const existing = await db.chatRoom.findFirst({
      where:
        type === 'admin'
          ? { type: 'admin', user_id: user.userId }
          : { type: 'seller', user_id: user.userId, seller_id: sellerId },
    })

    if (existing) {
      return Response.json({ room: existing })
    }

    // 새 채팅방 생성
    const room = await db.chatRoom.create({
      data: {
        type,
        user_id: user.userId,
        seller_id: type === 'seller' ? sellerId : null,
      },
    })

    return Response.json({ room }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
