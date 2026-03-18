import { db } from '@/lib/db'

type NotificationType = 'order_paid' | 'order_confirmed' | 'order_refunded' | 'withdrawal_processed' | 'inquiry_answered' | 'chat_message'

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string
) {
  try {
    await db.notification.create({ data: { user_id: userId, type, title, body, link } })
  } catch {
    // 알림 생성 실패는 무시 (핵심 로직 방해 안 함)
  }
}
