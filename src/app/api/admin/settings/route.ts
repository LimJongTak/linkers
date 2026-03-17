import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, ApiError, handleError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    if (!['admin', 'manager'].includes(user.role)) throw new ApiError(403, 'FORBIDDEN')

    const settings = await db.adminSetting.findMany()
    const result: Record<string, string> = {}
    for (const s of settings) result[s.key] = s.value

    return Response.json({ settings: result })
  } catch (err) {
    return handleError(err)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    if (!['admin', 'manager'].includes(user.role)) throw new ApiError(403, 'FORBIDDEN')

    const { key, value } = await req.json()
    if (!key || value === undefined) throw new ApiError(400, 'key, value 필수')

    if (key === 'point_reward_rate') {
      const rate = parseFloat(value)
      if (isNaN(rate) || rate < 0 || rate > 100) {
        throw new ApiError(400, '적립률은 0~100 사이 숫자여야 합니다')
      }
    }

    const setting = await db.adminSetting.upsert({
      where: { key },
      create: { key, value: String(value) },
      update: { value: String(value) },
    })

    return Response.json({ setting })
  } catch (err) {
    return handleError(err)
  }
}
