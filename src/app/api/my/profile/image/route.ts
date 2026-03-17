import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, ApiError, handleError } from '@/lib/auth'
import { randomUUID } from 'crypto'
import { hasSupabaseStorage, uploadToSupabase } from '@/lib/supabase-storage'

export async function POST(req: NextRequest) {
  try {
    const auth = verifyAccessToken(req)

    const formData = await req.formData()
    const file = formData.get('image') as File | null
    if (!file) throw new ApiError(400, '이미지 파일이 필요합니다')
    if (!file.type.startsWith('image/')) throw new ApiError(400, '이미지 파일만 업로드 가능합니다')
    if (file.size > 5 * 1024 * 1024) throw new ApiError(400, '파일 크기는 5MB 이하여야 합니다')

    const ext = file.name.split('.').pop() ?? 'jpg'
    const fileName = `${randomUUID()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    let profileImageUrl: string

    if (hasSupabaseStorage()) {
      profileImageUrl = await uploadToSupabase(buffer, `avatars/${auth.userId}/${fileName}`, file.type)
    } else if (process.env.NODE_ENV !== 'production') {
      const path = await import('path')
      const fs = await import('fs')
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
      fs.mkdirSync(uploadDir, { recursive: true })
      fs.writeFileSync(path.join(uploadDir, fileName), buffer)
      const base = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3000'
      profileImageUrl = `${base}/uploads/avatars/${fileName}`
    } else {
      throw new ApiError(500, 'SUPABASE_URL과 SUPABASE_SERVICE_KEY를 설정해주세요')
    }

    await db.user.update({
      where: { id: auth.userId },
      data: { profile_image: profileImageUrl },
    })

    return Response.json({ profileImageUrl })
  } catch (err) {
    return handleError(err)
  }
}
