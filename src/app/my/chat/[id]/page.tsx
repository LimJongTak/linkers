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
  seller_id: string | null
  seller: { id: string; nickname: string; profile_image: string | null } | null
}

export default function MyChatRoomPage() {
  const { id } = useParams<{ id: string }>()
  const { user, accessToken } = useAuth()
  const router = useRouter()
  const [room, setRoom] = useState<RoomInfo | null>(null)

  useEffect(() => {
    if (!user) { router.replace('/login'); return }
  }, [user, router])

  useEffect(() => {
    if (!user || !accessToken) return
    fetch('/api/chat/rooms', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.ok ? r.json() : { rooms: [] })
      .then(d => setRoom((d.rooms ?? []).find((r: RoomInfo) => r.id === id) ?? null))
  }, [user, accessToken, id])

  if (!user) return null

  const isAdmin = room?.type === 'admin'
  const otherName = isAdmin ? '링커스 고객지원' : (room?.seller?.nickname ?? '판매자')
  const otherImage = isAdmin ? '/icon.svg' : (room?.seller?.profile_image ?? null)

  return (
    <div style={{ fontFamily: "'Pretendard Variable', sans-serif", minHeight: '100vh', background: '#F7F6F3', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <ChatRoom
        roomId={id}
        backHref="/my/chat"
        myBubbleColor="#111827"
        otherParty={{
          name: otherName,
          image: otherImage,
          subtitle: isAdmin ? '링커스 고객지원' : '판매자',
          avatarBg: isAdmin ? '#111827' : 'linear-gradient(135deg,#4FC3F7,#667EEA)',
        }}
      />
    </div>
  )
}
