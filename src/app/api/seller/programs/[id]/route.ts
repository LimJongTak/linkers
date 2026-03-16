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

    // 진행 중인 결제 주문이 있으면 삭제 불가
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

// 판매자 프로그램 상태 변경 (일시중지/재개)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = verifyAccessToken(req)
    const { status } = await req.json()

    const program = await db.program.findUnique({ where: { id } })
    if (!program) throw new ApiError(404, 'PROGRAM_NOT_FOUND')
    if (program.seller_id !== user.userId) throw new ApiError(403, 'FORBIDDEN')

    const allowed = ['paused', 'active']
    if (!allowed.includes(status)) throw new ApiError(400, '허용되지 않는 상태값입니다')
    if (program.status === 'draft') throw new ApiError(400, '검수 중인 프로그램은 상태를 변경할 수 없습니다')

    await db.program.update({ where: { id }, data: { status } })
    return Response.json({ success: true })
  } catch (err) {
    return handleError(err)
  }
}
