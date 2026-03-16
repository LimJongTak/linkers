import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, requireRole, handleError, ApiError } from '@/lib/auth'
import { grantDownloadPermissions } from '@/lib/permissions'

// 전체 다운로드 권한 목록
export async function GET(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    requireRole(user, 'admin', 'manager')

    const { searchParams } = req.nextUrl
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const orderId = searchParams.get('orderId') ?? ''
    const limit = 20

    const where: any = {}
    if (orderId) where.order_id = orderId

    const [permissions, total] = await Promise.all([
      db.downloadPermission.findMany({
        where,
        include: {
          buyer: { select: { id: true, nickname: true } },
          program_file: { select: { id: true, file_name: true } },
          order: { select: { id: true, order_number: true, program: { select: { title: true } } } },
        },
        orderBy: { granted_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.downloadPermission.count({ where }),
    ])

    return Response.json({ permissions, total, totalPages: Math.ceil(total / limit), page })
  } catch (err) {
    return handleError(err)
  }
}

// 특정 주문에 다운로드 권한 수동 부여
export async function POST(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)
    requireRole(user, 'admin', 'manager')

    const { orderId } = await req.json()
    if (!orderId) throw new ApiError(400, 'orderId 필수')

    await grantDownloadPermissions(orderId)
    return Response.json({ success: true })
  } catch (err) {
    return handleError(err)
  }
}
