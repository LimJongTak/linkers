'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { useAuth } from '@/store/auth'

interface Message {
  id: string
  content: string
  sender_id: string
  is_read: boolean
  created_at: string
  sender: { id: string; nickname: string; profile_image: string | null; role: string }
}

interface ChatRoom {
  id: string
  type: 'seller' | 'admin'
  user_id: string
  user: { id: string; nickname: string; profile_image: string | null }
}

export default function AdminChatRoomPage() {
  const { id } = useParams<{ id: string }>()
  const { user, accessToken } = useAuth()
  const router = useRouter()

  const [room, setRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastMsgTimeRef = useRef<string | null>(null)

  useEffect(() => {
    if (!user) { router.replace('/login'); return }
    if (user.role !== 'admin' && user.role !== 'manager') { router.replace('/'); return }
  }, [user, router])

  useEffect(() => {
    if (!user || !accessToken) return
    if (user.role !== 'admin' && user.role !== 'manager') return
    const h = { Authorization: `Bearer ${accessToken}` }

    fetch('/api/chat/rooms', { headers: h })
      .then(r => r.ok ? r.json() : { rooms: [] })
      .then(d => {
        const found = d.rooms?.find((r: ChatRoom) => r.id === id)
        if (found) setRoom(found)
      })

    fetch(`/api/chat/rooms/${id}/messages`, { headers: h })
      .then(r => r.ok ? r.json() : { messages: [] })
      .then(d => {
        const msgs = d.messages ?? []
        setMessages(msgs)
        if (msgs.length > 0) lastMsgTimeRef.current = msgs[msgs.length - 1].created_at
      })
      .finally(() => setLoading(false))

    fetch(`/api/chat/rooms/${id}/read`, { method: 'PATCH', headers: h })
  }, [id, user, accessToken])

  useEffect(() => {
    if (!accessToken || !user || (user.role !== 'admin' && user.role !== 'manager')) return
    const poll = setInterval(() => {
      const since = lastMsgTimeRef.current
      const url = since
        ? `/api/chat/rooms/${id}/messages?since=${encodeURIComponent(since)}`
        : `/api/chat/rooms/${id}/messages`
      fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
        .then(r => r.ok ? r.json() : { messages: [] })
        .then(d => {
          const newMsgs: Message[] = d.messages ?? []
          if (newMsgs.length > 0) {
            setMessages(prev => {
              const existingIds = new Set(prev.map(m => m.id))
              const toAdd = newMsgs.filter(m => !existingIds.has(m.id))
              return toAdd.length > 0 ? [...prev, ...toAdd] : prev
            })
            lastMsgTimeRef.current = newMsgs[newMsgs.length - 1].created_at
            fetch(`/api/chat/rooms/${id}/read`, {
              method: 'PATCH',
              headers: { Authorization: `Bearer ${accessToken}` },
            })
          }
        })
    }, 3000)
    return () => clearInterval(poll)
  }, [id, accessToken, user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/chat/rooms/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ content: input.trim() }),
      })
      if (res.ok) {
        const { message } = await res.json()
        setMessages(prev => [...prev, message])
        lastMsgTimeRef.current = message.created_at
        setInput('')
      }
    } finally {
      setSending(false)
    }
  }, [id, input, sending, accessToken])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) return null

  const customerName = room?.user?.nickname ?? '고객'

  return (
    <div style={{ fontFamily: "'Pretendard Variable', sans-serif", minHeight: '100vh', background: '#F7F6F3', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <div style={{ background: '#fff', borderBottom: '1px solid #F0EDE8', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 60, zIndex: 50 }}>
        <Link href="/admin/chat" style={{ color: '#6B7280', textDecoration: 'none', fontSize: 20, lineHeight: 1 }}>←</Link>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff', overflow: 'hidden', flexShrink: 0 }}>
          {room?.user?.profile_image
            ? <img src={room.user.profile_image} alt={customerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
            : customerName[0]
          }
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>{customerName}</div>
          <div style={{ fontSize: 11, color: '#9CA3AF' }}>고객</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>불러오는 중...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#6B7280' }}>고객의 메시지를 기다리는 중...</div>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMine = msg.sender_id === user.id
            const isAdmin = msg.sender.role === 'admin' || msg.sender.role === 'manager'
            const showDate = i === 0 || new Date(messages[i - 1].created_at).toDateString() !== new Date(msg.created_at).toDateString()
            return (
              <div key={msg.id}>
                {showDate && (
                  <div style={{ textAlign: 'center', marginBottom: 10, marginTop: i > 0 ? 8 : 0 }}>
                    <span style={{ fontSize: 11, color: '#9CA3AF', background: '#F3F4F6', padding: '4px 12px', borderRadius: 10 }}>
                      {new Date(msg.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 6 }}>
                  {!isAdmin && (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
                      {room?.user?.profile_image
                        ? <img src={room.user.profile_image} alt={customerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                        : customerName[0]
                      }
                    </div>
                  )}
                  <div style={{ maxWidth: '70%' }}>
                    {!isAdmin && (
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 3, marginLeft: 2 }}>{customerName}</div>
                    )}
                    <div style={{
                      background: isAdmin ? '#7C3AED' : '#fff',
                      color: isAdmin ? '#fff' : '#111827',
                      borderRadius: isAdmin ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      padding: '10px 14px',
                      fontSize: 14,
                      lineHeight: 1.5,
                      border: isAdmin ? 'none' : '1px solid #F0EDE8',
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {msg.content}
                    </div>
                    <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 3, textAlign: isAdmin ? 'right' : 'left' }}>
                      {new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      {isAdmin && isMine && <span style={{ marginLeft: 4 }}>나</span>}
                      {isAdmin && !isMine && <span style={{ marginLeft: 4 }}>{msg.sender.nickname}</span>}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ background: '#fff', borderTop: '1px solid #F0EDE8', padding: '12px 16px', position: 'sticky', bottom: 0 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요 (Enter 전송, Shift+Enter 줄바꿈)"
            rows={1}
            style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '2px solid #E5E7EB', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.5, maxHeight: 120, overflowY: 'auto' }}
            onInput={e => {
              const t = e.target as HTMLTextAreaElement
              t.style.height = 'auto'
              t.style.height = Math.min(t.scrollHeight, 120) + 'px'
            }}
          />
          <button onClick={sendMessage} disabled={!input.trim() || sending}
            style={{ background: !input.trim() || sending ? '#E5E7EB' : '#7C3AED', color: !input.trim() || sending ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 12, width: 44, height: 44, fontSize: 18, cursor: !input.trim() || sending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}>
            {sending ? '...' : '↑'}
          </button>
        </div>
      </div>
    </div>
  )
}
