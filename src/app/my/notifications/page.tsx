'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { useAuth } from '@/store/auth'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  link: string | null
  is_read: boolean
  created_at: string
}

const typeIcon = (t: string) => ({
  order_paid: '✅',
  order_confirmed: '🎉',
  order_refunded: '↩️',
  withdrawal_processed: '💸',
  inquiry_answered: '💬',
}[t] ?? '🔔')

export default function NotificationsPage() {
  const { user, accessToken } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.replace('/login'); return }
    fetch('/api/notifications', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => setNotifications(d.notifications ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user, accessToken, router])

  const markRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    await fetch(`/api/notifications/${id}`, { method: 'PATCH', headers: { Authorization: `Bearer ${accessToken}` } })
  }

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    await fetch('/api/notifications/read-all', { method: 'PATCH', headers: { Authorization: `Bearer ${accessToken}` } })
  }

  if (!user) return null

  const unread = notifications.filter(n => !n.is_read).length

  return (
    <div style={{ fontFamily: "'Pretendard Variable', sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <Header />
      <main style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/my" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: 22 }}>←</Link>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: '#111827', margin: 0 }}>알림 센터</h1>
            {unread > 0 && (
              <span style={{ background: '#EF4444', color: '#fff', fontSize: 11, fontWeight: 900, padding: '2px 8px', borderRadius: 20 }}>{unread}</span>
            )}
          </div>
          {unread > 0 && (
            <button onClick={markAllRead}
              style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              모두 읽음 처리
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>불러오는 중...</div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#6B7280' }}>알림이 없습니다</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notifications.map(n => {
              const content = (
                <div key={n.id}
                  style={{ background: n.is_read ? '#fff' : '#F0F9FF', borderRadius: 14, padding: '16px 18px', border: `1px solid ${n.is_read ? '#F0EDE8' : '#BAE6FD'}`, display: 'flex', gap: 14, alignItems: 'flex-start', cursor: n.link ? 'pointer' : 'default', transition: 'all 0.15s' }}
                  onClick={() => { if (!n.is_read) markRead(n.id) }}>
                  <div style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{typeIcon(n.type)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{n.title}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6', flexShrink: 0 }} />}
                        <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>{new Date(n.created_at).toLocaleDateString('ko-KR')}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>{n.body}</div>
                  </div>
                </div>
              )

              return n.link ? (
                <Link key={n.id} href={n.link} style={{ textDecoration: 'none' }} onClick={() => markRead(n.id)}>
                  {content}
                </Link>
              ) : content
            })}
          </div>
        )}
      </main>
    </div>
  )
}
