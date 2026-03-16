import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, handleError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [programs, orders, reviewStats] = await Promise.all([
      db.program.findMany({
        where: { seller_id: user.userId },
        select: {
          id: true, title: true, category: true, price: true, status: true,
          rating_avg: true, review_count: true, thumbnail_url: true,
          _count: { select: { orders: true } },
        },
        orderBy: { created_at: 'desc' },
      }),
      db.order.findMany({
        where: {
          program: { seller_id: user.userId },
          status: { in: ['paid', 'confirmed'] },
        },
        include: {
          buyer: { select: { nickname: true } },
          program: { select: { id: true, title: true } },
        },
        orderBy: { created_at: 'desc' },
        take: 50,
      }),
      db.review.aggregate({
        where: { program: { seller_id: user.userId } },
        _avg: { rating: true },
        _count: { id: true },
      }),
    ])

    const totalRevenue = orders.reduce((s, o) => s + o.amount, 0)
    const monthOrders = orders.filter(o => new Date(o.created_at) >= monthStart)
    const monthRevenue = monthOrders.reduce((s, o) => s + o.amount, 0)

    return Response.json({
      programs: programs.map(p => ({
        id: p.id,
        title: p.title,
        category: p.category,
        price: p.price,
        status: p.status,
        ratingAvg: p.rating_avg,
        reviewCount: p.review_count,
        orderCount: p._count.orders,
        revenue: p._count.orders * p.price,
        thumbnailUrl: p.thumbnail_url,
      })),
      orders: orders.map(o => ({
        id: o.id,
        orderNumber: o.order_number,
        buyerName: o.buyer.nickname,
        programTitle: o.program.title,
        programId: o.program.id,
        amount: o.amount,
        status: o.status,
        createdAt: o.created_at,
      })),
      stats: {
        totalPrograms: programs.length,
        activePrograms: programs.filter(p => p.status === 'active').length,
        totalOrders: orders.length,
        monthOrders: monthOrders.length,
        totalRevenue,
        monthRevenue,
        avgRating: reviewStats._avg.rating ?? 0,
        totalReviews: reviewStats._count.id,
      },
    })
  } catch (err) {
    return handleError(err)
  }
}
