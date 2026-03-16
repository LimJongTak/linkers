import { NextRequest } from 'next/server'
import { verifyAccessToken, requireRole, handleError, ApiError } from '@/lib/auth'
import path from 'path'
import fs from 'fs'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    requireRole(user, 'admin', 'manager')

    const formData = await req.formData()
    const file = formData.get('image') as File | null
    if (!file) throw new ApiError(400, '이미지 파일이 필요합니다')
    if (!file.type.startsWith('image/')) throw new ApiError(400, '이미지 파일만 업로드 가능합니다')
    if (file.size > 5 * 1024 * 1024) throw new ApiError(400, '이미지 크기는 5MB 이하여야 합니다')

    const ext = file.name.split('.').pop() ?? 'jpg'
    const savedName = `notice_${randomUUID()}.${ext}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'notices')
    fs.mkdirSync(uploadDir, { recursive: true })
    fs.writeFileSync(path.join(uploadDir, savedName), Buffer.from(await file.arrayBuffer()))

    return Response.json({ imageUrl: `/uploads/notices/${savedName}` })
  } catch (err) {
    return handleError(err)
  }
}
