import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, requireRole, handleError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    requireRole(user, 'admin', 'manager')

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalUsers, totalSellers, totalBuyers,
      totalPrograms, activePrograms, pendingPrograms,
      totalOrders, paidOrders,
      totalRevenue, monthRevenue,
      pendingSettlements, pendingPoints,
      recentOrders,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: 'seller' } }),
      db.user.count({ where: { role: 'buyer' } }),
      db.program.count(),
      db.program.count({ where: { status: 'active' } }),
      db.program.count({ where: { status: 'draft' } }),
      db.order.count(),
      db.order.count({ where: { status: { in: ['paid', 'confirmed'] } } }),
      db.payment.aggregate({ _sum: { paid_amount: true } }),
      db.payment.aggregate({
        _sum: { paid_amount: true },
        where: { paid_at: { gte: monthStart } },
      }),
      db.settlement.count({ where: { status: 'pending' } }),
      db.settlement.aggregate({
        _sum: { net_amount: true },
        where: { status: 'pending' },
      }),
      db.order.findMany({
        where: { status: { in: ['paid', 'confirmed', 'pending'] } },
        orderBy: { created_at: 'desc' },
        take: 5,
        include: {
          buyer: { select: { nickname: true } },
          program: { select: { title: true } },
        },
      }),
    ])

    return Response.json({
      users: { total: totalUsers, sellers: totalSellers, buyers: totalBuyers },
      programs: { total: totalPrograms, active: activePrograms, pending: pendingPrograms },
      orders: { total: totalOrders, paid: paidOrders },
      revenue: {
        total: totalRevenue._sum.paid_amount ?? 0,
        month: monthRevenue._sum.paid_amount ?? 0,
      },
      settlements: {
        pending: pendingSettlements,
        pendingAmount: pendingPoints._sum.net_amount ?? 0,
      },
      recentOrders,
    })
  } catch (err) {
    return handleError(err)
  }
}
