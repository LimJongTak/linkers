'use client'

import { createElement, createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type UserRole = 'buyer' | 'seller' | 'admin'

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

  const login = (token: string, u: AuthUser) => {
    setUser(u)
    setAccessToken(token)
    sessionStorage.setItem('linkers_user', JSON.stringify(u))
    sessionStorage.setItem('linkers_at', token)
  }

  const logout = () => {
    setUser(null)
    setAccessToken(null)
    sessionStorage.removeItem('linkers_user')
    sessionStorage.removeItem('linkers_at')
  }

  // JSX 대신 createElement 사용 → 파일이 .ts로도 동작 가능
  return createElement(
    AuthContext.Provider,
    { value: { user, accessToken, login, logout, isLoading } },
    children
  )
}

export const useAuth = () => useContext(AuthContext)
