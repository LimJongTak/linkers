'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/store/auth'
import { usePathname } from 'next/navigation'

interface Message {
  id: string
  content: string
  image_url: string | null
  file_url: string | null
  file_name: string | null
  sender_id: string
  created_at: string
  sender: { id: string; nickname: string; profile_image: string | null; role: string }
}

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊',
    ppt: '📊', pptx: '📊', zip: '🗜️', rar: '🗜️', txt: '📃', hwp: '📝', csv: '📊',
  }
  return <>{map[ext] ?? '📎'}</>
}

const BUBBLE = 'linear-gradient(135deg,#7C3AED,#4F46E5)'

export default function AdminChatWidget() {
  const { user, accessToken } = useAuth()
  const pathname = usePathname()

  const [isOpen, setIsOpen] = useState(false)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [unread, setUnread] = useState(0)

  // Attachment
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [pendingFileUrl, setPendingFileUrl] = useState<string | null>(null)
  const [pendingFileName, setPendingFileName] = useState<string | null>(null)
  const [fileUploading, setFileUploading] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const lastMsgRef = useRef<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const attachRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Decide whether to show at all
  const hide =
    !user ||
    user.role === 'admin' ||
    user.role === 'manager' ||
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/my/chat/') ||
    pathname?.startsWith('/seller/chat/')

  // On mount: check for existing admin room + unread count
  useEffect(() => {
    if (hide || !accessToken) return
    fetch('/api/chat/rooms', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.ok ? r.json() : { rooms: [] })
      .then(d => {
        const room = (d.rooms ?? []).find((r: any) => r.type === 'admin')
        if (room) { setRoomId(room.id); setUnread(room.unreadCount ?? 0) }
      })
  }, [hide, accessToken])

  // Load messages for a room
  const loadMessages = useCallback(async (id: string) => {
    if (!accessToken) return
    setLoading(true)
    try {
      const d = await fetch(`/api/chat/rooms/${id}/messages`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then(r => r.ok ? r.json() : { messages: [] })
      const msgs: Message[] = d.messages ?? []
      setMessages(msgs)
      if (msgs.length > 0) lastMsgRef.current = msgs[msgs.length - 1].created_at
      setUnread(0)
      fetch(`/api/chat/rooms/${id}/read`, { method: 'PATCH', headers: { Authorization: `Bearer ${accessToken}` } })
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  // Open button click
  const handleOpen = useCallback(async () => {
    if (!user || !accessToken) return
    if (isOpen) { setIsOpen(false); return }

    let id = roomId
    if (!id) {
      setCreating(true)
      try {
        const res = await fetch('/api/chat/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ type: 'admin' }),
        })
        const data = await res.json()
        id = data.room?.id ?? null
        if (id) setRoomId(id)
      } finally {
        setCreating(false)
      }
    }
    if (id) await loadMessages(id)
    setIsOpen(true)
  }, [user, accessToken, isOpen, roomId, loadMessages])

  // Polling
  useEffect(() => {
    if (!isOpen || !roomId || !accessToken) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      return
    }
    pollRef.current = setInterval(() => {
      const since = lastMsgRef.current
      const url = since
        ? `/api/chat/rooms/${roomId}/messages?since=${encodeURIComponent(since)}`
        : `/api/chat/rooms/${roomId}/messages`
      fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
        .then(r => r.ok ? r.json() : { messages: [] })
        .then(d => {
          const newMsgs: Message[] = d.messages ?? []
          if (newMsgs.length > 0) {
            setMessages(prev => {
              const ids = new Set(prev.map(m => m.id))
              const toAdd = newMsgs.filter(m => !ids.has(m.id))
              return toAdd.length > 0 ? [...prev, ...toAdd] : prev
            })
            lastMsgRef.current = newMsgs[newMsgs.length - 1].created_at
            fetch(`/api/chat/rooms/${roomId}/read`, {
              method: 'PATCH', headers: { Authorization: `Bearer ${accessToken}` },
            })
          }
        })
    }, 3000)
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null } }
  }, [isOpen, roomId, accessToken])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Attachment handlers
  const clearImage = useCallback(() => {
    if (previewSrc) URL.revokeObjectURL(previewSrc)
    setPreviewSrc(null); setPendingImageUrl(null); setImageUploading(false)
  }, [previewSrc])

  const clearFile = useCallback(() => {
    setPendingFileUrl(null); setPendingFileName(null); setFileUploading(false)
  }, [])

  const handleAttach = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !roomId) return
    e.target.value = ''

    if (file.type.startsWith('image/')) {
      if (file.size > 10 * 1024 * 1024) { alert('이미지는 10MB 이하여야 합니다'); return }
      const local = URL.createObjectURL(file)
      setPreviewSrc(local); setImageUploading(true); setPendingImageUrl(null)
      try {
        const form = new FormData(); form.append('image', file)
        const res = await fetch(`/api/chat/rooms/${roomId}/image`, {
          method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body: form,
        })
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? '업로드 실패')
        setPendingImageUrl((await res.json()).imageUrl)
      } catch (err: any) {
        alert(err.message); setPreviewSrc(null); URL.revokeObjectURL(local)
      } finally { setImageUploading(false) }
    } else {
      if (file.size > 20 * 1024 * 1024) { alert('파일은 20MB 이하여야 합니다'); return }
      setFileUploading(true); setPendingFileName(file.name); setPendingFileUrl(null)
      try {
        const form = new FormData(); form.append('file', file)
        const res = await fetch(`/api/chat/rooms/${roomId}/file`, {
          method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body: form,
        })
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? '업로드 실패')
        const { fileUrl, fileName } = await res.json()
        setPendingFileUrl(fileUrl); setPendingFileName(fileName)
      } catch (err: any) {
        alert(err.message); setPendingFileName(null)
      } finally { setFileUploading(false) }
    }
  }, [roomId, accessToken])

  const sendMessage = useCallback(async () => {
    const hasText = !!input.trim()
    const hasImage = !!pendingImageUrl
    const hasFile = !!pendingFileUrl
    const up = imageUploading || fileUploading
    if ((!hasText && !hasImage && !hasFile) || sending || up || !roomId) return

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
        lastMsgRef.current = message.created_at
        setInput('')
        clearImage()
        clearFile()
        if (textareaRef.current) { textareaRef.current.style.height = 'auto' }
      }
    } finally { setSending(false) }
  }, [roomId, input, sending, imageUploading, fileUploading, pendingImageUrl, pendingFileUrl, pendingFileName, accessToken, clearImage, clearFile])

  const uploading = imageUploading || fileUploading
  const canSend = (!!input.trim() || !!pendingImageUrl || !!pendingFileUrl) && !sending && !uploading

  if (hide) return null

  return (
    <>
      {/* Floating button */}
      <button
        onClick={handleOpen}
        disabled={creating}
        title="고객지원 채팅"
        style={{
          position: 'fixed', bottom: 24, right: 24,
          width: 56, height: 56, borderRadius: '50%',
          background: creating ? '#9CA3AF' : BUBBLE,
          color: '#fff', border: 'none',
          cursor: creating ? 'not-allowed' : 'pointer',
          fontSize: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
          zIndex: 9000,
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
      >
        {creating ? '...' : isOpen ? '✕' : '💬'}
        {!isOpen && unread > 0 && (
          <div style={{
            position: 'absolute', top: -4, right: -4,
            background: '#EF4444', color: '#fff', borderRadius: '50%',
            width: 20, height: 20, fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            {unread > 9 ? '9+' : unread}
          </div>
        )}
      </button>

      {/* Popup */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: 92, right: 16,
          width: 'min(360px, calc(100vw - 32px))',
          height: 'min(500px, calc(100vh - 120px))',
          background: '#fff', borderRadius: 20,
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          zIndex: 8999,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: "'Pretendard Variable', sans-serif",
        }}>
          {/* Header */}
          <div style={{
            background: BUBBLE, color: '#fff',
            padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
            flexShrink: 0,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#111827', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <img src="/icon.svg" alt="링커스" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>링커스 고객지원</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>관리자가 곧 답변드립니다</div>
            </div>
            {roomId && (
              <Link href={`/my/chat/${roomId}`} onClick={() => setIsOpen(false)}
                style={{ color: '#fff', opacity: 0.75, fontSize: 11, textDecoration: 'none',
                  background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '3px 8px' }}>
                전체화면
              </Link>
            )}
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '12px 14px',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            {loading ? (
              <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: '20px 0' }}>불러오는 중...</div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 16px' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>👋</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 4 }}>안녕하세요!</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>무엇을 도와드릴까요?<br />메시지를 남겨주시면 빠르게 답변드릴게요.</div>
              </div>
            ) : (
              messages.map(msg => {
                const isMine = msg.sender_id === user?.id
                const isAdmin = msg.sender.role === 'admin' || msg.sender.role === 'manager'
                return (
                  <div key={msg.id} style={{
                    display: 'flex',
                    justifyContent: isMine ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-end', gap: 6,
                  }}>
                    {!isMine && (
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: BUBBLE,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', flexShrink: 0,
                      }}>
                        <img src="/icon.svg" alt="링커스" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                    )}
                    <div style={{ maxWidth: '78%' }}>
                      {!isMine && (
                        <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2, marginLeft: 2 }}>
                          {isAdmin ? '관리자' : msg.sender.nickname}
                        </div>
                      )}
                      <div style={{
                        background: isMine ? '#7C3AED' : '#F3F4F6',
                        color: isMine ? '#fff' : '#111827',
                        borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                        padding: (msg.image_url || msg.file_url) && !msg.content ? '4px' : '8px 12px',
                        fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-wrap',
                      }}>
                        {msg.image_url && (
                          <a href={msg.image_url} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'block', marginBottom: msg.content ? 6 : 0 }}>
                            <img src={msg.image_url} alt="첨부 이미지"
                              style={{ maxWidth: 180, maxHeight: 180, borderRadius: 8, display: 'block', objectFit: 'cover' }} />
                          </a>
                        )}
                        {msg.file_url && (
                          <a href={msg.file_url} target="_blank" rel="noopener noreferrer" download={msg.file_name ?? true}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              background: isMine ? 'rgba(255,255,255,0.15)' : '#E5E7EB',
                              borderRadius: 8, padding: '6px 10px',
                              color: isMine ? '#fff' : '#374151', textDecoration: 'none', fontSize: 12,
                              marginBottom: msg.content ? 6 : 0, maxWidth: 180,
                            }}>
                            <span style={{ fontSize: 16, flexShrink: 0 }}><FileIcon name={msg.file_name ?? ''} /></span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {msg.file_name ?? '파일'}
                            </span>
                          </a>
                        )}
                        {msg.content && <span>{msg.content}</span>}
                      </div>
                      <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 2, textAlign: isMine ? 'right' : 'left' }}>
                        {new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ borderTop: '1px solid #F0EDE8', padding: '8px 10px', flexShrink: 0 }}>
            {/* Image preview */}
            {(previewSrc || imageUploading) && (
              <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  {previewSrc && <img src={previewSrc} alt="미리보기" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, border: '1px solid #E5E7EB', display: 'block' }} />}
                  {imageUploading && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10 }}>업로드</div>
                  )}
                  {!imageUploading && (
                    <button onClick={clearImage} style={{ position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: '50%', background: '#374151', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>×</button>
                  )}
                </div>
              </div>
            )}
            {/* File preview */}
            {pendingFileName && !previewSrc && (
              <div style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F3F4F6', borderRadius: 8, padding: '4px 8px', fontSize: 12, color: '#374151', maxWidth: '100%' }}>
                  <span style={{ fontSize: 14 }}><FileIcon name={pendingFileName} /></span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{pendingFileName}</span>
                  {fileUploading && <span style={{ color: '#9CA3AF', flexShrink: 0 }}>업로드 중...</span>}
                  {!fileUploading && <button onClick={clearFile} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 14, padding: 0, flexShrink: 0 }}>×</button>}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
              <input ref={attachRef} type="file" style={{ display: 'none' }} onChange={handleAttach} />
              <button onClick={() => attachRef.current?.click()} disabled={uploading} title="파일/이미지 첨부"
                style={{ background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 10, width: 36, height: 36, fontSize: 16, cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {uploading ? '...' : '📎'}
              </button>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="메시지 입력..."
                rows={1}
                style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '2px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.4, maxHeight: 80, overflowY: 'auto' }}
                onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 80) + 'px' }}
              />
              <button onClick={sendMessage} disabled={!canSend}
                style={{ background: canSend ? '#7C3AED' : '#E5E7EB', color: canSend ? '#fff' : '#9CA3AF', border: 'none', borderRadius: 10, width: 36, height: 36, fontSize: 16, cursor: canSend ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}>
                {sending ? '...' : '↑'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
