import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, requireRole, handleError, ApiError } from '@/lib/auth'

// 다운로드 권한 취소
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = verifyAccessToken(req)
    requireRole(user, 'admin', 'manager')

    const permission = await db.downloadPermission.findUnique({ where: { id } })
    if (!permission) throw new ApiError(404, '다운로드 권한을 찾을 수 없습니다')

    await db.downloadPermission.update({
      where: { id },
      data: { is_revoked: true },
    })

    return Response.json({ success: true })
  } catch (err) {
    return handleError(err)
  }
}
