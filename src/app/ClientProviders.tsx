'use client'

import { AuthProvider } from '@/store/auth'

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
