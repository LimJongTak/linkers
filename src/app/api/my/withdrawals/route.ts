import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, handleError, ApiError } from '@/lib/auth'

const FEE_RATE = 0.1 // 플랫폼 수수료 10%

/** 판매 수익 잔액 계산 */
async function calcBalance(sellerId: string) {
  const [earnedResult, withdrawnResult] = await Promise.all([
    // confirmed 주문만 수익으로 인정
    db.order.aggregate({
      where: { program: { seller_id: sellerId }, status: 'confirmed' },
      _sum: { amount: true },
    }),
    // 거절되지 않은 환전 신청액
    db.withdrawal.aggregate({
      where: { seller_id: sellerId, status: { not: 'rejected' } },
      _sum: { amount: true },
    }),
  ])
  const grossEarnings = earnedResult._sum.amount ?? 0
  const netEarnings   = Math.floor(grossEarnings * (1 - FEE_RATE))
  const withdrawn     = withdrawnResult._sum.amount ?? 0
  return { grossEarnings, netEarnings, withdrawn, available: Math.max(0, netEarnings - withdrawn) }
}

export async function GET(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)

    const [balance, withdrawals] = await Promise.all([
      calcBalance(user.userId),
      db.withdrawal.findMany({
        where: { seller_id: user.userId },
        orderBy: { requested_at: 'desc' },
      }),
    ])

    return Response.json({
      ...balance,
      withdrawals: withdrawals.map(w => ({
        id: w.id,
        amount: w.amount,
        bankName: w.bank_name,
        accountNumber: w.account_number,
        accountHolder: w.account_holder,
        status: w.status,
        adminNote: w.admin_note,
        requestedAt: w.requested_at,
        processedAt: w.processed_at,
      })),
    })
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    const { amount, bankName, accountNumber, accountHolder } = await req.json()

    if (!amount || !bankName || !accountNumber || !accountHolder) {
      throw new ApiError(400, '모든 항목을 입력해주세요')
    }
    if (!Number.isInteger(amount) || amount < 10000) {
      throw new ApiError(400, '최소 환전 금액은 10,000원입니다')
    }

    const { available } = await calcBalance(user.userId)
    if (amount > available) {
      throw new ApiError(400, `출금 가능 금액(₩${available.toLocaleString()})을 초과했습니다`)
    }

    const withdrawal = await db.withdrawal.create({
      data: {
        seller_id:      user.userId,
        amount,
        bank_name:      bankName,
        account_number: accountNumber,
        account_holder: accountHolder,
        status:         'pending',
      },
    })

    return Response.json({ withdrawal }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
