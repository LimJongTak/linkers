'use client'

import { useState, useEffect, useRef } from 'react'
import Header from '@/components/layout/Header'
import { useAuth } from '@/store/auth'

const CATEGORIES = ['공지', '업데이트', '이벤트']

const BADGE: Record<string, { bg: string; color: string }> = {
  '공지':     { bg: '#EFF6FF', color: '#1D4ED8' },
  '업데이트': { bg: '#F0FDF4', color: '#15803D' },
  '이벤트':   { bg: '#FFF7ED', color: '#C2410C' },
}

interface Notice {
  id: string
  category: string
  title: string
  content: string
  image_url: string | null
  is_new: boolean
  is_pinned: boolean
  created_at: string
  author: { id: string; nickname: string }
}

const emptyForm = { category: '공지', title: '', content: '', image_url: null as string | null, is_new: false, is_pinned: false }

/* ── 이미지 업로드 포함 공지 폼 ── */
function NoticeForm({
  initial, onSubmit, onCancel, loading, token,
}: {
  initial: typeof emptyForm
  onSubmit: (data: typeof emptyForm) => void
  onCancel: () => void
  loading: boolean
  token: string | null
}) {
  const [form, setForm]           = useState(initial)
  const [imgLoading, setImgLoading] = useState(false)
  const [imgErr, setImgErr]       = useState('')
  const fileRef                   = useRef<HTMLInputElement>(null)

  const set = (k: keyof typeof emptyForm, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleImage = async (file: File) => {
    setImgErr(''); setImgLoading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await fetch('/api/notices/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const d = await res.json()
      if (!res.ok) { setImgErr(d.error ?? '업로드 실패'); return }
      set('image_url', d.imageUrl)
    } finally { setImgLoading(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* 카테고리 */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>카테고리</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {CATEGORIES.map(c => (
            <button key={c} type="button" onClick={() => set('category', c)}
              style={{ padding: '7px 16px', borderRadius: 8, border: `1.5px solid ${form.category === c ? '#111827' : '#E5E7EB'}`, background: form.category === c ? '#111827' : '#fff', color: form.category === c ? '#fff' : '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* 제목 */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>제목</label>
        <input value={form.title} onChange={e => set('title', e.target.value)}
          placeholder="공지 제목을 입력하세요"
          style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
      </div>

      {/* 내용 */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>내용</label>
        <textarea value={form.content} onChange={e => set('content', e.target.value)}
          placeholder="공지 내용을 입력하세요"
          rows={6}
          style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
      </div>

      {/* 이미지 첨부 */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>이미지 첨부 (선택)</label>
        {form.image_url ? (
          <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
            <img src={form.image_url} alt="첨부 이미지" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
            <button type="button" onClick={() => set('image_url', null)}
              style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              ✕ 제거
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleImage(f) }}
            style={{ border: '2px dashed #E5E7EB', borderRadius: 10, padding: '28px 16px', textAlign: 'center', cursor: 'pointer', background: '#FAFAFA', transition: 'border-color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#9CA3AF')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E7EB')}>
            {imgLoading ? (
              <div style={{ color: '#9CA3AF', fontSize: 14 }}>업로드 중...</div>
            ) : (
              <>
                <div style={{ fontSize: 28, marginBottom: 6 }}>🖼️</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#6B7280' }}>클릭하거나 드래그하여 이미지 첨부</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>PNG, JPG, GIF · 최대 5MB</div>
              </>
            )}
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleImage(f); e.target.value = '' }} />
        {imgErr && <div style={{ fontSize: 12, color: '#EF4444', marginTop: 6, fontWeight: 600 }}>✕ {imgErr}</div>}
      </div>

      {/* 옵션 체크박스 */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
          <input type="checkbox" checked={form.is_pinned} onChange={e => set('is_pinned', e.target.checked)}
            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#7C3AED' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>📌 상단 고정</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
          <input type="checkbox" checked={form.is_new} onChange={e => set('is_new', e.target.checked)}
            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#EF4444' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>🆕 NEW 뱃지 표시</span>
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button type="button" onClick={onCancel}
          style={{ flex: 1, padding: '12px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          취소
        </button>
        <button type="button" onClick={() => onSubmit(form)}
          disabled={!form.title.trim() || !form.content.trim() || loading || imgLoading}
          style={{ flex: 2, padding: '12px', background: '#111827', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', opacity: (!form.title.trim() || !form.content.trim() || loading || imgLoading) ? 0.6 : 1 }}>
          {loading ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </div>
  )
}

/* ── 메인 페이지 ── */
export default function NoticesPage() {
  const { user, accessToken } = useAuth()
  const isStaff = user?.role === 'admin' || user?.role === 'manager'

  const [notices, setNotices]       = useState<Notice[]>([])
  const [loading, setLoading]       = useState(true)
  const [open, setOpen]             = useState<string | null>(null)
  const [writeOpen, setWriteOpen]   = useState(false)
  const [editTarget, setEditTarget] = useState<Notice | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError]           = useState('')

  const load = () => {
    setLoading(true)
    fetch('/api/notices')
      .then(r => r.json())
      .then(d => setNotices(d.notices ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (form: typeof emptyForm) => {
    setActionLoading(true); setError('')
    const res = await fetch('/api/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(form),
    })
    setActionLoading(false)
    if (res.ok) { setWriteOpen(false); load() }
    else { const d = await res.json(); setError(d.error ?? '오류 발생') }
  }

  const handleEdit = async (form: typeof emptyForm) => {
    if (!editTarget) return
    setActionLoading(true); setError('')
    const res = await fetch(`/api/notices/${editTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(form),
    })
    setActionLoading(false)
    if (res.ok) { setEditTarget(null); load() }
    else { const d = await res.json(); setError(d.error ?? '오류 발생') }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" 공지를 삭제하시겠습니까?`)) return
    await fetch(`/api/notices/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    load()
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
      .replace(/\. /g, '.').replace(/\.$/, '')

  const pinnedCount = notices.filter(n => n.is_pinned).length

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <style>{`
        @media(max-width:640px){
          .notices-hero{padding:32px 16px!important;}
          .notices-main{padding:20px 16px 60px!important;}
          .notice-btn{padding:16px!important;}
          .notice-content{padding:0 16px 20px!important;}
        }
      `}</style>
      <Header />

      <section className="notices-hero" style={{ background: 'linear-gradient(135deg, #111827, #1F2D45)', padding: '44px 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'rgba(79,195,247,0.15)', color: '#4FC3F7', fontSize: 12, fontWeight: 800, padding: '5px 14px', borderRadius: 20, marginBottom: 14 }}>공지사항</div>
        <h1 style={{ fontSize: 'clamp(22px,4vw,34px)', fontWeight: 900, color: '#fff', marginBottom: 10 }}>링커스 공지사항</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>서비스 업데이트와 이벤트 소식을 확인하세요</p>
      </section>

      <main className="notices-main" style={{ maxWidth: 760, margin: '0 auto', padding: '36px 24px 60px' }}>

        {/* 관리자 글쓰기 버튼 */}
        {isStaff && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button onClick={() => { setWriteOpen(true); setError('') }}
              style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
              ✏️ 공지 작성
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>불러오는 중...</div>
        ) : notices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 700 }}>등록된 공지사항이 없습니다</div>
          </div>
        ) : (
          <>
            {/* 고정 공지 구분선 */}
            {pinnedCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#7C3AED', background: '#EDE9FE', padding: '3px 10px', borderRadius: 6 }}>📌 고정 공지</span>
                <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
              </div>
            )}

            {notices.map((n, idx) => {
              const badge = BADGE[n.category] ?? { bg: '#F3F4F6', color: '#374151' }
              const isOpen = open === n.id
              // 고정 공지와 일반 공지 사이 구분선
              const showDivider = pinnedCount > 0 && idx === pinnedCount

              return (
                <div key={n.id}>
                  {showDivider && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0 8px' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', background: '#F3F4F6', padding: '3px 10px', borderRadius: 6 }}>일반 공지</span>
                      <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
                    </div>
                  )}

                  <div style={{
                    background: '#fff', borderRadius: 16, marginBottom: 8, overflow: 'hidden',
                    border: n.is_pinned ? '1.5px solid #DDD6FE' : '1px solid #F0EDE8',
                    boxShadow: n.is_pinned ? '0 2px 12px rgba(124,58,237,0.07)' : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <button
                        onClick={() => setOpen(isOpen ? null : n.id)}
                        className="notice-btn"
                        style={{ flex: 1, background: 'none', border: 'none', padding: '20px 24px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left' }}>
                        {n.is_pinned && (
                          <span style={{ fontSize: 14, flexShrink: 0 }}>📌</span>
                        )}
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 6, background: badge.bg, color: badge.color, flexShrink: 0 }}>{n.category}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</span>
                            {n.is_new && <span style={{ fontSize: 10, background: '#EF4444', color: '#fff', padding: '2px 6px', borderRadius: 4, fontWeight: 800, flexShrink: 0 }}>NEW</span>}
                            {n.image_url && <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>🖼️</span>}
                          </div>
                          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{formatDate(n.created_at)}</div>
                        </div>
                        <span style={{ fontSize: 18, color: '#9CA3AF', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>⌃</span>
                      </button>

                      {isStaff && (
                        <div style={{ display: 'flex', gap: 6, paddingRight: 16, flexShrink: 0 }}>
                          <button onClick={() => { setEditTarget(n); setError('') }}
                            style={{ fontSize: 12, fontWeight: 700, padding: '5px 10px', borderRadius: 7, border: 'none', background: '#DBEAFE', color: '#1D4ED8', cursor: 'pointer', fontFamily: 'inherit' }}>
                            수정
                          </button>
                          <button onClick={() => handleDelete(n.id, n.title)}
                            style={{ fontSize: 12, fontWeight: 700, padding: '5px 10px', borderRadius: 7, border: 'none', background: '#FEE2E2', color: '#991B1B', cursor: 'pointer', fontFamily: 'inherit' }}>
                            삭제
                          </button>
                        </div>
                      )}
                    </div>

                    {isOpen && (
                      <div className="notice-content" style={{ padding: '0 24px 24px', borderTop: '1px solid #F3F4F6' }}>
                        {n.image_url && (
                          <div style={{ margin: '16px 0 12px', borderRadius: 12, overflow: 'hidden', border: '1px solid #F0EDE8' }}>
                            <img src={n.image_url} alt="공지 이미지" style={{ width: '100%', maxHeight: 360, objectFit: 'cover', display: 'block' }} />
                          </div>
                        )}
                        <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.8, paddingTop: n.image_url ? 0 : 16, whiteSpace: 'pre-wrap' }}>{n.content}</p>
                        <div style={{ marginTop: 14, fontSize: 12, color: '#C0BDB8' }}>작성자: {n.author.nickname}</div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </main>

      {/* 글쓰기 모달 */}
      {writeOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setWriteOpen(false)} />
          <div style={{ position: 'relative', background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#111827', marginBottom: 20 }}>공지 작성</div>
            {error && <div style={{ background: '#FEF2F2', color: '#991B1B', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 600, marginBottom: 14 }}>✕ {error}</div>}
            <NoticeForm initial={emptyForm} onSubmit={handleCreate} onCancel={() => setWriteOpen(false)} loading={actionLoading} token={accessToken} />
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {editTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setEditTarget(null)} />
          <div style={{ position: 'relative', background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#111827', marginBottom: 20 }}>공지 수정</div>
            {error && <div style={{ background: '#FEF2F2', color: '#991B1B', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 600, marginBottom: 14 }}>✕ {error}</div>}
            <NoticeForm
              initial={{ category: editTarget.category, title: editTarget.title, content: editTarget.content, image_url: editTarget.image_url, is_new: editTarget.is_new, is_pinned: editTarget.is_pinned }}
              onSubmit={handleEdit}
              onCancel={() => setEditTarget(null)}
              loading={actionLoading}
              token={accessToken}
            />
          </div>
        </div>
      )}
    </div>
  )
}
