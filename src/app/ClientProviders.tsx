'use client'

import { AuthProvider } from '@/store/auth'
import AdminChatWidget from '@/components/chat/AdminChatWidget'

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <AdminChatWidget />
    </AuthProvider>
  )
}
