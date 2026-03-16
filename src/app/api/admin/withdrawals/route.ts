import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, requireRole, handleError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    requireRole(user, 'admin', 'manager')

    const { searchParams } = req.nextUrl
    const status = searchParams.get('status') ?? ''
    const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit  = 20

    const where: any = {}
    if (status && ['pending', 'processing', 'completed', 'rejected'].includes(status)) {
      where.status = status
    }

    const [withdrawals, total] = await Promise.all([
      db.withdrawal.findMany({
        where,
        orderBy: { requested_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { seller: { select: { id: true, nickname: true, email: true } } },
      }),
      db.withdrawal.count({ where }),
    ])

    return Response.json({
      withdrawals: withdrawals.map(w => ({
        id:             w.id,
        amount:         w.amount,
        bankName:       w.bank_name,
        accountNumber:  w.account_number,
        accountHolder:  w.account_holder,
        status:         w.status,
        adminNote:      w.admin_note,
        requestedAt:    w.requested_at,
        processedAt:    w.processed_at,
        seller:         w.seller,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    return handleError(err)
  }
}
