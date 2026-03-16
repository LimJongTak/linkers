'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { useAuth } from '@/store/auth'

const CATEGORY_ICON: Record<string, string> = {
  '레크리에이션': '🎯', '교육': '📚', '진로': '🔭', '예체능': '🎨', '재능봉사': '🤝',
  '체육': '⚽', '음악': '🎵', '미술': '🎨', '과학': '🔬', '수학': '🧮', '기타': '📦',
}

interface Review {
  id: string
  rating: number
  content: string
  created_at: string
  program: { id: string; title: string; category: string; thumbnail_url: string | null }
  order: { id: string; order_number: string }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '')
}

// 수정 모달
function EditModal({ review, onClose, onSuccess, accessToken }: {
  review: Review
  onClose: () => void
  onSuccess: (id: string, rating: number, content: string) => void
  accessToken: string
}) {
  const [rating, setRating] = useState(review.rating)
  const [hoverRating, setHoverRating] = useState(0)
  const [content, setContent] = useState(review.content)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (content.length < 10) { setError('리뷰는 최소 10자 이상 작성해주세요'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/reviews/${review.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ rating, content }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail ?? data.error ?? '오류가 발생했습니다')
      onSuccess(review.id, rating, content)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '28px 24px 40px', width: '100%', maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: '#111827' }}>리뷰 수정</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9CA3AF' }}>✕</button>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #F3F4F6' }}>
          {review.program.title}
        </div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>별점</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1,2,3,4,5].map(i => (
              <button key={i} onMouseEnter={() => setHoverRating(i)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(i)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 32, color: i <= (hoverRating || rating) ? '#F59E0B' : '#E5E7EB', transition: 'color 0.1s' }}>★</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>리뷰 내용</div>
          <textarea value={content} onChange={e => setContent(e.target.value)}
            style={{ width: '100%', height: 120, padding: '12px 14px', borderRadius: 12, border: '2px solid #E5E7EB', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'none', boxSizing: 'border-box', color: '#111827' }} />
          <div style={{ fontSize: 11, color: content.length >= 10 ? '#10B981' : '#9CA3AF', textAlign: 'right', marginTop: 4 }}>
            {content.length}자 {content.length < 10 ? `(${10 - content.length}자 더 필요)` : '✓'}
          </div>
        </div>
        {error && <div style={{ background: '#FEF2F2', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#991B1B', fontWeight: 700 }}>✕ {error}</div>}
        <button onClick={handleSubmit} disabled={submitting || content.length < 10}
          style={{ width: '100%', background: content.length >= 10 && !submitting ? '#111827' : '#E5E7EB', color: content.length >= 10 && !submitting ? '#fff' : '#9CA3AF', border: 'none', borderRadius: 14, padding: '16px', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
          {submitting ? '저장 중...' : '수정 완료'}
        </button>
      </div>
    </div>
  )
}

export default function MyReviewsPage() {
  const { user, accessToken } = useAuth()
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [editTarget, setEditTarget] = useState<Review | null>(null)

  useEffect(() => { if (!user) router.replace('/login') }, [user, router])

  useEffect(() => {
    if (!accessToken) return
    fetch('/api/reviews/my', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => setReviews(d.reviews ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [accessToken])

  const handleEditSuccess = (id: string, rating: number, content: string) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, rating, content } : r))
  }

  const handleDelete = async (id: string) => {
    if (!accessToken) return
    if (!confirm('리뷰를 삭제하시겠습니까?')) return
    const res = await fetch(`/api/reviews/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (res.ok) setReviews(prev => prev.filter(r => r.id !== id))
  }

  if (!user) return null

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <Header />
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Link href="/my" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: 22 }}>←</Link>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111827' }}>내 리뷰</h1>
          {!loading && <span style={{ fontSize: 13, color: '#9CA3AF', marginLeft: 4 }}>{reviews.length}개</span>}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <div>불러오는 중...</div>
          </div>
        )}

        {!loading && reviews.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9CA3AF' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#374151', marginBottom: 8 }}>아직 작성한 리뷰가 없어요</div>
            <div style={{ fontSize: 14, marginBottom: 24 }}>프로그램 구매 후 리뷰를 남겨보세요</div>
            <Link href="/my/orders" style={{ background: '#111827', color: '#fff', padding: '12px 24px', borderRadius: 12, textDecoration: 'none', fontWeight: 800, fontSize: 14 }}>
              구매 내역 보기
            </Link>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {reviews.map(r => {
            const icon = CATEGORY_ICON[r.program.category] ?? '📦'
            return (
              <div key={r.id} style={{ background: '#fff', borderRadius: 18, padding: 22, border: '1px solid #F0EDE8' }}>
                {/* 프로그램 정보 */}
                <Link href={`/programs/${r.program.id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #F3F4F6' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {r.program.thumbnail_url
                      ? <img src={r.program.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 22 }}>{icon}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.program.title}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>{r.program.category} · {formatDate(r.created_at)}</div>
                  </div>
                </Link>

                {/* 별점 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 10 }}>
                  {[1,2,3,4,5].map(i => (
                    <span key={i} style={{ color: i <= r.rating ? '#F59E0B' : '#E5E7EB', fontSize: 18 }}>★</span>
                  ))}
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#111827', marginLeft: 4 }}>{r.rating}.0</span>
                </div>

                {/* 내용 */}
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, marginBottom: 14 }}>{r.content}</p>

                {/* 수정/삭제 */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button onClick={() => setEditTarget(r)}
                    style={{ background: 'none', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#6B7280' }}>
                    수정
                  </button>
                  <button onClick={() => handleDelete(r.id)}
                    style={{ background: 'none', border: '1.5px solid #FEE2E2', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#EF4444' }}>
                    삭제
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {editTarget && accessToken && (
        <EditModal
          review={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={handleEditSuccess}
          accessToken={accessToken}
        />
      )}
    </div>
  )
}
