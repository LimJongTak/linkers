import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, requireRole, handleError, ApiError } from '@/lib/auth'
import { grantDownloadPermissions } from '@/lib/permissions'

// 관리자 프로그램 상태 변경
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = verifyAccessToken(req)
    requireRole(user, 'admin', 'manager')

    const { status } = await req.json()
    const allowed = ['active', 'paused', 'deleted', 'draft']
    if (!allowed.includes(status)) throw new ApiError(400, '허용되지 않는 상태값입니다')

    const program = await db.program.update({
      where: { id },
      data: { status },
    })

    // 활성화 시 기존 결제완료 주문에 다운로드 권한 부여
    if (status === 'active') {
      const paidOrders = await db.order.findMany({
        where: { program_id: id, status: { in: ['paid', 'confirmed'] } },
        select: { id: true },
      })
      await Promise.allSettled(paidOrders.map(o => grantDownloadPermissions(o.id)))
    }

    return Response.json({ success: true, program })
  } catch (err) {
    return handleError(err)
  }
}

// 관리자 프로그램 삭제 (하드 삭제 가능)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = verifyAccessToken(req)
    requireRole(user, 'admin', 'manager')

    await db.program.update({ where: { id }, data: { status: 'deleted' } })
    return Response.json({ success: true })
  } catch (err) {
    return handleError(err)
  }
}
