import { db } from '@/lib/db'
import { issueTokens } from '@/lib/auth'

let counter = 0
const uid = () => `test-${Date.now()}-${++counter}`

export async function createUser(overrides: Record<string, any> = {}) {
  return db.user.create({
    data: {
      email: `${uid()}@test.com`,
      nickname: '테스트구매자',
      role: 'buyer',
      oauth_provider: 'kakao',
      oauth_id: uid(),
      phone: '01012345678',
      ...overrides,
    },
  })
}

export async function createSeller(overrides: Record<string, any> = {}) {
  return createUser({ role: 'seller', nickname: '테스트판매자', ...overrides })
}

export async function createProgram(sellerId: string, overrides: Record<string, any> = {}) {
  return db.program.create({
    data: {
      seller_id: sellerId,
      title: '테스트 프로그램',
      category: '레크리에이션',
      target_levels: ['초등'],
      region: ['서울'],
      price: 100000,
      description: '테스트용 설명입니다',
      duration: '2시간',
      status: 'active',
      tags: [],
      ...overrides,
    },
  })
}

export async function createProgramFile(programId: string, overrides: Record<string, any> = {}) {
  return db.programFile.create({
    data: {
      program_id: programId,
      file_name: 'test.pdf',
      s3_key: `programs/test/${uid()}.pdf`,
      file_size: BigInt(1024 * 1024),
      file_type: 'pdf',
      is_preview: false,
      ...overrides,
    },
  })
}

export async function createOrder(
  buyerId: string,
  programId: string,
  overrides: Record<string, any> = {}
) {
  return db.order.create({
    data: {
      order_number: `LK-TEST-${uid()}`,
      buyer_id: buyerId,
      program_id: programId,
      amount: 100000,
      status: 'pending',
      payment_id: uid(),
      ...overrides,
    },
  })
}

export async function createPaidOrder(buyerId: string, programId: string) {
  const order = await createOrder(buyerId, programId, { status: 'paid' })
  await db.payment.create({
    data: {
      order_id: order.id,
      pg_provider: 'kakaopay',
      pg_tid: uid(),
      imp_uid: uid(),
      paid_amount: 100000,
      paid_at: new Date(),
      receipt_url: 'https://example.com/receipt',
      raw_response: {},
    },
  })
  return order
}

export function makeAuthHeader(userId: string, role = 'buyer') {
  const { accessToken } = issueTokens({ userId, role: role as any })
  return { Authorization: `Bearer ${accessToken}` }
}
