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
  user: { id: string; nickname: string; profile_image: string | null }
  seller: { id: string; nickname: string; profile_image: string | null } | null
}

export default function SellerChatRoomPage() {
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

  const buyerName = room?.user?.nickname ?? '구매자'
  const buyerImage = room?.user?.profile_image ?? null

  return (
    <div style={{ fontFamily: "'Pretendard Variable', sans-serif", minHeight: '100vh', background: '#F7F6F3', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <ChatRoom
        roomId={id}
        backHref="/seller/chat"
        myBubbleColor="#0369A1"
        otherParty={{
          name: buyerName,
          image: buyerImage,
          subtitle: '구매자',
          avatarBg: 'linear-gradient(135deg,#10B981,#059669)',
        }}
      />
    </div>
  )
}
