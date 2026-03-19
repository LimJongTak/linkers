import { db } from './db'

/**
 * 리뷰 작성 후 관리자가 설정한 고정 금액만큼 포인트 적립
 * @returns 적립된 포인트 (0이면 미적립)
 */
export async function awardReviewPoints(
  userId: string,
  reviewId: string
): Promise<number> {
  const setting = await db.adminSetting.findUnique({ where: { key: 'review_reward_amount' } })
  if (!setting) return 0

  const points = parseInt(setting.value, 10)
  if (!points || points <= 0) return 0

  await db.user.update({
    where: { id: userId },
    data: {
      points: { increment: points },
      point_transactions: {
        create: {
          amount: points,
          type: 'review_reward',
          description: `리뷰 작성 포인트 적립`,
          reference_id: reviewId,
        },
      },
    },
  })

  return points
}

/**
 * 구매 완료 후 관리자가 설정한 % 만큼 포인트 적립
 * @returns 적립된 포인트 (0이면 미적립)
 */
export async function awardPurchasePoints(
  userId: string,
  paidAmount: number,
  orderNumber: string
): Promise<number> {
  const setting = await db.adminSetting.findUnique({ where: { key: 'point_reward_rate' } })
  if (!setting) return 0

  const rate = parseFloat(setting.value)
  if (!rate || rate <= 0) return 0

  const points = Math.floor(paidAmount * rate / 100)
  if (points <= 0) return 0

  await db.user.update({
    where: { id: userId },
    data: {
      points: { increment: points },
      point_transactions: {
        create: {
          amount: points,
          type: 'purchase_reward',
          description: `구매 적립 (${rate}%)`,
          reference_id: orderNumber,
        },
      },
    },
  })

  return points
}
