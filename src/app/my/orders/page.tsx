'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { useAuth } from '@/store/auth'

const STATUS_LABEL: Record<string, { label: string; bg: string; color: string }> = {
  confirmed: { label: '진행완료', bg: '#D1FAE5', color: '#065F46' },
  paid:      { label: '결제완료', bg: '#DBEAFE', color: '#1E40AF' },
  pending:   { label: '대기중',   bg: '#FEF3C7', color: '#92400E' },
  refunded:  { label: '환불완료', bg: '#FEE2E2', color: '#991B1B' },
}

const CATEGORY_ICON: Record<string, string> = {
  '레크리에이션': '🎯', '교육': '📚', '진로': '🔭', '예체능': '🎨', '재능봉사': '🤝',
  '체육': '⚽', '음악': '🎵', '미술': '🎨', '과학': '🔬', '수학': '🧮', '기타': '📦',
}

interface Order {
  id: string
  order_number: string
  created_at: string
  amount: number
  point_amount: number
  status: string
  scheduled_at: string | null
  program: { id: string; title: string; category: string; thumbnail_url: string | null }
  permissions: { id: string }[]
  review: { id: string; rating: number } | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '')
}

// 리뷰 작성 모달
function ReviewModal({ order, onClose, onSuccess, accessToken }: {
  order: Order
  onClose: () => void
  onSuccess: (orderId: string, reviewId: string, rating: number) => void
  accessToken: string
}) {
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (content.length < 10) { setError('리뷰는 최소 10자 이상 작성해주세요'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ orderId: order.id, rating, content }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail ?? data.error ?? '오류가 발생했습니다')
      onSuccess(order.id, data.review.id, rating)
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
          <h2 style={{ fontSize: 18, fontWeight: 900, color: '#111827' }}>리뷰 작성</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9CA3AF' }}>✕</button>
        </div>

        <div style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #F3F4F6' }}>
          {order.program.title}
        </div>

        {/* 별점 */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>별점</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1,2,3,4,5].map(i => (
              <button key={i}
                onMouseEnter={() => setHoverRating(i)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(i)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 32, color: i <= (hoverRating || rating) ? '#F59E0B' : '#E5E7EB', transition: 'color 0.1s' }}>
                ★
              </button>
            ))}
            <span style={{ fontSize: 14, fontWeight: 800, color: '#111827', alignSelf: 'center', marginLeft: 4 }}>
              {['', '별로예요', '아쉬워요', '보통이에요', '좋아요', '최고예요'][hoverRating || rating]}
            </span>
          </div>
        </div>

        {/* 내용 */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
            리뷰 내용 <span style={{ color: '#9CA3AF', fontWeight: 500 }}>(최소 10자)</span>
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="프로그램 이용 후 솔직한 리뷰를 남겨주세요..."
            style={{ width: '100%', height: 120, padding: '12px 14px', borderRadius: 12, border: '2px solid #E5E7EB', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'none', boxSizing: 'border-box', color: '#111827' }}
          />
          <div style={{ fontSize: 11, color: content.length >= 10 ? '#10B981' : '#9CA3AF', textAlign: 'right', marginTop: 4 }}>
            {content.length}자 {content.length < 10 ? `(${10 - content.length}자 더 필요)` : '✓'}
          </div>
        </div>

        {error && <div style={{ background: '#FEF2F2', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#991B1B', fontWeight: 700 }}>✕ {error}</div>}

        <button onClick={handleSubmit} disabled={submitting || content.length < 10}
          style={{ width: '100%', background: content.length >= 10 && !submitting ? '#111827' : '#E5E7EB', color: content.length >= 10 && !submitting ? '#fff' : '#9CA3AF', border: 'none', borderRadius: 14, padding: '16px', fontSize: 15, fontWeight: 900, cursor: content.length >= 10 && !submitting ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
          {submitting ? '등록 중...' : '리뷰 등록하기'}
        </button>
      </div>
    </div>
  )
}

export default function MyOrdersPage() {
  const { user, accessToken } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewTarget, setReviewTarget] = useState<Order | null>(null)

  useEffect(() => { if (!user) router.replace('/login') }, [user, router])

  useEffect(() => {
    if (!accessToken) return
    fetch('/api/orders', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => setOrders(d.orders ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [accessToken])

  const handleReviewSuccess = (orderId: string, reviewId: string, rating: number) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, review: { id: reviewId, rating } } : o))
  }

  if (!user) return null

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <style>{`
        @media(max-width:640px){
          .orders-main{padding:20px 16px 60px!important;}
          .order-number{font-size:11px!important;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px;}
        }
      `}</style>
      <Header />
      <main className="orders-main" style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Link href="/my" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: 22 }}>←</Link>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111827' }}>구매 내역</h1>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <div>불러오는 중...</div>
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>구매 내역이 없습니다</div>
            <Link href="/" style={{ display: 'inline-block', marginTop: 16, background: '#111827', color: '#fff', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
              프로그램 둘러보기
            </Link>
          </div>
        )}

        {orders.map(o => {
          const s = STATUS_LABEL[o.status] ?? STATUS_LABEL['pending']
          const icon = CATEGORY_ICON[o.program.category] ?? '📦'
          const hasDownload = o.permissions.length > 0
          const canReview = !o.review && (o.status === 'confirmed' || o.status === 'paid')
          return (
            <div key={o.id} style={{ background: '#fff', borderRadius: 18, padding: 20, border: '1px solid #F0EDE8', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 8 }}>
                <div className="order-number" style={{ fontSize: 12, color: '#9CA3AF' }}>{o.order_number} · {formatDate(o.created_at)}</div>
                <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 7, background: s.bg, color: s.color, flexShrink: 0 }}>{s.label}</span>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {/* 썸네일 */}
                <div style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {o.program.thumbnail_url
                    ? <img src={o.program.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 24 }}>{icon}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/programs/${o.program.id}`} style={{ fontSize: 15, fontWeight: 800, color: '#111827', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.program.title}</Link>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>{o.program.category}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#111827' }}>{o.amount.toLocaleString()}원</div>
                  {o.point_amount > 0 && (
                    <div style={{ fontSize: 11, color: '#10B981' }}>포인트 {o.point_amount.toLocaleString()}P 사용</div>
                  )}
                </div>
              </div>

              {/* 리뷰 작성 완료 표시 */}
              {o.review && (
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: '#FFFBEB', borderRadius: 8 }}>
                  <span style={{ color: '#F59E0B' }}>{'★'.repeat(o.review.rating)}</span>
                  <span style={{ fontSize: 12, color: '#92400E', fontWeight: 700 }}>리뷰 작성 완료</span>
                  <Link href="/my/reviews" style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 'auto', textDecoration: 'none' }}>내 리뷰 보기 →</Link>
                </div>
              )}

              {(hasDownload || canReview) && (
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  {hasDownload && (
                    <Link href="/my/downloads" style={{ flex: 1, background: '#111827', color: '#fff', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>⬇ 파일 다운로드</Link>
                  )}
                  {canReview && (
                    <button onClick={() => setReviewTarget(o)}
                      style={{ flex: 1, background: '#FFF7ED', color: '#C2410C', border: '1.5px solid #FED7AA', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      ⭐ 리뷰 작성
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </main>

      {reviewTarget && accessToken && (
        <ReviewModal
          order={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSuccess={handleReviewSuccess}
          accessToken={accessToken}
        />
      )}
    </div>
  )
}
