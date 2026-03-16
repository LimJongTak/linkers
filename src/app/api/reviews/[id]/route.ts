import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, ApiError, handleError } from '@/lib/auth'

async function recalcProgram(programId: string) {
  const agg = await db.review.aggregate({
    where: { program_id: programId, is_visible: true },
    _avg: { rating: true },
    _count: { id: true },
  })
  await db.program.update({
    where: { id: programId },
    data: { rating_avg: agg._avg.rating ?? 0, review_count: agg._count.id },
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = verifyAccessToken(req)
    const { rating, content } = await req.json()

    const review = await db.review.findUnique({ where: { id } })
    if (!review) throw new ApiError(404, '리뷰를 찾을 수 없습니다')
    if (review.buyer_id !== user.userId) throw new ApiError(403, '본인 리뷰만 수정할 수 있습니다')

    if (rating !== undefined && (rating < 1 || rating > 5)) throw new ApiError(400, '별점은 1~5 사이여야 합니다')
    if (content !== undefined && content.length < 10) throw new ApiError(400, '리뷰는 최소 10자 이상이어야 합니다')

    const updated = await db.review.update({
      where: { id },
      data: {
        ...(rating !== undefined ? { rating } : {}),
        ...(content !== undefined ? { content } : {}),
      },
    })

    await recalcProgram(review.program_id)
    return Response.json({ review: updated })
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = verifyAccessToken(req)

    const review = await db.review.findUnique({ where: { id } })
    if (!review) throw new ApiError(404, '리뷰를 찾을 수 없습니다')
    if (review.buyer_id !== user.userId) throw new ApiError(403, '본인 리뷰만 삭제할 수 있습니다')

    await db.review.delete({ where: { id } })
    await recalcProgram(review.program_id)

    return Response.json({ success: true })
  } catch (err) {
    return handleError(err)
  }
}
