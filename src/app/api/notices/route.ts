import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, requireRole, handleError, ApiError } from '@/lib/auth'

const select = {
  id: true, category: true, title: true, content: true,
  image_url: true, is_new: true, is_pinned: true,
  created_at: true, updated_at: true,
  author: { select: { id: true, nickname: true } },
}

export async function GET() {
  try {
    const notices = await db.notice.findMany({
      orderBy: [{ is_pinned: 'desc' }, { created_at: 'desc' }],
      select,
    })
    return Response.json({ notices })
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    requireRole(user, 'admin', 'manager')

    const { category, title, content, image_url, is_new, is_pinned } = await req.json()
    if (!category || !title || !content) throw new ApiError(400, '카테고리, 제목, 내용을 모두 입력해주세요')

    const notice = await db.notice.create({
      data: { category, title, content, image_url: image_url ?? null, is_new: !!is_new, is_pinned: !!is_pinned, author_id: user.userId },
      select,
    })
    return Response.json({ notice }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
