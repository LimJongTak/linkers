'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/store/auth'

interface Message {
  id: string
  content: string
  image_url: string | null
  file_url: string | null
  file_name: string | null
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

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊',
    ppt: '📊', pptx: '📊', zip: '🗜️', rar: '🗜️', txt: '📃', hwp: '📝', csv: '📊',
  }
  return <>{map[ext] ?? '📎'}</>
}

const TYPING_SIGNAL_INTERVAL = 2000 // 타이핑 신호 발송 최소 간격 (ms)
const STATUS_POLL_INTERVAL = 2000   // 상태 폴링 간격 (ms)
const MSG_POLL_INTERVAL = 3000      // 메시지 폴링 간격 (ms)

export default function ChatRoom({ roomId, backHref, myBubbleColor, otherParty }: ChatRoomProps) {
  const { user, accessToken } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isOtherTyping, setIsOtherTyping] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())

  // Image attachment
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  // File attachment
  const [pendingFileUrl, setPendingFileUrl] = useState<string | null>(null)
  const [pendingFileName, setPendingFileName] = useState<string | null>(null)
  const [fileUploading, setFileUploading] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const lastMsgTimeRef = useRef<string | null>(null)
  const attachInputRef = useRef<HTMLInputElement>(null)
  const lastTypingSentRef = useRef<number>(0)

  // Initial load
  useEffect(() => {
    if (!user || !accessToken) return
    const h = { Authorization: `Bearer ${accessToken}` }

    fetch(`/api/chat/rooms/${roomId}/messages`, { headers: h })
      .then(r => r.ok ? r.json() : { messages: [] })
      .then(d => {
        const msgs: Message[] = d.messages ?? []
        setMessages(msgs)
        if (msgs.length > 0) lastMsgTimeRef.current = msgs[msgs.length - 1].created_at
        // 초기 읽음 상태 반영
        const initialRead = new Set(msgs.filter(m => m.sender_id === user.id && m.is_read).map(m => m.id))
        setReadIds(initialRead)
      })
      .finally(() => setLoading(false))

    fetch(`/api/chat/rooms/${roomId}/read`, { method: 'PATCH', headers: h })
  }, [roomId, user, accessToken])

  // 메시지 폴링
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
    }, MSG_POLL_INTERVAL)
    return () => clearInterval(poll)
  }, [roomId, accessToken])

  // 상태 폴링 (타이핑 + 읽음)
  useEffect(() => {
    if (!accessToken || !user) return
    const poll = setInterval(() => {
      fetch(`/api/chat/rooms/${roomId}/status`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (!d) return
          setIsOtherTyping(d.isTyping ?? false)
          if (d.readMessageIds?.length > 0) {
            setReadIds(prev => {
              const next = new Set(prev)
              d.readMessageIds.forEach((id: string) => next.add(id))
              return next
            })
          }
        })
    }, STATUS_POLL_INTERVAL)
    return () => clearInterval(poll)
  }, [roomId, accessToken, user])

  // 타이핑 신호 전송 (디바운스)
  const sendTypingSignal = useCallback(() => {
    const now = Date.now()
    if (now - lastTypingSentRef.current < TYPING_SIGNAL_INTERVAL) return
    lastTypingSentRef.current = now
    fetch(`/api/chat/rooms/${roomId}/typing`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}` },
    }).catch(() => {})
  }, [roomId, accessToken])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOtherTyping])

  const clearPendingImage = useCallback(() => {
    if (previewSrc) URL.revokeObjectURL(previewSrc)
    setPreviewSrc(null); setPendingImageUrl(null); setImageUploading(false)
  }, [previewSrc])

  const clearPendingFile = useCallback(() => {
    setPendingFileUrl(null); setPendingFileName(null); setFileUploading(false)
  }, [])

  const handleAttachSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    if (file.type.startsWith('image/')) {
      if (file.size > 10 * 1024 * 1024) { alert('이미지 파일 크기는 10MB 이하여야 합니다'); return }
      const localPreview = URL.createObjectURL(file)
      setPreviewSrc(localPreview); setImageUploading(true); setPendingImageUrl(null)
      try {
        const form = new FormData(); form.append('image', file)
        const res = await fetch(`/api/chat/rooms/${roomId}/image`, {
          method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body: form,
        })
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? '이미지 업로드에 실패했습니다')
        setPendingImageUrl((await res.json()).imageUrl)
      } catch (err: any) {
        alert(err.message ?? '이미지 업로드에 실패했습니다')
        setPreviewSrc(null); URL.revokeObjectURL(localPreview)
      } finally { setImageUploading(false) }
    } else {
      if (file.size > 20 * 1024 * 1024) { alert('파일 크기는 20MB 이하여야 합니다'); return }
      setFileUploading(true); setPendingFileName(file.name); setPendingFileUrl(null)
      try {
        const form = new FormData(); form.append('file', file)
        const res = await fetch(`/api/chat/rooms/${roomId}/file`, {
          method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body: form,
        })
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? '파일 업로드에 실패했습니다')
        const { fileUrl, fileName } = await res.json()
        setPendingFileUrl(fileUrl); setPendingFileName(fileName)
      } catch (err: any) {
        alert(err.message ?? '파일 업로드에 실패했습니다'); setPendingFileName(null)
      } finally { setFileUploading(false) }
    }
  }, [roomId, accessToken])

  const sendMessage = useCallback(async () => {
    const hasText = !!input.trim()
    const hasImage = !!pendingImageUrl
    const hasFile = !!pendingFileUrl
    const up = imageUploading || fileUploading
    if ((!hasText && !hasImage && !hasFile) || sending || up) return

    setSending(true)
    try {
      const body: Record<string, string> = {}
      if (hasText) body.content = input.trim()
      if (hasImage) body.imageUrl = pendingImageUrl!
      if (hasFile) { body.fileUrl = pendingFileUrl!; body.fileName = pendingFileName! }

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
        clearPendingFile()
      }
    } finally {
      setSending(false)
    }
  }, [roomId, input, sending, imageUploading, fileUploading, pendingImageUrl, pendingFileUrl, pendingFileName, accessToken, clearPendingImage, clearPendingFile])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const uploading = imageUploading || fileUploading
  const canSend = (!!input.trim() || !!pendingImageUrl || !!pendingFileUrl) && !sending && !uploading

  const renderAvatar = (size: number, fontSize: number) => (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: otherParty.avatarBg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize, color: '#fff', fontWeight: 900, overflow: 'hidden', flexShrink: 0,
    }}>
      {otherParty.avatarEmoji ? otherParty.avatarEmoji
        : otherParty.image ? (
          <img src={otherParty.image} alt={otherParty.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
        ) : otherParty.name[0]}
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes _chatDotBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        ._chatDot {
          width: 8px; height: 8px; border-radius: 50%; background: #9CA3AF; display: inline-block;
          animation: _chatDotBounce 1.3s ease-in-out infinite;
        }
        ._chatDot:nth-child(2) { animation-delay: 0.18s; }
        ._chatDot:nth-child(3) { animation-delay: 0.36s; }
      `}</style>

      {/* Header */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #F0EDE8', padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 60, zIndex: 50,
      }}>
        <Link href={backHref} style={{ color: '#6B7280', textDecoration: 'none', fontSize: 20, lineHeight: 1 }}>←</Link>
        {renderAvatar(36, 16)}
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>{otherParty.name}</div>
          <div style={{ fontSize: 11, color: '#9CA3AF' }}>{otherParty.subtitle}</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '20px 16px',
        display: 'flex', flexDirection: 'column', gap: 12,
        maxWidth: 720, width: '100%', margin: '0 auto', boxSizing: 'border-box',
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
            const isRead = isMine && (readIds.has(msg.id) || msg.is_read)
            const showDate = i === 0 ||
              new Date(messages[i - 1].created_at).toDateString() !== new Date(msg.created_at).toDateString()

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
                      padding: (msg.image_url || msg.file_url) && !msg.content ? '6px' : '10px 14px',
                      fontSize: 14, lineHeight: 1.5,
                      border: isMine ? 'none' : '1px solid #F0EDE8',
                      wordBreak: 'break-word', whiteSpace: 'pre-wrap',
                    }}>
                      {msg.image_url && (
                        <a href={msg.image_url} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'block', marginBottom: msg.content ? 8 : 0 }}>
                          <img src={msg.image_url} alt="첨부 이미지"
                            style={{ maxWidth: 220, maxHeight: 220, borderRadius: 10, display: 'block', objectFit: 'cover' }} />
                        </a>
                      )}
                      {msg.file_url && (
                        <a href={msg.file_url} target="_blank" rel="noopener noreferrer" download={msg.file_name ?? true}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: isMine ? 'rgba(255,255,255,0.15)' : '#F3F4F6',
                            borderRadius: 10, padding: '8px 12px',
                            color: isMine ? '#fff' : '#374151', textDecoration: 'none',
                            fontSize: 13, marginBottom: msg.content ? 8 : 0, maxWidth: 220,
                          }}>
                          <span style={{ fontSize: 18, flexShrink: 0 }}><FileIcon name={msg.file_name ?? ''} /></span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {msg.file_name ?? '파일 다운로드'}
                          </span>
                        </a>
                      )}
                      {msg.content && <span>{msg.content}</span>}
                    </div>

                    {/* 시간 + 읽음 표시 */}
                    <div style={{
                      fontSize: 10, color: '#9CA3AF', marginTop: 3,
                      display: 'flex', alignItems: 'center', gap: 4,
                      justifyContent: isMine ? 'flex-end' : 'flex-start',
                    }}>
                      {isMine && !isRead && (
                        <span style={{ color: '#F59E0B', fontWeight: 700, fontSize: 11 }}>1</span>
                      )}
                      {isMine && isRead && (
                        <span style={{ color: '#9CA3AF' }}>읽음</span>
                      )}
                      <span>{new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}

        {/* 타이핑 인디케이터 */}
        {isOtherTyping && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
            {renderAvatar(32, 13)}
            <div style={{
              background: '#fff', border: '1px solid #F0EDE8',
              borderRadius: '18px 18px 18px 4px',
              padding: '12px 16px',
              display: 'flex', gap: 5, alignItems: 'center',
            }}>
              <span className="_chatDot" />
              <span className="_chatDot" />
              <span className="_chatDot" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{ background: '#fff', borderTop: '1px solid #F0EDE8', padding: '12px 16px', position: 'sticky', bottom: 0 }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {/* Image preview */}
          {(previewSrc || imageUploading) && (
            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                {previewSrc && (
                  <img src={previewSrc} alt="미리보기"
                    style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid #E5E7EB', display: 'block' }} />
                )}
                {imageUploading && (
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700,
                  }}>업로드 중</div>
                )}
                {!imageUploading && (
                  <button onClick={clearPendingImage} aria-label="이미지 제거" style={{
                    position: 'absolute', top: -6, right: -6, width: 18, height: 18,
                    borderRadius: '50%', background: '#374151', color: '#fff', border: 'none',
                    cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                  }}>×</button>
                )}
              </div>
              {pendingImageUrl && !imageUploading && (
                <span style={{ fontSize: 11, color: '#6B7280' }}>이미지 준비 완료</span>
              )}
            </div>
          )}

          {/* File preview */}
          {(pendingFileName && !previewSrc) && (
            <div style={{ marginBottom: 8 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#F3F4F6', borderRadius: 10, padding: '6px 10px',
                fontSize: 13, color: '#374151', maxWidth: 260,
              }}>
                <span style={{ fontSize: 18 }}><FileIcon name={pendingFileName} /></span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{pendingFileName}</span>
                {fileUploading && <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>업로드 중...</span>}
                {!fileUploading && (
                  <button onClick={clearPendingFile} aria-label="파일 제거" style={{
                    background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 16, padding: 0, lineHeight: 1,
                  }}>×</button>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <input ref={attachInputRef} type="file" style={{ display: 'none' }} onChange={handleAttachSelect} />

            <button
              onClick={() => attachInputRef.current?.click()}
              disabled={uploading}
              title="파일/이미지 첨부"
              style={{
                background: uploading ? '#E5E7EB' : '#F3F4F6',
                color: uploading ? '#9CA3AF' : '#374151',
                border: '1px solid #E5E7EB', borderRadius: 12,
                width: 44, height: 44, fontSize: uploading ? 12 : 18,
                cursor: uploading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'background 0.15s',
              }}
            >
              {uploading ? '...' : '📎'}
            </button>

            <textarea
              value={input}
              onChange={e => { setInput(e.target.value); sendTypingSignal() }}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요 (Enter 전송, Shift+Enter 줄바꿈)"
              rows={1}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 12,
                border: '2px solid #E5E7EB', fontSize: 14, fontFamily: 'inherit',
                outline: 'none', resize: 'none', lineHeight: 1.5,
                maxHeight: 120, overflowY: 'auto',
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
                border: 'none', borderRadius: 12, width: 44, height: 44, fontSize: 18,
                cursor: canSend ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'background 0.15s',
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
