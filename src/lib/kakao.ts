import axios from 'axios'
import { db } from './db'

const BASE = 'https://api-alimtalk.cloud.toast.com/alimtalk/v2.2'
const APP_KEY = process.env.KAKAO_ALIMTALK_APP_KEY!
const SENDER_KEY = process.env.KAKAO_SENDER_KEY!
const SECRET = process.env.KAKAO_ALIMTALK_SECRET!

interface AlimtalkParams {
  templateCode: string
  to: string
  variables: Record<string, string>
}

export async function sendAlimtalk({ templateCode, to, variables }: AlimtalkParams) {
  try {
    const res = await axios.post(
      `${BASE}/senders/${SENDER_KEY}/messages`,
      {
        recipientList: [{ recipientNo: to, templateParameter: variables }],
        templateCode,
      },
      { headers: { 'X-Secret-Key': SECRET, 'Content-Type': 'application/json' } }
    )

    if (!res.data.header.isSuccessful) throw new Error(res.data.header.resultMessage)

    await db.$executeRaw`
      INSERT INTO notification_logs (template_code, recipient_phone, channel, status, sent_at)
      VALUES (${templateCode}, ${to}, 'alimtalk', 'success', NOW())
    `.catch(() => {}) // 로그 실패 무시

    return { success: true }
  } catch (err: any) {
    console.error('알림톡 실패, SMS 폴백:', err.message)
    return sendSmsFallback({ to, message: `[링커스] ${templateCode} 알림입니다.` })
  }
}

async function sendSmsFallback({ to, message }: { to: string; message: string }) {
  try {
    await axios.post(
      `https://api-sms.cloud.toast.com/sms/v3.0/appKeys/${APP_KEY}/sender/sms`,
      {
        body: message,
        sendNo: process.env.SMS_SENDER_NO,
        recipientList: [{ recipientNo: to }],
      },
      { headers: { 'X-Secret-Key': SECRET } }
    )
    return { success: true, channel: 'sms' }
  } catch (err) {
    console.error('SMS 폴백도 실패:', err)
    return { success: false }
  }
}

// 결제 완료 알림 (구매자 + 판매자 동시)
export async function sendPaymentCompleteNotifications(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      buyer: true,
      program: { include: { seller: true } },
    },
  })
  if (!order) return

  const promises = []

  if (order.buyer.phone) {
    promises.push(
      sendAlimtalk({
        templateCode: 'PAYMENT_COMPLETE',
        to: order.buyer.phone,
        variables: {
          '#{프로그램명}': order.program.title,
          '#{결제금액}': order.amount.toLocaleString() + '원',
          '#{주문번호}': order.order_number,
        },
      })
    )
  }

  if (order.program.seller.phone) {
    promises.push(
      sendAlimtalk({
        templateCode: 'NEW_ORDER',
        to: order.program.seller.phone,
        variables: {
          '#{프로그램명}': order.program.title,
          '#{구매자명}': order.buyer.nickname,
          '#{결제금액}': order.amount.toLocaleString() + '원',
        },
      })
    )
  }

  await Promise.allSettled(promises)
}
