import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, handleError, ApiError } from '@/lib/auth'
import { createNotification } from '@/lib/notify'
import { sendInquiryAnsweredEmail } from '@/lib/email'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyAccessToken(req)
    const { id } = await params
    const { content } = await req.json()
    if (!content?.trim()) throw new ApiError(400, 'content 필수')

    const inquiry = await db.inquiry.findUnique({
      where: { id },
      include: { program: { select: { id: true, title: true, seller_id: true } } },
    })
    if (!inquiry) throw new ApiError(404, 'NOT_FOUND')

    // 권한: 문의 작성자, 관리자, 해당 프로그램 판매자
    const isAdmin = user.role === 'admin' || user.role === 'manager'
    const isSeller = !!(inquiry.program?.seller_id && inquiry.program.seller_id === user.userId)
    const isOwner = inquiry.user_id === user.userId
    if (!isAdmin && !isSeller && !isOwner) throw new ApiError(403, 'FORBIDDEN')

    const reply = await db.inquiryReply.create({
      data: { inquiry_id: id, author_id: user.userId, content: content.trim() },
      include: { author: { select: { id: true, nickname: true, role: true } } },
    })

    // 문의 상태 → answered
    await db.inquiry.update({ where: { id }, data: { status: 'answered' } })

    // 문의 작성자에게 알림 + 이메일 (본인이 답변한 경우 제외)
    if (inquiry.user_id !== user.userId) {
      const programTitle = inquiry.program?.title ?? ''
      await createNotification(
        inquiry.user_id,
        'inquiry_answered',
        '문의에 답변이 달렸습니다',
        `"${inquiry.title}"${programTitle ? ` (${programTitle})` : ''} 문의에 답변이 등록되었습니다.`,
        `/my/inquiries/${id}`
      )
      const inquirer = await db.user.findUnique({ where: { id: inquiry.user_id }, select: { email: true, nickname: true } })
      if (inquirer?.email) sendInquiryAnsweredEmail(inquirer.email, inquirer.nickname, inquiry.title, id)
    }

    return Response.json({ reply }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
