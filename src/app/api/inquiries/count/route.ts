import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, handleError } from '@/lib/auth'

// 헤더 빨간 점용: 미확인 문의 카운트
export async function GET(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)

    // 내 1:1 문의에 달린 미읽은 답변 알림
    const unreadReplies = await db.notification.count({
      where: { user_id: user.userId, type: 'inquiry_answered', is_read: false },
    })

    // 판매자/관리자: 미답변(open) 프로그램 문의 수
    let receivedOpen = 0
    if (user.role === 'admin' || user.role === 'manager') {
      receivedOpen = await db.inquiry.count({ where: { target_type: 'admin', status: 'open' } })
    } else if (user.role === 'seller') {
      const myPrograms = await db.program.findMany({
        where: { seller_id: user.userId },
        select: { id: true },
      })
      if (myPrograms.length > 0) {
        receivedOpen = await db.inquiry.count({
          where: { program_id: { in: myPrograms.map(p => p.id) }, target_type: 'seller', status: 'open' },
        })
      }
    }

    return Response.json({ unreadReplies, receivedOpen, total: unreadReplies + receivedOpen })
  } catch (err) {
    return handleError(err)
  }
}
