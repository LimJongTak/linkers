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

// POST /api/chat/rooms/[id]/file
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyAccessToken(req)
    const { id } = await params

    const room = await db.chatRoom.findUnique({ where: { id } })
    if (!room) throw new ApiError(404, '채팅방을 찾을 수 없습니다')
    if (!canAccessRoom(user, room)) throw new ApiError(403, 'FORBIDDEN')

    if (!hasSupabaseStorage()) {
      throw new ApiError(503, '파일 업로드 서비스를 사용할 수 없습니다')
    }

    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      throw new ApiError(400, '파일을 첨부해주세요')
    }

    const MAX_SIZE = 20 * 1024 * 1024 // 20MB
    if (file.size > MAX_SIZE) {
      throw new ApiError(400, '파일 크기는 20MB 이하여야 합니다')
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
    const filename = `${randomUUID()}.${ext}`
    const path = `chat/${id}/files/${filename}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const contentType = file.type || 'application/octet-stream'

    const fileUrl = await uploadToSupabase(buffer, path, contentType, 'programs')

    return Response.json({ fileUrl, fileName: file.name }, { status: 200 })
  } catch (err) {
    return handleError(err)
  }
}
