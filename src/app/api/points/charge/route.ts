// POST /api/points/charge — 문화상품권 / 카드 충전
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, handleError, ApiError } from '@/lib/auth'

// 문화상품권 PIN 포맷 및 금액 검증 (실제 API 연동 전 mock)
// 실제: CultureLand / BooknLife / HappyMoney API 호출
function validateGiftCard(provider: string, pin: string): { amount: number; providerName: string } {
  const formats: Record<string, { regex: RegExp; name: string }> = {
    cultureland:  { regex: /^\d{4}-\d{4}-\d{4}-\d{4}$/, name: '문화상품권' },
    booknlife:    { regex: /^\d{4}-\d{4}-\d{4}-\d{4}$/, name: '도서문화상품권' },
    happymoney:   { regex: /^\d{4}-\d{4}-\d{4}-\d{4}$/, name: '해피머니' },
    smartculture: { regex: /^\d{18}$/, name: '스마트문화상품권' },
  }

  const config = formats[provider]
  if (!config) throw new ApiError(400, 'INVALID_PROVIDER')
  if (!config.regex.test(pin)) throw new ApiError(400, 'INVALID_PIN_FORMAT')

  // TODO: 실제 제공사 API 호출로 교체
  // 금액은 PIN 마지막 자리로 임시 결정 (실제론 API 응답값)
  const lastDigit = parseInt(pin.replace(/-/g, '').slice(-1), 10)
  const amounts = [5000, 5000, 10000, 10000, 10000, 30000, 30000, 50000, 50000, 100000]
  return { amount: amounts[lastDigit], providerName: config.name }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = verifyAccessToken(req)
    const body = await req.json()
    const { method, provider, pin, card_amount } = body

    if (method === 'gift_card') {
      if (!provider || !pin) throw new ApiError(400, 'MISSING_FIELDS')

      // 중복 사용 확인
      const already = await db.giftCardUsage.findUnique({ where: { pin } })
      if (already) throw new ApiError(409, 'GIFT_CARD_ALREADY_USED')

      const { amount, providerName } = validateGiftCard(provider, pin)

      const [, updated] = await db.$transaction([
        db.giftCardUsage.create({ data: { pin, user_id: userId, amount, provider } }),
        db.user.update({
          where: { id: userId },
          data: {
            points: { increment: amount },
            point_transactions: {
              create: {
                amount,
                type: 'charge_gift_card',
                description: `${providerName} 충전`,
                reference_id: pin,
              },
            },
          },
          select: { points: true },
        }),
      ])

      return Response.json({ success: true, charged: amount, points: updated.points })
    }

    if (method === 'card') {
      const amount = Number(card_amount)
      const validAmounts = [10000, 30000, 50000, 100000, 200000, 300000]
      if (!validAmounts.includes(amount)) throw new ApiError(400, 'INVALID_AMOUNT')

      // 실제론 PortOne 결제 검증 후 처리
      // 여기서는 amount를 받아 포인트만 적립 (PortOne 연동 시 payment_id 검증 추가)
      const updated = await db.user.update({
        where: { id: userId },
        data: {
          points: { increment: amount },
          point_transactions: {
            create: {
              amount,
              type: 'charge_card',
              description: `카드 충전 ${amount.toLocaleString()}원`,
            },
          },
        },
        select: { points: true },
      })

      return Response.json({ success: true, charged: amount, points: updated.points })
    }

    throw new ApiError(400, 'INVALID_METHOD')
  } catch (err) {
    return handleError(err)
  }
}
