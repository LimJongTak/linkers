import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, ApiError, handleError } from '@/lib/auth'
import path from 'path'
import fs from 'fs'
import { randomUUID } from 'crypto'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = verifyAccessToken(req)

    const program = await db.program.findUnique({ where: { id } })
    if (!program) throw new ApiError(404, '프로그램을 찾을 수 없습니다')
    if (program.seller_id !== user.userId) throw new ApiError(403, 'FORBIDDEN')

    const formData = await req.formData()
    const file = formData.get('thumbnail') as File | null
    if (!file) throw new ApiError(400, 'thumbnail 파일이 필요합니다')

    // 이미지 타입 검증
    if (!file.type.startsWith('image/')) throw new ApiError(400, '이미지 파일만 업로드 가능합니다')

    const ext = file.name.split('.').pop() ?? 'jpg'
    const savedName = `thumbnail_${randomUUID()}.${ext}`

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', id)
    fs.mkdirSync(uploadDir, { recursive: true })

    const buffer = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(path.join(uploadDir, savedName), buffer)

    const thumbnailUrl = `/uploads/${id}/${savedName}`

    await db.program.update({
      where: { id },
      data: { thumbnail_url: thumbnailUrl },
    })

    return Response.json({ thumbnailUrl })
  } catch (err) {
    return handleError(err)
  }
}
