'use client'

import { createElement, createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'

export type UserRole = 'buyer' | 'seller' | 'manager' | 'admin'

export interface AuthUser {
  id: string
  nickname: string
  role: UserRole
  profileImage?: string
}

interface AuthCtx {
  user: AuthUser | null
  accessToken: string | null
  login: (token: string, user: AuthUser) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  accessToken: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
})

/** JWT payload의 exp 필드를 디코딩해 만료까지 남은 ms 반환 */
function getTokenTtlMs(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 - Date.now()
  } catch {
    return 0
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]               = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading]     = useState(true)
  const logoutRef = useRef<() => void>(() => {})

  const logout = () => {
    setUser(null)
    setAccessToken(null)
    sessionStorage.removeItem('linkers_user')
    sessionStorage.removeItem('linkers_at')
  }
  logoutRef.current = logout

  const login = (token: string, u: AuthUser) => {
    setUser(u)
    setAccessToken(token)
    sessionStorage.setItem('linkers_user', JSON.stringify(u))
    sessionStorage.setItem('linkers_at', token)
  }

  // 초기 로드
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('linkers_user')
      const token = sessionStorage.getItem('linkers_at')
      if (saved && token) {
        setUser(JSON.parse(saved))
        setAccessToken(token)
      }
    } catch {}
    setIsLoading(false)
  }, [])

  // 액세스 토큰 자동 갱신: 만료 2분 전 또는 이미 만료됐으면 즉시 갱신
  useEffect(() => {
    if (!accessToken) return

    let cancelled = false

    const doRefresh = async () => {
      if (cancelled) return
      try {
        const res = await fetch('/api/auth/refresh', { method: 'POST' })
        if (cancelled) return
        if (!res.ok) { logoutRef.current(); return }
        const { accessToken: newToken } = await res.json()
        if (cancelled) return
        setAccessToken(newToken)
        sessionStorage.setItem('linkers_at', newToken)
      } catch {
        if (!cancelled) logoutRef.current()
      }
    }

    const ttl = getTokenTtlMs(accessToken)
    if (ttl <= 60 * 1000) {
      // 이미 만료됐거나 1분 이내 → 즉시 갱신
      doRefresh()
      return () => { cancelled = true }
    }

    // 만료 2분 전에 갱신 예약
    const delay = ttl - 2 * 60 * 1000
    const timer = setTimeout(doRefresh, delay)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [accessToken])

  return createElement(
    AuthContext.Provider,
    { value: { user, accessToken, login, logout, isLoading } },
    children
  )
}

export const useAuth = () => useContext(AuthContext)
