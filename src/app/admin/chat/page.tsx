'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { useAuth } from '@/store/auth'

interface ChatRoom {
  id: string
  type: 'seller' | 'admin'
  user_id: string
  updated_at: string
  user: { id: string; nickname: string; profile_image: string | null }
  messages: { content: string; created_at: string; sender_id: string }[]
  unreadCount: number
}

export default function AdminChatPage() {
  const { user, accessToken } = useAuth()
  const router = useRouter()
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.replace('/login'); return }
    if (user.role !== 'admin' && user.role !== 'manager') {
      router.replace('/'); return
    }
    fetch('/api/chat/rooms', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.ok ? r.json() : { rooms: [] })
      .then(d => setRooms(d.rooms ?? []))
      .finally(() => setLoading(false))
  }, [user, accessToken, router])

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) return null

  const totalUnread = rooms.reduce((sum, r) => sum + r.unreadCount, 0)

  return (
    <div style={{ fontFamily: "'Pretendard Variable', sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <Header />
      <main style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px 80px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Link href="/admin" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: 22 }}>←</Link>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: '#111827', margin: 0 }}>
            고객 채팅
            {totalUnread > 0 && (
              <span style={{ marginLeft: 8, background: '#EF4444', color: '#fff', fontSize: 12, fontWeight: 800, padding: '2px 8px', borderRadius: 10 }}>
                {totalUnread}
              </span>
            )}
          </h1>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>불러오는 중...</div>
        ) : rooms.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '60px 20px', border: '1px solid #F0EDE8', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#6B7280' }}>아직 고객 채팅이 없어요</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rooms.map(room => (
              <Link key={room.id} href={`/admin/chat/${room.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', border: `1px solid ${room.unreadCount > 0 ? '#BFDBFE' : '#F0EDE8'}`, display: 'flex', alignItems: 'center', gap: 14, transition: 'box-shadow 0.15s', cursor: 'pointer' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
                    {room.user.profile_image
                      ? <img src={room.user.profile_image} alt={room.user.nickname} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                      : room.user.nickname[0]
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{room.user.nickname}</span>
                      {room.messages[0] && (
                        <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                          {new Date(room.messages[0].created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {room.messages[0] ? room.messages[0].content : '채팅 없음'}
                    </div>
                  </div>
                  {room.unreadCount > 0 && (
                    <div style={{ background: '#EF4444', color: '#fff', fontSize: 11, fontWeight: 800, minWidth: 20, height: 20, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', flexShrink: 0 }}>
                      {room.unreadCount > 9 ? '9+' : room.unreadCount}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
