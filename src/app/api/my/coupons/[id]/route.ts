import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, handleError, ApiError } from '@/lib/auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = verifyAccessToken(req)
    const { id } = await params
    const isAdmin = user.role === 'admin' || user.role === 'manager'

    const coupon = await db.coupon.findUnique({ where: { id }, select: { created_by: true } })
    if (!coupon) throw new ApiError(404, 'COUPON_NOT_FOUND')
    if (!isAdmin && coupon.created_by !== user.userId) throw new ApiError(403, '권한이 없습니다')

    const { isActive, expiresAt, description, usageLimit } = await req.json()

    const updated = await db.coupon.update({
      where: { id },
      data: {
        ...(isActive !== undefined && { is_active: isActive }),
        ...(expiresAt !== undefined && { expires_at: expiresAt ? new Date(expiresAt) : null }),
        ...(description !== undefined && { description }),
        ...(usageLimit !== undefined && { usage_limit: usageLimit ? Number(usageLimit) : null }),
      },
      select: {
        id: true, code: true, is_active: true, expires_at: true, description: true, usage_limit: true,
      },
    })

    return Response.json({ coupon: updated })
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = verifyAccessToken(req)
    const { id } = await params
    const isAdmin = user.role === 'admin' || user.role === 'manager'

    const coupon = await db.coupon.findUnique({ where: { id }, select: { created_by: true, used_count: true } })
    if (!coupon) throw new ApiError(404, 'COUPON_NOT_FOUND')
    if (!isAdmin && coupon.created_by !== user.userId) throw new ApiError(403, '권한이 없습니다')
    if (coupon.used_count > 0) throw new ApiError(400, '이미 사용된 쿠폰은 삭제할 수 없습니다. 비활성화를 이용해주세요')

    await db.coupon.delete({ where: { id } })
    return Response.json({ success: true })
  } catch (err) {
    return handleError(err)
  }
}
