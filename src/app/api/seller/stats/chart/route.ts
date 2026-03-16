import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, handleError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') ?? 'daily'

    const now = new Date()
    const points = period === 'monthly' ? 12 : 30
    const since = new Date(now)
    if (period === 'monthly') {
      since.setMonth(since.getMonth() - points + 1)
      since.setDate(1)
    } else {
      since.setDate(since.getDate() - points + 1)
    }
    since.setHours(0, 0, 0, 0)

    const myPrograms = await db.program.findMany({
      where: { seller_id: user.userId },
      select: { id: true },
    })
    const programIds = myPrograms.map(p => p.id)

    const orders = await db.order.findMany({
      where: {
        program_id: { in: programIds },
        status: { in: ['paid', 'confirmed'] },
        created_at: { gte: since },
      },
      select: { amount: true, created_at: true },
    })

    const revenueMap = new Map<string, number>()
    const countMap = new Map<string, number>()
    for (const o of orders) {
      const d = o.created_at
      const key = period === 'monthly'
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      revenueMap.set(key, (revenueMap.get(key) ?? 0) + o.amount)
      countMap.set(key, (countMap.get(key) ?? 0) + 1)
    }

    const chart: { date: string; revenue: number; orders: number }[] = []
    for (let i = points - 1; i >= 0; i--) {
      const d = new Date(now)
      let key: string
      if (period === 'monthly') {
        d.setMonth(d.getMonth() - i)
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      } else {
        d.setDate(d.getDate() - i)
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      }
      chart.push({ date: key, revenue: revenueMap.get(key) ?? 0, orders: countMap.get(key) ?? 0 })
    }

    return Response.json({ chart, period })
  } catch (err) {
    return handleError(err)
  }
}
