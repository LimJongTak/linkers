'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { useAuth } from '@/store/auth'

interface Reply {
  id: string
  content: string
  created_at: string
  author: { id: string; nickname: string; role: string }
}

interface InquiryDetail {
  id: string
  title: string
  content: string
  target_type: 'seller' | 'admin'
  status: 'open' | 'answered' | 'closed'
  created_at: string
  user: { id: string; nickname: string }
  program: { id: string; title: string; seller_id: string } | null
  replies: Reply[]
}

const roleLabel = (r: string) => r === 'admin' ? '관리자' : r === 'manager' ? '매니저' : r === 'seller' ? '판매자' : '구매자'
const roleBadgeColor = (r: string) => r === 'admin' || r === 'manager' ? '#7C3AED' : r === 'seller' ? '#0369A1' : '#374151'

export default function InquiryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, accessToken } = useAuth()
  const router = useRouter()
  const [inquiry, setInquiry] = useState<InquiryDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyError, setReplyError] = useState('')

  useEffect(() => {
    if (!user) { router.replace('/login'); return }
    fetch(`/api/inquiries/${id}`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => setInquiry(d?.inquiry ?? null))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id, user, accessToken, router])

  const canReply = user && inquiry && inquiry.status !== 'closed' && (
    user.role === 'admin' || user.role === 'manager' ||
    inquiry.user.id === user.id ||
    (user.role === 'seller' && inquiry.program?.seller_id === user.id)
  )

  const handleReply = async () => {
    if (!replyContent.trim()) return
    setSubmitting(true); setReplyError('')
    try {
      const res = await fetch(`/api/inquiries/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ content: replyContent.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setReplyError(data.error ?? '답변 실패'); return }
      setInquiry(prev => prev ? { ...prev, replies: [...prev.replies, data.reply], status: 'answered' } : prev)
      setReplyContent('')
    } catch { setReplyError('네트워크 오류') }
    finally { setSubmitting(false) }
  }

  if (!user) return null

  return (
    <div style={{ fontFamily: "'Pretendard Variable', sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <Header />
      <main style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Link href="/my/inquiries" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: 22 }}>←</Link>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: '#111827', margin: 0 }}>문의 상세</h1>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>불러오는 중...</div>
        ) : !inquiry ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>😢</div>
            <div style={{ fontSize: 15, color: '#6B7280' }}>문의를 찾을 수 없습니다</div>
          </div>
        ) : (
          <>
            {/* 문의 원문 */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #F0EDE8', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#111827', marginBottom: 6 }}>{inquiry.title}</div>
                  <div style={{ display: 'flex', gap: 10, fontSize: 12, color: '#9CA3AF' }}>
                    <span>{inquiry.user.nickname}</span>
                    <span>{inquiry.target_type === 'admin' ? '⚙️ 관리자 문의' : '🛍 판매자 문의'}</span>
                    {inquiry.program && (
                      <Link href={`/programs/${inquiry.program.id}`} style={{ color: '#4F46E5', fontWeight: 700, textDecoration: 'none' }}>
                        📎 {inquiry.program.title}
                      </Link>
                    )}
                    <span>{new Date(inquiry.created_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 8, background: inquiry.status === 'answered' ? '#D1FAE5' : inquiry.status === 'closed' ? '#F3F4F6' : '#FEF3C7', color: inquiry.status === 'answered' ? '#065F46' : inquiry.status === 'closed' ? '#6B7280' : '#92400E', flexShrink: 0, marginLeft: 12 }}>
                  {inquiry.status === 'answered' ? '답변 완료' : inquiry.status === 'closed' ? '종료' : '답변 대기'}
                </span>
              </div>
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}>{inquiry.content}</p>
            </div>

            {/* 답변 목록 */}
            {inquiry.replies.map(r => {
              const isAuthor = r.author.id === inquiry.user.id
              return (
                <div key={r.id} style={{ background: isAuthor ? '#F9FAFB' : 'linear-gradient(135deg, #EDE9FE, #F3F0FF)', borderRadius: 14, padding: '18px 20px', marginBottom: 10, border: isAuthor ? '1px solid #F0EDE8' : '2px solid #C4B5FD', marginLeft: isAuthor ? 0 : 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: isAuthor ? '#E5E7EB' : 'linear-gradient(135deg, #7C3AED, #4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: isAuthor ? '#374151' : '#fff' }}>
                        {r.author.nickname[0]}
                      </div>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>{r.author.nickname}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, marginLeft: 6, color: roleBadgeColor(r.author.role) }}>({roleLabel(r.author.role)})</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(r.created_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}>{r.content}</p>
                </div>
              )
            })}

            {inquiry.replies.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#9CA3AF', fontSize: 13 }}>아직 답변이 없습니다</div>
            )}

            {/* 답변 작성 (권한자만) */}
            {canReply && (
              <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '2px solid #C4B5FD', marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#5B21B6', marginBottom: 12 }}>💬 답변 작성</div>
                <textarea value={replyContent} onChange={e => setReplyContent(e.target.value)}
                  placeholder="답변 내용을 입력하세요" rows={4}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '2px solid #E5E7EB', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 12 }} />
                {replyError && <div style={{ color: '#EF4444', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>✕ {replyError}</div>}
                <button onClick={handleReply} disabled={submitting || !replyContent.trim()}
                  style={{ background: !replyContent.trim() ? '#E5E7EB' : '#5B21B6', color: !replyContent.trim() ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 800, cursor: !replyContent.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {submitting ? '제출 중...' : '답변 등록'}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
