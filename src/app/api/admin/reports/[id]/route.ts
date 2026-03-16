import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, requireRole, handleError, ApiError } from '@/lib/auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = verifyAccessToken(req)
    requireRole(user, 'admin', 'manager')

    const { id } = await params
    const { action, adminNote } = await req.json()

    const report = await db.report.findUnique({ where: { id } })
    if (!report) throw new ApiError(404, 'REPORT_NOT_FOUND')

    const statusMap: Record<string, string> = {
      review: 'reviewed',
      dismiss: 'dismissed',
    }
    const newStatus = statusMap[action]
    if (!newStatus) throw new ApiError(400, 'INVALID_ACTION')

    const updated = await db.report.update({
      where: { id },
      data: {
        status:      newStatus as any,
        admin_note:  adminNote ?? null,
        reviewer_id: user.userId,
        reviewed_at: new Date(),
      },
    })

    // 신고 처리 시 프로그램을 일시중지 (review 액션 + 관리자 판단 시)
    if (action === 'review' && adminNote?.includes('[pause]')) {
      await db.program.update({ where: { id: report.program_id }, data: { status: 'paused' } })
    }

    return Response.json({ report: updated })
  } catch (err) {
    return handleError(err)
  }
}
