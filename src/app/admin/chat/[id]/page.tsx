'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { useAuth } from '@/store/auth'
import ChatRoom from '@/components/chat/ChatRoom'

interface RoomInfo {
  id: string
  type: 'seller' | 'admin'
  user_id: string
  user: { id: string; nickname: string; profile_image: string | null }
}

export default function AdminChatRoomPage() {
  const { id } = useParams<{ id: string }>()
  const { user, accessToken } = useAuth()
  const router = useRouter()
  const [room, setRoom] = useState<RoomInfo | null>(null)

  useEffect(() => {
    if (!user) { router.replace('/login'); return }
    if (user.role !== 'admin' && user.role !== 'manager') { router.replace('/'); return }
  }, [user, router])

  useEffect(() => {
    if (!user || !accessToken) return
    if (user.role !== 'admin' && user.role !== 'manager') return
    fetch('/api/chat/rooms?context=admin', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.ok ? r.json() : { rooms: [] })
      .then(d => setRoom((d.rooms ?? []).find((r: RoomInfo) => r.id === id) ?? null))
  }, [user, accessToken, id])

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) return null

  const customerName = room?.user?.nickname ?? '고객'
  const customerImage = room?.user?.profile_image ?? null

  return (
    <div style={{ fontFamily: "'Pretendard Variable', sans-serif", minHeight: '100vh', background: '#F7F6F3', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <ChatRoom
        roomId={id}
        backHref="/admin/chat"
        myBubbleColor="#7C3AED"
        otherParty={{
          name: customerName,
          image: customerImage,
          subtitle: '고객',
          avatarBg: 'linear-gradient(135deg,#7C3AED,#4F46E5)',
        }}
      />
    </div>
  )
}
