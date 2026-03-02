import { describe, it, expect } from '@jest/globals'
import { NextRequest } from 'next/server'
import { issueTokens, verifyAccessToken, ApiError } from '@/lib/auth'

describe('JWT 인증 모듈', () => {
  const mockUser = { userId: 'user-123', role: 'buyer' as const }

  describe('issueTokens', () => {
    it('accessToken과 refreshToken을 발급한다', () => {
      const { accessToken, refreshToken } = issueTokens(mockUser)
      expect(accessToken).toBeTruthy()
      expect(refreshToken).toBeTruthy()
    })

    it('accessToken은 15분 만료다', () => {
      const { accessToken } = issueTokens(mockUser)
      const [, raw] = accessToken.split('.')
      const payload = JSON.parse(Buffer.from(raw, 'base64url').toString())
      expect(payload.exp - payload.iat).toBe(900)
    })

    it('refreshToken은 7일 만료다', () => {
      const { refreshToken } = issueTokens(mockUser)
      const [, raw] = refreshToken.split('.')
      const payload = JSON.parse(Buffer.from(raw, 'base64url').toString())
      expect(payload.exp - payload.iat).toBe(7 * 24 * 3600)
    })
  })

  describe('verifyAccessToken', () => {
    it('유효한 토큰을 검증한다', () => {
      const { accessToken } = issueTokens(mockUser)
      const req = new NextRequest('http://localhost/api/test', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const result = verifyAccessToken(req)
      expect(result.userId).toBe('user-123')
      expect(result.role).toBe('buyer')
    })

    it('Authorization 헤더 없으면 ApiError(401)을 던진다', () => {
      const req = new NextRequest('http://localhost/api/test')
      expect(() => verifyAccessToken(req)).toThrow(ApiError)
      try { verifyAccessToken(req) } catch (e: any) { expect(e.status).toBe(401) }
    })

    it('잘못된 토큰이면 ApiError(401)을 던진다', () => {
      const req = new NextRequest('http://localhost/api/test', {
        headers: { Authorization: 'Bearer bad.token.here' },
      })
      expect(() => verifyAccessToken(req)).toThrow(ApiError)
    })
  })
})
