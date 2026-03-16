import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, handleError, ApiError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    const items = await db.cartItem.findMany({
      where: { user_id: user.userId },
      include: {
        program: {
          select: {
            id: true, title: true, subtitle: true, price: true,
            category: true, product_type: true, thumbnail_url: true,
            rating_avg: true, review_count: true, status: true,
            seller: { select: { id: true, nickname: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    })
    return Response.json({ items })
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    const { programId } = await req.json()
    if (!programId) throw new ApiError(400, 'programId 필수')

    const program = await db.program.findUnique({ where: { id: programId } })
    if (!program || program.status === 'deleted') throw new ApiError(404, '프로그램을 찾을 수 없습니다')

    const item = await db.cartItem.upsert({
      where: { user_id_program_id: { user_id: user.userId, program_id: programId } },
      create: { user_id: user.userId, program_id: programId },
      update: {},
    })
    return Response.json({ item }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
