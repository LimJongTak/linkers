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
          sale_price: true, sale_start_at: true, sale_end_at: true,
          rating_avg: true, review_count: true, thumbnail_url: true,
          _count: { select: { orders: true } },
          orders: {
            where: { status: { in: ['paid', 'confirmed'] } },
            select: { seller_amount: true, amount: true },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      db.order.findMany({
        where: {
          program: { seller_id: user.userId },
          status: { in: ['paid', 'confirmed'] },
        },
        select: {
          id: true, order_number: true, amount: true, seller_amount: true,
          status: true, created_at: true,
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

    // seller_amount: 세일가 적용된 판매자 기준 금액 (쿠폰 할인 전)
    const totalRevenue = orders.reduce((s, o) => s + (o.seller_amount || o.amount), 0)
    const monthOrders = orders.filter(o => new Date(o.created_at) >= monthStart)
    const monthRevenue = monthOrders.reduce((s, o) => s + (o.seller_amount || o.amount), 0)

    return Response.json({
      programs: programs.map(p => {
        const now = new Date()
        const isSaleActive = !!(
          p.sale_price && p.sale_price > 0 && p.sale_price < p.price &&
          (!p.sale_start_at || p.sale_start_at <= now) &&
          (!p.sale_end_at || p.sale_end_at >= now)
        )
        const revenue = p.orders.reduce((s: number, o: { seller_amount: number; amount: number }) => s + (o.seller_amount || o.amount), 0)
        return {
          id: p.id,
          title: p.title,
          category: p.category,
          price: p.price,
          salePrice: p.sale_price,
          saleStartAt: p.sale_start_at,
          saleEndAt: p.sale_end_at,
          isSaleActive,
          status: p.status,
          ratingAvg: parseFloat(String(p.rating_avg)) || 0,
          reviewCount: p.review_count,
          orderCount: p._count.orders,
          revenue,
          thumbnailUrl: p.thumbnail_url,
        }
      }),
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
        avgRating: parseFloat(String(reviewStats._avg.rating ?? 0)) || 0,
        totalReviews: reviewStats._count.id,
      },
    })
  } catch (err) {
    return handleError(err)
  }
}
