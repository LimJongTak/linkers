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
  seller_id: string | null
  updated_at: string
  seller: { id: string; nickname: string; profile_image: string | null } | null
  messages: { content: string; created_at: string; sender_id: string }[]
  unreadCount: number
}

export default function MyChatPage() {
  const { user, accessToken } = useAuth()
  const router = useRouter()
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.replace('/login'); return }
    fetch('/api/chat/rooms', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.ok ? r.json() : { rooms: [] })
      .then(d => setRooms(d.rooms ?? []))
      .finally(() => setLoading(false))
  }, [user, accessToken, router])

  const handleStartAdminChat = async () => {
    const res = await fetch('/api/chat/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ type: 'admin' }),
    })
    if (res.ok) {
      const { room } = await res.json()
      router.push(`/my/chat/${room.id}`)
    }
  }

  if (!user) return null

  const sellerRooms = rooms.filter(r => r.type === 'seller')
  const adminRoom = rooms.find(r => r.type === 'admin')
  const totalUnread = rooms.reduce((sum, r) => sum + r.unreadCount, 0)

  return (
    <div style={{ fontFamily: "'Pretendard Variable', sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <Header />
      <main style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px 80px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Link href="/my" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: 22 }}>←</Link>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: '#111827', margin: 0 }}>
            채팅
            {totalUnread > 0 && (
              <span style={{ marginLeft: 8, background: '#EF4444', color: '#fff', fontSize: 12, fontWeight: 800, padding: '2px 8px', borderRadius: 10 }}>
                {totalUnread}
              </span>
            )}
          </h1>
        </div>

        {/* 관리자 채팅 */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#6B7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>관리자 채팅</div>
          {adminRoom ? (
            <RoomCard room={adminRoom} href={`/my/chat/${adminRoom.id}`} label="관리자" isAdmin />
          ) : (
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid #F0EDE8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🛡️</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>관리자</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>채팅을 시작해보세요</div>
                </div>
              </div>
              <button onClick={handleStartAdminChat}
                style={{ background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                채팅 시작
              </button>
            </div>
          )}
        </div>

        {/* 판매자 채팅 */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#6B7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            판매자 채팅 ({sellerRooms.length})
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>불러오는 중...</div>
          ) : sellerRooms.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 14, padding: '40px 20px', border: '1px solid #F0EDE8', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>💬</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#6B7280', marginBottom: 6 }}>아직 판매자와 채팅이 없어요</div>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>판매자 프로필 페이지에서 채팅을 시작할 수 있어요</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sellerRooms.map(room => (
                <RoomCard key={room.id} room={room} href={`/my/chat/${room.id}`}
                  label={room.seller?.nickname ?? '판매자'} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function RoomCard({ room, href, label, isAdmin }: {
  room: ChatRoom
  href: string
  label: string
  isAdmin?: boolean
}) {
  const lastMsg = room.messages[0]
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', border: `1px solid ${room.unreadCount > 0 ? '#BFDBFE' : '#F0EDE8'}`, display: 'flex', alignItems: 'center', gap: 14, transition: 'box-shadow 0.15s', cursor: 'pointer' }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: isAdmin ? 'linear-gradient(135deg,#7C3AED,#4F46E5)' : 'linear-gradient(135deg,#4FC3F7,#667EEA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isAdmin ? 20 : 18, fontWeight: 900, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
          {isAdmin ? '🛡️' : (room.seller?.profile_image
            ? <img src={room.seller.profile_image} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
            : label[0]
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{label}</span>
            {lastMsg && (
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                {new Date(lastMsg.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {lastMsg ? lastMsg.content : '채팅을 시작해보세요'}
          </div>
        </div>
        {room.unreadCount > 0 && (
          <div style={{ background: '#EF4444', color: '#fff', fontSize: 11, fontWeight: 800, minWidth: 20, height: 20, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', flexShrink: 0 }}>
            {room.unreadCount > 9 ? '9+' : room.unreadCount}
          </div>
        )}
      </div>
    </Link>
  )
}
