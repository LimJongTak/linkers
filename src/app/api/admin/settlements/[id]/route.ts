import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, requireRole, handleError, ApiError } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyAccessToken(req)
    requireRole(user, 'admin')

    const { id } = await params
    const { action, bank_name, bank_account } = await req.json()

    const settlement = await db.settlement.findUnique({ where: { id } })
    if (!settlement) throw new ApiError(404, 'SETTLEMENT_NOT_FOUND')

    if (action === 'complete') {
      if (settlement.status === 'completed') throw new ApiError(400, 'ALREADY_COMPLETED')
      const updated = await db.settlement.update({
        where: { id },
        data: {
          status: 'completed',
          settled_at: new Date(),
          bank_name: bank_name ?? settlement.bank_name,
          bank_account: bank_account ?? settlement.bank_account,
        },
      })
      return Response.json({ settlement: updated })
    }

    if (action === 'hold') {
      const updated = await db.settlement.update({
        where: { id },
        data: { status: 'held' },
      })
      return Response.json({ settlement: updated })
    }

    if (action === 'release') {
      const updated = await db.settlement.update({
        where: { id },
        data: { status: 'pending' },
      })
      return Response.json({ settlement: updated })
    }

    throw new ApiError(400, 'INVALID_ACTION')
  } catch (err) {
    return handleError(err)
  }
}
