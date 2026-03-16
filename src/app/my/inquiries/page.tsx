'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { useAuth } from '@/store/auth'

interface Inquiry {
  id: string
  title: string
  content: string
  target_type: 'seller' | 'admin'
  status: 'open' | 'answered' | 'closed'
  created_at: string
  user: { id: string; nickname: string }
  program: { id: string; title: string } | null
  replies?: { id: string }[]
}

const statusLabel = (s: string) => s === 'answered' ? '답변 완료' : s === 'closed' ? '종료' : '답변 대기'
const statusBg = (s: string) => s === 'answered' ? '#D1FAE5' : s === 'closed' ? '#F3F4F6' : '#FEF3C7'
const statusColor = (s: string) => s === 'answered' ? '#065F46' : s === 'closed' ? '#6B7280' : '#92400E'

export default function InquiriesPage() {
  const { user, accessToken } = useAuth()
  const router = useRouter()

  // 1:1 관리자 문의
  const [myInquiries, setMyInquiries] = useState<Inquiry[]>([])
  // 판매자 / 관리자가 받은 프로그램 문의
  const [receivedInquiries, setReceivedInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)

  const [tab, setTab] = useState<'my' | 'received'>('my')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', content: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitDone, setSubmitDone] = useState(false)

  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager'
  const isSeller = user?.role === 'seller'
  const canReceive = isAdminOrManager || isSeller

  useEffect(() => {
    if (!user) { router.replace('/login'); return }
    const h = { Authorization: `Bearer ${accessToken}` }

    const fetches: Promise<void>[] = [
      // 내 1:1 문의 (모든 역할 — 관리자는 received 탭)
      fetch('/api/inquiries?type=admin&target=sent', { headers: h })
        .then(r => r.ok ? r.json() : { inquiries: [] })
        .then(d => setMyInquiries(d.inquiries ?? [])),
    ]

    if (canReceive) {
      const type = isAdminOrManager ? 'admin' : 'seller'
      fetches.push(
        fetch(`/api/inquiries?type=${type}&target=received`, { headers: h })
          .then(r => r.ok ? r.json() : { inquiries: [] })
          .then(d => setReceivedInquiries(d.inquiries ?? []))
      )
    }

    Promise.all(fetches).finally(() => setLoading(false))
  }, [user, accessToken, router, canReceive, isAdminOrManager])

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ targetType: 'admin', title: form.title, content: form.content }),
      })
      const data = await res.json()
      if (res.ok) {
        setMyInquiries(prev => [data.inquiry, ...prev])
        setShowForm(false)
        setSubmitDone(true)
        setForm({ title: '', content: '' })
        setTimeout(() => setSubmitDone(false), 3000)
      }
    } finally { setSubmitting(false) }
  }

  if (!user) return null

  const displayList = tab === 'my' ? myInquiries : receivedInquiries
  const openCount = receivedInquiries.filter(i => i.status === 'open').length

  return (
    <div style={{ fontFamily: "'Pretendard Variable', sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <Header />
      <main style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/my" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: 22 }}>←</Link>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: '#111827', margin: 0 }}>1:1 문의</h1>
          </div>
          {tab === 'my' && (
            <button onClick={() => { setShowForm(v => !v); setSubmitDone(false) }}
              style={{ background: showForm ? '#F3F4F6' : '#111827', color: showForm ? '#374151' : '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
              {showForm ? '취소' : '+ 문의하기'}
            </button>
          )}
        </div>
        <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 20, paddingLeft: 34 }}>
          관리자에게 1:1로 문의합니다. 판매자 문의는 프로그램 상세 페이지 "문의하기"를 이용하세요.
        </p>

        {/* 탭 */}
        {canReceive && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#fff', borderRadius: 12, padding: 4, border: '1px solid #F0EDE8' }}>
            <button onClick={() => setTab('my')}
              style={{ flex: 1, padding: '10px', borderRadius: 9, border: 'none', background: tab === 'my' ? '#111827' : 'transparent', color: tab === 'my' ? '#fff' : '#6B7280', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
              내 문의 ({myInquiries.length})
            </button>
            <button onClick={() => setTab('received')} style={{ position: 'relative', flex: 1, padding: '10px', borderRadius: 9, border: 'none', background: tab === 'received' ? '#111827' : 'transparent', color: tab === 'received' ? '#fff' : '#6B7280', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
              받은 문의 ({receivedInquiries.length})
              {openCount > 0 && (
                <span style={{ position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: '50%', background: tab === 'received' ? '#F87171' : '#EF4444' }} />
              )}
            </button>
          </div>
        )}

        {/* 문의 작성 폼 */}
        {tab === 'my' && showForm && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '2px solid #111827', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>🔒</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#111827' }}>관리자에게 1:1 문의</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>문의 내용은 본인과 관리자만 확인할 수 있습니다</div>
              </div>
            </div>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="문의 제목을 입력하세요" maxLength={100}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '2px solid #E5E7EB', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="문의 내용을 자세히 적어주세요" rows={5}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '2px solid #E5E7EB', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 14 }} />
            <button onClick={handleSubmit} disabled={submitting || !form.title.trim() || !form.content.trim()}
              style={{ width: '100%', background: !form.title.trim() || !form.content.trim() ? '#E5E7EB' : '#111827', color: !form.title.trim() || !form.content.trim() ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 800, cursor: !form.title.trim() || !form.content.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {submitting ? '제출 중...' : '문의 제출'}
            </button>
          </div>
        )}

        {/* 제출 완료 알림 */}
        {submitDone && (
          <div style={{ background: '#D1FAE5', color: '#065F46', borderRadius: 12, padding: '12px 16px', fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
            ✓ 문의가 접수되었습니다. 관리자가 검토 후 답변 드립니다.
          </div>
        )}

        {/* FAQ 링크 */}
        {tab === 'my' && !showForm && (
          <Link href="/faq" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 12, padding: '14px 18px', marginBottom: 20, textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>📋</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0369A1' }}>자주 묻는 질문(FAQ)</div>
                <div style={{ fontSize: 11, color: '#0284C7' }}>문의 전에 FAQ를 먼저 확인해보세요</div>
              </div>
            </div>
            <span style={{ fontSize: 16, color: '#0369A1' }}>→</span>
          </Link>
        )}

        {/* 목록 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>불러오는 중...</div>
        ) : displayList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{tab === 'my' ? '💬' : '📭'}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#6B7280' }}>
              {tab === 'my' ? '아직 보낸 문의가 없어요' : '받은 문의가 없어요'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {displayList.map(inq => (
              <Link key={inq.id} href={`/my/inquiries/${inq.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', border: `1px solid ${inq.status === 'open' && tab === 'received' ? '#FCD34D' : '#F0EDE8'}`, transition: 'box-shadow 0.15s', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                      {inq.status === 'open' && tab === 'received' && (
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
                      )}
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inq.title}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: statusBg(inq.status), color: statusColor(inq.status), flexShrink: 0, marginLeft: 10 }}>
                      {statusLabel(inq.status)}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {tab === 'received' && <span style={{ fontWeight: 700, color: '#6B7280' }}>{inq.user.nickname}</span>}
                    {inq.program && <span>📎 {inq.program.title}</span>}
                    {tab === 'my' && <span style={{ color: '#111827', fontWeight: 700 }}>🔒 관리자 전용</span>}
                    <span>{new Date(inq.created_at).toLocaleDateString('ko-KR')}</span>
                    {(inq.replies?.length ?? 0) > 0 && (
                      <span style={{ color: '#4F46E5', fontWeight: 700 }}>💬 {inq.replies!.length}개 답변</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
