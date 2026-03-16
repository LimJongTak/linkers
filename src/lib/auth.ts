import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto'

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(':')
    const buf = scryptSync(password, salt, 64)
    return timingSafeEqual(Buffer.from(hash, 'hex'), buf)
  } catch {
    return false
  }
}

export interface JWTPayload {
  userId: string
  role: 'buyer' | 'seller' | 'manager' | 'admin'
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export function verifyAccessToken(req: NextRequest): JWTPayload {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) throw new ApiError(401, 'UNAUTHORIZED')

  try {
    return jwt.verify(auth.slice(7), process.env.JWT_SECRET!) as JWTPayload
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') throw new ApiError(401, 'TOKEN_EXPIRED')
    throw new ApiError(401, 'INVALID_TOKEN')
  }
}

export function issueTokens(payload: JWTPayload) {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '15m' })
  const refreshToken = jwt.sign(
    { userId: payload.userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  )
  return { accessToken, refreshToken }
}

export function requireRole(user: JWTPayload, ...roles: string[]) {
  if (!roles.includes(user.role)) throw new ApiError(403, 'FORBIDDEN')
}

export function handleError(err: unknown) {
  if (err instanceof ApiError) {
    return Response.json({ error: err.message }, { status: err.status })
  }
  const message = err instanceof Error ? err.message : String(err)
  console.error('[API Error]', err)
  // dev 환경에서는 실제 에러 메시지 노출
  const detail = process.env.NODE_ENV !== 'production' ? message : undefined
  return Response.json({ error: 'Internal Server Error', detail }, { status: 500 })
}
