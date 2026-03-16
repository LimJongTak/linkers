import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'
import { issueTokens, handleError, ApiError } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refresh_token')?.value
    if (!refreshToken) throw new ApiError(401, 'NO_REFRESH_TOKEN')

    let payload: { userId: string }
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string }
    } catch {
      throw new ApiError(401, 'INVALID_REFRESH_TOKEN')
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true },
    })
    if (!user) throw new ApiError(401, 'USER_NOT_FOUND')

    const { accessToken } = issueTokens({ userId: user.id, role: user.role as 'buyer' | 'seller' | 'admin' })
    return Response.json({ accessToken })
  } catch (err) {
    return handleError(err)
  }
}
