import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, requireRole, handleError } from '@/lib/auth'
import { sendAlimtalk } from '@/lib/kakao'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = verifyAccessToken(req)
    requireRole(user, 'admin')

    const program = await db.program.update({
      where: { id },
      data: { status: 'active' },
      include: { seller: true },
    })

    if (program.seller.phone) {
      await sendAlimtalk({
        templateCode: 'PROGRAM_APPROVED',
        to: program.seller.phone,
        variables: { '#{프로그램명}': program.title },
      })
    }

    return Response.json({ success: true, program })
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = verifyAccessToken(req)
    requireRole(user, 'admin')

    const body = await req.json().catch(() => ({}))
    const reason = body.reason ?? '관리자 반려'

    await db.program.update({
      where: { id },
      data: { status: 'deleted' },
    })

    return Response.json({ success: true, reason })
  } catch (err) {
    return handleError(err)
  }
}
