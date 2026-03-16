import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, handleError, ApiError } from '@/lib/auth'
import { sendReportReceivedEmail } from '@/lib/email'

const VALID_REASONS = ['inappropriate_content', 'spam', 'copyright', 'fake', 'other']

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = verifyAccessToken(req)
    const { id: programId } = await params
    const { reason, detail } = await req.json()

    if (!reason || !VALID_REASONS.includes(reason)) throw new ApiError(400, '신고 사유를 선택해주세요')

    const program = await db.program.findUnique({
      where: { id: programId, status: { not: 'deleted' } },
      select: { id: true, title: true, seller_id: true },
    })
    if (!program) throw new ApiError(404, '프로그램을 찾을 수 없습니다')
    if (program.seller_id === user.userId) throw new ApiError(400, '본인 프로그램은 신고할 수 없습니다')

    // 동일 유저의 중복 신고 방지
    const existing = await db.report.findFirst({
      where: { reporter_id: user.userId, program_id: programId, status: 'pending' },
    })
    if (existing) throw new ApiError(409, '이미 신고한 프로그램입니다')

    const report = await db.report.create({
      data: { reporter_id: user.userId, program_id: programId, reason, detail: detail?.trim() || null },
    })

    // 관리자에게 이메일 알림 (ADMIN_EMAIL 설정 시)
    if (process.env.ADMIN_EMAIL) {
      const reasonLabel: Record<string, string> = {
        inappropriate_content: '부적절한 콘텐츠',
        spam: '스팸/광고',
        copyright: '저작권 침해',
        fake: '허위 정보',
        other: '기타',
      }
      await sendReportReceivedEmail(process.env.ADMIN_EMAIL, program.title, reasonLabel[reason] ?? reason)
    }

    return Response.json({ report }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
