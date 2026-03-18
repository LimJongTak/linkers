import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, handleError, ApiError } from '@/lib/auth'
import { uploadToSupabase, hasSupabaseStorage } from '@/lib/supabase-storage'
import { randomUUID } from 'crypto'

function canAccessRoom(
  user: { userId: string; role: string },
  room: { user_id: string; seller_id: string | null }
) {
  if (user.role === 'admin' || user.role === 'manager') return true
  if (room.user_id === user.userId) return true
  if (room.seller_id === user.userId) return true
  return false
}

// POST /api/chat/rooms/[id]/image
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyAccessToken(req)
    const { id } = await params

    const room = await db.chatRoom.findUnique({ where: { id } })
    if (!room) throw new ApiError(404, '채팅방을 찾을 수 없습니다')
    if (!canAccessRoom(user, room)) throw new ApiError(403, 'FORBIDDEN')

    if (!hasSupabaseStorage()) {
      throw new ApiError(503, '이미지 업로드 서비스를 사용할 수 없습니다')
    }

    const formData = await req.formData()
    const file = formData.get('image')

    if (!file || !(file instanceof File)) {
      throw new ApiError(400, '이미지 파일을 첨부해주세요')
    }

    if (!file.type.startsWith('image/')) {
      throw new ApiError(400, '이미지 파일만 업로드할 수 있습니다')
    }

    const MAX_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_SIZE) {
      throw new ApiError(400, '이미지 파일 크기는 10MB 이하여야 합니다')
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const filename = `${randomUUID()}.${ext}`
    const path = `chat/${id}/${filename}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const imageUrl = await uploadToSupabase(buffer, path, file.type, 'programs')

    return Response.json({ imageUrl }, { status: 200 })
  } catch (err) {
    return handleError(err)
  }
}
