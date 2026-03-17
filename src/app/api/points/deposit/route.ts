import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, ApiError, handleError } from '@/lib/auth'

const VALID_AMOUNTS = [10000, 30000, 50000, 100000, 200000, 300000]

export async function POST(req: NextRequest) {
  try {
    const { userId } = verifyAccessToken(req)
    const { amount } = await req.json()

    if (!VALID_AMOUNTS.includes(Number(amount))) {
      throw new ApiError(400, '유효하지 않은 금액입니다')
    }

    // 이미 대기 중인 요청이 있으면 중복 방지
    const pending = await db.depositRequest.count({
      where: { user_id: userId, status: 'pending' },
    })
    if (pending >= 3) {
      throw new ApiError(400, '처리 대기 중인 입금 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.')
    }

    const deposit = await db.depositRequest.create({
      data: { user_id: userId, amount },
    })

    return Response.json({ deposit }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = verifyAccessToken(req)

    const deposits = await db.depositRequest.findMany({
      where: { user_id: userId },
      orderBy: { requested_at: 'desc' },
      take: 20,
    })

    return Response.json({ deposits })
  } catch (err) {
    return handleError(err)
  }
}
