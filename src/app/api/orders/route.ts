import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, ApiError, handleError } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    const { programId, scheduledAt, message } = await req.json()

    if (!programId) throw new ApiError(400, 'programId 필수')

    const program = await db.program.findUnique({
      where: { id: programId, status: 'active' },
    })
    if (!program) throw new ApiError(404, '프로그램을 찾을 수 없습니다')

    // 오늘 주문 시퀀스 기반 주문번호
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const start = new Date(); start.setHours(0, 0, 0, 0)
    const seq = await db.order.count({ where: { created_at: { gte: start } } })
    const orderNumber = `LK-${today}-${String(seq + 1).padStart(4, '0')}`

    const order = await db.order.create({
      data: {
        order_number: orderNumber,
        buyer_id: user.userId,
        program_id: programId,
        amount: program.price,
        status: 'pending',
        payment_id: crypto.randomUUID(),
        scheduled_at: scheduledAt ? new Date(scheduledAt) : null,
        message: message ?? null,
      },
    })

    return Response.json({ order }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)

    const orders = await db.order.findMany({
      where: { buyer_id: user.userId },
      include: {
        program: { select: { id: true, title: true, category: true, thumbnail_url: true } },
        payment: { select: { paid_at: true, receipt_url: true } },
        permissions: {
          include: { program_file: { select: { id: true, file_name: true, file_type: true, file_size: true } } },
        },
        review: { select: { id: true, rating: true } },
      },
      orderBy: { created_at: 'desc' },
    })

    return Response.json({ orders })
  } catch (err) {
    return handleError(err)
  }
}
