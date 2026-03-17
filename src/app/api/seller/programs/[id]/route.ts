import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, ApiError, handleError } from '@/lib/auth'

// 판매자 프로그램 삭제 (소프트 삭제)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = verifyAccessToken(req)

    const program = await db.program.findUnique({ where: { id } })
    if (!program) throw new ApiError(404, 'PROGRAM_NOT_FOUND')
    if (program.seller_id !== user.userId) throw new ApiError(403, 'FORBIDDEN')
    if (program.status === 'deleted') throw new ApiError(400, '이미 삭제된 프로그램입니다')

    const pendingOrders = await db.order.count({
      where: { program_id: id, status: 'pending' },
    })
    if (pendingOrders > 0) throw new ApiError(400, '결제 진행 중인 주문이 있어 삭제할 수 없습니다')

    await db.program.update({
      where: { id },
      data: { status: 'deleted' },
    })

    return Response.json({ success: true })
  } catch (err) {
    return handleError(err)
  }
}

// 판매자 프로그램 상태/세일 변경
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = verifyAccessToken(req)
    const body = await req.json()

    const program = await db.program.findUnique({ where: { id } })
    if (!program) throw new ApiError(404, 'PROGRAM_NOT_FOUND')
    if (program.seller_id !== user.userId) throw new ApiError(403, 'FORBIDDEN')

    // 상태 변경
    if (body.status !== undefined) {
      const allowed = ['paused', 'active']
      if (!allowed.includes(body.status)) throw new ApiError(400, '허용되지 않는 상태값입니다')
      if (program.status === 'draft') throw new ApiError(400, '검수 중인 프로그램은 상태를 변경할 수 없습니다')
      await db.program.update({ where: { id }, data: { status: body.status } })
      return Response.json({ success: true })
    }

    // 세일 설정
    if (body.action === 'set_sale') {
      const { salePrice, saleStartAt, saleEndAt } = body

      if (salePrice !== null && salePrice !== undefined) {
        const price = parseInt(salePrice)
        if (isNaN(price) || price <= 0) throw new ApiError(400, '세일가는 0보다 커야 합니다')
        if (price >= program.price) throw new ApiError(400, '세일가는 정가보다 낮아야 합니다')
      }

      await db.program.update({
        where: { id },
        data: {
          sale_price: salePrice ? parseInt(salePrice) : null,
          sale_start_at: saleStartAt ? new Date(saleStartAt) : null,
          sale_end_at: saleEndAt ? new Date(saleEndAt) : null,
        },
      })
      return Response.json({ success: true })
    }

    // 세일 종료 (즉시)
    if (body.action === 'end_sale') {
      await db.program.update({
        where: { id },
        data: { sale_price: null, sale_start_at: null, sale_end_at: null },
      })
      return Response.json({ success: true })
    }

    throw new ApiError(400, '처리할 수 없는 요청입니다')
  } catch (err) {
    return handleError(err)
  }
}
