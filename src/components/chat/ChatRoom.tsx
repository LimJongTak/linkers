'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/store/auth'

interface Message {
  id: string
  content: string
  image_url: string | null
  sender_id: string
  is_read: boolean
  created_at: string
  sender: { id: string; nickname: string; profile_image: string | null; role: string }
}

interface OtherParty {
  name: string
  image: string | null
  subtitle: string
  avatarBg: string
  avatarEmoji?: string
}

interface ChatRoomProps {
  roomId: string
  backHref: string
  myBubbleColor: string
  otherParty: OtherParty
}

export default function ChatRoom({ roomId, backHref, myBubbleColor, otherParty }: ChatRoomProps) {
  const { user, accessToken } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastMsgTimeRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initial load
  useEffect(() => {
    if (!user || !accessToken) return
    const h = { Authorization: `Bearer ${accessToken}` }

    fetch(`/api/chat/rooms/${roomId}/messages`, { headers: h })
      .then(r => r.ok ? r.json() : { messages: [] })
      .then(d => {
        const msgs: Message[] = d.messages ?? []
        setMessages(msgs)
        if (msgs.length > 0) {
          lastMsgTimeRef.current = msgs[msgs.length - 1].created_at
        }
      })
      .finally(() => setLoading(false))

    fetch(`/api/chat/rooms/${roomId}/read`, { method: 'PATCH', headers: h })
  }, [roomId, user, accessToken])

  // Polling — every 3 seconds
  useEffect(() => {
    if (!accessToken) return
    const poll = setInterval(() => {
      const since = lastMsgTimeRef.current
      const url = since
        ? `/api/chat/rooms/${roomId}/messages?since=${encodeURIComponent(since)}`
        : `/api/chat/rooms/${roomId}/messages`
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
            fetch(`/api/chat/rooms/${roomId}/read`, {
              method: 'PATCH',
              headers: { Authorization: `Bearer ${accessToken}` },
            })
          }
        })
    }, 3000)
    return () => clearInterval(poll)
  }, [roomId, accessToken])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다')
      e.target.value = ''
      return
    }

    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      alert('이미지 파일 크기는 10MB 이하여야 합니다')
      e.target.value = ''
      return
    }

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file)
    setPreviewSrc(localPreview)
    setImageUploading(true)
    setPendingImageUrl(null)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const res = await fetch(`/api/chat/rooms/${roomId}/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? '이미지 업로드에 실패했습니다')
      }

      const { imageUrl } = await res.json()
      setPendingImageUrl(imageUrl)
    } catch (err: any) {
      alert(err.message ?? '이미지 업로드에 실패했습니다')
      setPreviewSrc(null)
      setPendingImageUrl(null)
      URL.revokeObjectURL(localPreview)
    } finally {
      setImageUploading(false)
      e.target.value = ''
    }
  }, [roomId, accessToken])

  const clearPendingImage = useCallback(() => {
    if (previewSrc) URL.revokeObjectURL(previewSrc)
    setPreviewSrc(null)
    setPendingImageUrl(null)
    setImageUploading(false)
  }, [previewSrc])

  const sendMessage = useCallback(async () => {
    const hasText = !!input.trim()
    const hasImage = !!pendingImageUrl

    if ((!hasText && !hasImage) || sending || imageUploading) return

    setSending(true)
    try {
      const body: { content?: string; imageUrl?: string } = {}
      if (hasText) body.content = input.trim()
      if (hasImage) body.imageUrl = pendingImageUrl!

      const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        const { message } = await res.json()
        setMessages(prev => [...prev, message])
        lastMsgTimeRef.current = message.created_at
        setInput('')
        clearPendingImage()
      }
    } finally {
      setSending(false)
    }
  }, [roomId, input, sending, imageUploading, pendingImageUrl, accessToken, clearPendingImage])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const canSend = (!!input.trim() || !!pendingImageUrl) && !sending && !imageUploading

  const renderAvatar = (size: number, fontSize: number) => (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: otherParty.avatarBg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize,
      color: '#fff',
      fontWeight: 900,
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {otherParty.avatarEmoji ? (
        otherParty.avatarEmoji
      ) : otherParty.image ? (
        <img
          src={otherParty.image}
          alt={otherParty.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          referrerPolicy="no-referrer"
        />
      ) : (
        otherParty.name[0]
      )}
    </div>
  )

  return (
    <>
      {/* Chat header */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #F0EDE8',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        position: 'sticky',
        top: 60,
        zIndex: 50,
      }}>
        <Link href={backHref} style={{ color: '#6B7280', textDecoration: 'none', fontSize: 20, lineHeight: 1 }}>←</Link>
        {renderAvatar(36, 16)}
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>{otherParty.name}</div>
          <div style={{ fontSize: 11, color: '#9CA3AF' }}>{otherParty.subtitle}</div>
        </div>
      </div>

      {/* Message area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        maxWidth: 720,
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>불러오는 중...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#6B7280' }}>첫 메시지를 보내보세요!</div>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMine = msg.sender_id === user?.id
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
                <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 6 }}>
                  {!isMine && renderAvatar(32, 13)}
                  <div style={{ maxWidth: '70%' }}>
                    {!isMine && (
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 3, marginLeft: 2 }}>
                        {msg.sender.role === 'admin' || msg.sender.role === 'manager' ? '관리자' : msg.sender.nickname}
                      </div>
                    )}
                    <div style={{
                      background: isMine ? myBubbleColor : '#fff',
                      color: isMine ? '#fff' : '#111827',
                      borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      padding: msg.image_url && !msg.content ? '6px' : '10px 14px',
                      fontSize: 14,
                      lineHeight: 1.5,
                      border: isMine ? 'none' : '1px solid #F0EDE8',
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {msg.image_url && (
                        <a href={msg.image_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginBottom: msg.content ? 8 : 0 }}>
                          <img
                            src={msg.image_url}
                            alt="첨부 이미지"
                            style={{
                              maxWidth: 220,
                              maxHeight: 220,
                              borderRadius: 10,
                              display: 'block',
                              objectFit: 'cover',
                            }}
                          />
                        </a>
                      )}
                      {msg.content && <span>{msg.content}</span>}
                    </div>
                    <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 3, textAlign: isMine ? 'right' : 'left' }}>
                      {new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{ background: '#fff', borderTop: '1px solid #F0EDE8', padding: '12px 16px', position: 'sticky', bottom: 0 }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {/* Image preview above input */}
          {(previewSrc || imageUploading) && (
            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                {previewSrc && (
                  <img
                    src={previewSrc}
                    alt="미리보기"
                    style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid #E5E7EB', display: 'block' }}
                  />
                )}
                {imageUploading && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.45)',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                  }}>
                    업로드 중
                  </div>
                )}
                {!imageUploading && (
                  <button
                    onClick={clearPendingImage}
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: '#374151',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 11,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1,
                      padding: 0,
                    }}
                    aria-label="이미지 제거"
                  >
                    ×
                  </button>
                )}
              </div>
              {pendingImageUrl && !imageUploading && (
                <span style={{ fontSize: 11, color: '#6B7280' }}>이미지 준비 완료</span>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />

            {/* Attach button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={imageUploading}
              style={{
                background: imageUploading ? '#E5E7EB' : '#F3F4F6',
                color: imageUploading ? '#9CA3AF' : '#374151',
                border: '1px solid #E5E7EB',
                borderRadius: 12,
                width: 44,
                height: 44,
                fontSize: imageUploading ? 12 : 18,
                cursor: imageUploading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.15s',
              }}
              title="이미지 첨부"
            >
              {imageUploading ? '...' : '📎'}
            </button>

            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요 (Enter 전송, Shift+Enter 줄바꿈)"
              rows={1}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 12,
                border: '2px solid #E5E7EB',
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'none',
                lineHeight: 1.5,
                maxHeight: 120,
                overflowY: 'auto',
              }}
              onInput={e => {
                const t = e.target as HTMLTextAreaElement
                t.style.height = 'auto'
                t.style.height = Math.min(t.scrollHeight, 120) + 'px'
              }}
            />

            <button
              onClick={sendMessage}
              disabled={!canSend}
              style={{
                background: canSend ? myBubbleColor : '#E5E7EB',
                color: canSend ? '#fff' : '#9CA3AF',
                border: 'none',
                borderRadius: 12,
                width: 44,
                height: 44,
                fontSize: 18,
                cursor: canSend ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.15s',
              }}
            >
              {sending ? '...' : '↑'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
