'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import { useAuth } from '@/store/auth'

const fmt = (n: number) => n === 0 ? '무료' : `${n.toLocaleString()}원`
const catGrad = (c: string) => ({ '레크리에이션': '#E0F2FE,#BAE6FD', '교육': '#EDE9FE,#DDD6FE', '진로': '#FEF3C7,#FDE68A', '예체능': '#FCE7F3,#FBCFE8', '재능봉사': '#D1FAE5,#A7F3D0' }[c] ?? '#F3F4F6,#E5E7EB')
const catIcon = (c: string) => ({ '레크리에이션': '🎯', '교육': '📚', '진로': '🔭', '예체능': '🎨', '재능봉사': '🤝' }[c] ?? '📄')

interface DBProgram {
  id: string
  product_type: 'file_product' | 'class'
  title: string
  subtitle: string | null
  category: string
  target_levels: string[]
  region: string[]
  price: number
  description: string
  file_format: string | null
  page_count: number | null
  duration: string | null
  max_participants: number | null
  rating_avg: string
  review_count: number
  tags: string[]
  seller: { id: string; nickname: string; profile_image: string | null }
  files: { id: string; file_name: string; file_type: string; file_size: string; is_preview: boolean }[]
}

export default function ProgramDetailPage() {
  const { id }                  = useParams<{ id: string }>()
  const router                  = useRouter()
  const { user, accessToken }   = useAuth()
  const [p, setP]               = useState<DBProgram | null>(null)
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState<'intro' | 'files' | 'reviews'>('intro')
  const [showModal, setShowModal] = useState(false)
  const [payStep, setPayStep]   = useState<'form' | 'paying' | 'done'>('form')
  const [payMethod, setPayMethod] = useState('point')
  const [date, setDate]         = useState('')
  const [msg, setMsg]           = useState('')
  const [userPoints, setUserPoints] = useState<number | null>(null)
  const [payError, setPayError] = useState('')
  const [couponInput, setCouponInput] = useState('')
  const [couponResult, setCouponResult] = useState<{ discount: number; finalPrice: number; description: string | null } | null>(null)
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [myCoupons, setMyCoupons] = useState<{ id: string; code: string; discount_value: number; type: string; max_discount: number | null; description: string | null; min_price: number }[]>([])
  const [reviews, setReviews] = useState<{ id: string; rating: number; content: string; created_at: string; buyer: { nickname: string; profile_image: string | null } }[]>([])
  const [reviewsLoaded, setReviewsLoaded] = useState(false)
  const [reviewsTotal, setReviewsTotal] = useState(0)
  const [relatedPrograms, setRelatedPrograms] = useState<DBProgram[]>([])
  const [cartAdded, setCartAdded] = useState(false)
  const [showInquiry, setShowInquiry] = useState(false)
  const [inquiryForm, setInquiryForm] = useState({ title: '', content: '' })
  const [inquirySubmitting, setInquirySubmitting] = useState(false)
  const [inquiryDone, setInquiryDone] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDetail, setReportDetail] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportDone, setReportDone] = useState(false)

  useEffect(() => {
    if (tab !== 'reviews' || reviewsLoaded) return
    fetch(`/api/reviews?programId=${id}`)
      .then(r => r.json())
      .then(d => { setReviews(d.reviews ?? []); setReviewsTotal(d.total ?? 0) })
      .catch(() => {})
      .finally(() => setReviewsLoaded(true))
  }, [tab, id, reviewsLoaded])

  useEffect(() => {
    fetch(`/api/programs/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const prog = d?.program ?? null
        setP(prog)
        if (prog?.category) {
          fetch(`/api/programs?category=${encodeURIComponent(prog.category)}&sort=rating&page=1`)
            .then(r => r.ok ? r.json() : { programs: [] })
            .then(data => setRelatedPrograms((data.programs ?? []).filter((rp: DBProgram) => rp.id !== id).slice(0, 4)))
            .catch(() => {})
        }
      })
      .catch(() => setP(null))
      .finally(() => setLoading(false))
  }, [id])

  const handleAddToCart = async () => {
    if (!user) { router.push('/login'); return }
    if (!p) return
    await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ programId: p.id }),
    })
    setCartAdded(true)
    setTimeout(() => setCartAdded(false), 2000)
  }

  const handleReportSubmit = async () => {
    if (!p || !reportReason) return
    setReportSubmitting(true)
    try {
      const res = await fetch(`/api/programs/${p.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ reason: reportReason, detail: reportDetail }),
      })
      if (res.ok) { setReportDone(true); setShowReport(false); setReportReason(''); setReportDetail('') }
    } finally { setReportSubmitting(false) }
  }

  const handleInquirySubmit = async () => {
    if (!p || !inquiryForm.title.trim() || !inquiryForm.content.trim()) return
    setInquirySubmitting(true)
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ targetType: 'seller', programId: p.id, title: inquiryForm.title, content: inquiryForm.content }),
      })
      if (res.ok) { setInquiryDone(true); setShowInquiry(false); setInquiryForm({ title: '', content: '' }) }
    } finally { setInquirySubmitting(false) }
  }

  const applyCoupon = async () => {
    if (!p || !couponInput.trim()) return
    setCouponLoading(true)
    setCouponError('')
    setCouponResult(null)
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ code: couponInput.trim(), programId: p.id }),
      })
      const data = await res.json()
      if (!res.ok) { setCouponError(data.error ?? '쿠폰 적용 실패'); return }
      setCouponResult({ discount: data.discount, finalPrice: data.finalPrice, description: data.coupon.description })
    } catch {
      setCouponError('네트워크 오류')
    } finally {
      setCouponLoading(false)
    }
  }

  const handleBuy = () => {
    if (!user) { router.push('/login'); return }
    setShowModal(true)
    setPayStep('form')
    setPayError('')
    setCouponInput('')
    setCouponResult(null)
    setCouponError('')
    // 등록된 쿠폰 불러오기 (구매·판매자)
    if (accessToken && (user.role === 'buyer' || user.role === 'seller')) {
      fetch('/api/my/coupons/registered', { headers: { Authorization: `Bearer ${accessToken}` } })
        .then(r => r.ok ? r.json() : { coupons: [] })
        .then(d => setMyCoupons((d.coupons ?? []).filter((uc: any) => uc.usable).map((uc: any) => uc.coupon)))
        .catch(() => {})
    }
    if (accessToken) {
      fetch('/api/points', { headers: { Authorization: `Bearer ${accessToken}` } })
        .then(r => r.json()).then(d => setUserPoints(d.points ?? 0)).catch(() => setUserPoints(0))
    }
  }

  const handlePay = async () => {
    if (!p) return
    setPayError('')

    const effectivePrice = couponResult ? couponResult.finalPrice : p.price
    if (payMethod === 'point' && (userPoints === null || userPoints < effectivePrice)) {
      setPayError('포인트가 부족합니다.')
      return
    }

    setPayStep('paying')
    try {
      const usePoints = payMethod === 'point' ? effectivePrice : 0
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ programId: p.id, scheduledAt: date || null, message: msg || null, usePoints, couponCode: couponResult ? couponInput.trim() : null }),
      })
      if (!res.ok) {
        const d = await res.json()
        setPayStep('form')
        setPayError(d.detail ?? d.error ?? '결제 실패')
        return
      }
      const { order, cardAmount } = await res.json()

      if (order.status === 'paid') {
        // 포인트 결제 또는 PortOne 미설정 자동 승인
        setPayStep('done')
      } else {
        // 실제 PortOne 카드 결제가 필요한 경우 (추후 구현)
        setPayStep('form')
        setPayError('카드 결제 PG가 설정되지 않았습니다. 포인트로 결제해주세요.')
      }
    } catch {
      setPayStep('form')
      setPayError('네트워크 오류가 발생했습니다.')
    }
  }

  if (loading) return (
    <div style={{ fontFamily: "'Pretendard Variable',sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <Header />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ height: 200, background: 'linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', borderRadius: 20 }} />
        <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      </div>
    </div>
  )

  if (!p) return (
    <div style={{ fontFamily: "'Pretendard Variable',sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <Header />
      <div style={{ textAlign: 'center', padding: '100px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😢</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 8 }}>자료를 찾을 수 없어요</div>
        <Link href="/" style={{ color: '#4FC3F7', fontWeight: 700 }}>← 목록으로 돌아가기</Link>
      </div>
    </div>
  )

  const isFile  = p.product_type === 'file_product'
  const rating  = parseFloat(p.rating_avg) || 0
  const effectivePrice = couponResult ? couponResult.finalPrice : p.price
  const notEnough = userPoints !== null && userPoints < effectivePrice

  return (
    <div style={{ fontFamily: "'Pretendard Variable',Pretendard,-apple-system,sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        .tab-btn{padding:12px 16px;border:none;background:none;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;color:#9CA3AF;border-bottom:2px solid transparent;transition:all 0.15s;white-space:nowrap;}
        .tab-btn.on{color:#111827;border-bottom-color:#111827;}
        .tab-bar{display:flex;overflow-x:auto;border-bottom:1px solid #F0EDE8;}
        .tab-bar::-webkit-scrollbar{display:none;}
        .pay-method{padding:14px 16px;border-radius:12px;border:2px solid #E5E7EB;cursor:pointer;transition:all 0.15s;display:flex;align-items:center;gap:10px;background:#fff;}
        .pay-method.on{border-color:#111827;background:#F9FAFB;}
        .input-field{width:100%;padding:12px 14px;border-radius:10px;border:2px solid #E5E7EB;font-size:14px;font-family:inherit;outline:none;color:#111827;background:#fff;}
        @media(max-width:768px){
          .detail-grid{display:block!important;}
          .sticky-box{display:none!important;}
          .mobile-buy-bar{display:flex!important;}
          .detail-padding{padding:16px 16px 80px!important;}
        }
        @media(min-width:769px){.mobile-buy-bar{display:none!important;}}
      `}</style>

      <Header />

      <div className="detail-padding" style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 80px' }}>
        <Link href="/" style={{ fontSize: 13, color: '#6B7280', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>← 목록으로</Link>

        <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' }}>
          {/* 왼쪽 */}
          <div>
            <div style={{ height: 200, background: `linear-gradient(135deg,${catGrad(p.category)})`, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, marginBottom: 24, position: 'relative' }}>
              {catIcon(p.category)}
              <span style={{ position: 'absolute', top: 16, left: 16, background: isFile ? '#0369A1' : '#5B21B6', color: '#fff', fontSize: 12, fontWeight: 800, padding: '4px 12px', borderRadius: 8 }}>
                {isFile ? '📄 파일 자료' : '🎓 강의'}
              </span>
              <span style={{ position: 'absolute', top: 16, right: 16, background: '#111827', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6 }}>{p.category}</span>
            </div>

            <div style={{ background: '#fff', borderRadius: 20, padding: 28, marginBottom: 16, border: '1px solid #F0EDE8' }}>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#111827', marginBottom: 8, lineHeight: 1.3 }}>{p.title}</h1>
              {p.subtitle && <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}>{p.subtitle}</p>}

              <Link href={`/sellers/${p.seller.id}`} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 16, background: '#F9FAFB', borderRadius: 12, marginBottom: 20, textDecoration: 'none' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#667EEA,#764BA2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff', fontWeight: 900 }}>
                  {p.seller.nickname[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{p.seller.nickname}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>판매자 · 프로필 보기 →</div>
                </div>
              </Link>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {isFile ? [
                  ['📄 파일 형식', p.file_format ?? '-'],
                  ['📑 페이지 수', p.page_count ? `${p.page_count}p` : '-'],
                  ['🎯 대상', p.target_levels.join(', ')],
                  ['🏷 태그', p.tags.slice(0, 3).join(', ') || '-'],
                ] : [
                  ['⏱ 진행 시간', p.duration ?? '협의'],
                  ['👥 최대 인원', p.max_participants ? `${p.max_participants}명` : '미정'],
                  ['📍 가능 지역', p.region.join(', ')],
                  ['🎯 대상', p.target_levels.join(', ')],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 3 }}>{k}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{v}</div>
                  </div>
                ))}
                {isFile && [
                  ['📄 파일 형식', p.file_format ?? '-'],
                  ['📑 페이지 수', p.page_count ? `${p.page_count}p` : '-'],
                  ['🎯 대상', p.target_levels.join(', ')],
                  ['🏷 태그', p.tags.slice(0, 3).join(', ') || '-'],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 3 }}>{k}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 탭 */}
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #F0EDE8', overflow: 'hidden' }}>
              <div className="tab-bar">
                {(['intro', 'files', 'reviews'] as const).map(t => (
                  <button key={t} className={`tab-btn ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>
                    {t === 'intro' ? '소개' : t === 'files' ? (isFile ? `첨부 파일 (${p.files.length})` : '커리큘럼') : `리뷰 (${p.review_count})`}
                  </button>
                ))}
              </div>
              <div style={{ padding: 24 }}>
                {tab === 'intro' && <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{p.description}</p>}
                {tab === 'files' && isFile && (
                  p.files.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {p.files.map(f => (
                        <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#F9FAFB', borderRadius: 10, border: f.is_preview ? '2px solid #4F46E5' : '1px solid #E5E7EB' }}>
                          <span style={{ fontSize: 24 }}>📄</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{f.file_name}</div>
                            <div style={{ fontSize: 12, color: '#9CA3AF' }}>{(Number(f.file_size) / (1024 * 1024)).toFixed(1)} MB</div>
                          </div>
                          {f.is_preview && (
                            <>
                              <span style={{ fontSize: 11, background: '#EDE9FE', color: '#5B21B6', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>무료 샘플</span>
                              <a href={`/api/programs/${p.id}/sample`} target="_blank" rel="noopener noreferrer"
                                style={{ fontSize: 12, background: '#5B21B6', color: '#fff', padding: '5px 10px', borderRadius: 7, fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                다운로드
                              </a>
                            </>
                          )}
                        </div>
                      ))}
                      <div style={{ fontSize: 12, color: '#9CA3AF', padding: '4px 2px' }}>💡 구매 후 모든 파일을 다운로드할 수 있습니다</div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: '#9CA3AF', fontSize: 14 }}>📎 첨부 파일 정보를 준비 중입니다</div>
                  )
                )}
                {tab === 'files' && !isFile && (
                  <div style={{ textAlign: 'center', padding: '30px 0', color: '#9CA3AF', fontSize: 14 }}>📋 커리큘럼을 준비 중입니다</div>
                )}
                {tab === 'reviews' && (
                  <div>
                    {/* 평점 요약 */}
                    <div style={{ display: 'flex', gap: 20, alignItems: 'center', padding: 20, background: '#F9FAFB', borderRadius: 14, marginBottom: 20 }}>
                      <div style={{ textAlign: 'center', minWidth: 70 }}>
                        <div style={{ fontSize: 48, fontWeight: 900, color: '#111827', lineHeight: 1 }}>{rating > 0 ? rating.toFixed(1) : '-'}</div>
                        {rating > 0 && (
                          <div style={{ marginTop: 4 }}>
                            {[1,2,3,4,5].map(i => (
                              <span key={i} style={{ color: i <= Math.round(rating) ? '#F59E0B' : '#E5E7EB', fontSize: 16 }}>★</span>
                            ))}
                          </div>
                        )}
                        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{p.review_count}개 리뷰</div>
                      </div>
                      {rating > 0 && (
                        <div style={{ flex: 1, fontSize: 13, color: '#6B7280' }}>
                          구매자들이 직접 사용 후 남긴 리뷰입니다.
                        </div>
                      )}
                    </div>

                    {/* 리뷰 목록 */}
                    {!reviewsLoaded ? (
                      <div style={{ textAlign: 'center', padding: '20px 0', color: '#9CA3AF', fontSize: 14 }}>불러오는 중...</div>
                    ) : reviews.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px 0', color: '#9CA3AF' }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                        <div style={{ fontSize: 14 }}>아직 리뷰가 없습니다</div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>첫 구매자가 되어 리뷰를 남겨보세요</div>
                      </div>
                    ) : reviews.map(r => (
                      <div key={r.id} style={{ borderBottom: '1px solid #F3F4F6', paddingBottom: 18, marginBottom: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {/* 아바타 */}
                            <div style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(135deg,#667EEA,#764BA2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', fontWeight: 800 }}>
                              {r.buyer.profile_image
                                ? <img src={r.buyer.profile_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : r.buyer.nickname.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{r.buyer.nickname}</div>
                              <div style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(r.created_at).toLocaleDateString('ko-KR')}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 1 }}>
                            {[1,2,3,4,5].map(i => (
                              <span key={i} style={{ color: i <= r.rating ? '#F59E0B' : '#E5E7EB', fontSize: 15 }}>★</span>
                            ))}
                          </div>
                        </div>
                        <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, margin: 0 }}>{r.content}</p>
                      </div>
                    ))}
                    {reviewsTotal > reviews.length && (
                      <div style={{ textAlign: 'center', paddingTop: 4 }}>
                        <button onClick={() => {
                          setReviewsLoaded(false)
                        }} style={{ background: 'none', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#374151', fontFamily: 'inherit' }}>
                          더 보기 ({reviewsTotal - reviews.length}개 남음)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 관련 프로그램 - 같은 카테고리 인기 자료 */}
            {relatedPrograms.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 12 }}>
                  📚 같은 카테고리 인기 자료
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                  {relatedPrograms.map(rp => {
                    const rpRating = parseFloat(rp.rating_avg) || 0
                    return (
                      <Link key={rp.id} href={`/programs/${rp.id}`} style={{ background: '#fff', borderRadius: 14, border: '1px solid #F0EDE8', overflow: 'hidden', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}>
                        <div style={{ height: 90, background: `linear-gradient(135deg,${catGrad(rp.category)})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
                          {catIcon(rp.category)}
                        </div>
                        <div style={{ padding: '10px 12px' }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', lineHeight: 1.35, marginBottom: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{rp.title}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, fontWeight: 900, color: rp.price === 0 ? '#10B981' : '#111827' }}>{fmt(rp.price)}</span>
                            {rpRating > 0 && <span style={{ fontSize: 12, color: '#F59E0B', fontWeight: 700 }}>★ {rpRating.toFixed(1)}</span>}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 오른쪽 구매 박스 */}
          <div className="sticky-box" style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #F0EDE8', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: p.price === 0 ? '#10B981' : '#111827', marginBottom: 4 }}>{fmt(p.price)}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>{isFile ? '1회 다운로드' : '1회 진행 기준'}</div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                {[['별점', rating > 0 ? `★ ${rating.toFixed(1)}` : '-'], ['리뷰', `${p.review_count}개`], [isFile ? '페이지' : '시간', isFile ? (p.page_count ? `${p.page_count}p` : '-') : (p.duration ?? '협의')]].map(([label, val]) => (
                  <div key={label} style={{ flex: 1, background: '#F9FAFB', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#111827' }}>{val}</div>
                  </div>
                ))}
              </div>
              {isFile && (
                <div style={{ background: '#F0F9FF', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#0369A1', fontWeight: 700 }}>
                  📥 결제 즉시 다운로드 가능{p.file_format ? ` · ${p.file_format} 형식` : ''}
                </div>
              )}
              {isFile && p.files.some(f => f.is_preview) && (
                <a href={`/api/programs/${p.id}/sample`} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', width: '100%', textAlign: 'center', background: '#EDE9FE', color: '#5B21B6', border: 'none', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10, textDecoration: 'none', boxSizing: 'border-box' }}>
                  👁 무료 샘플 다운로드
                </a>
              )}
              <button onClick={handleBuy} style={{ width: '100%', background: isFile ? '#0369A1' : '#111827', color: '#fff', border: 'none', borderRadius: 14, padding: '16px', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8 }}>
                {isFile ? '📥 파일 구매하기 →' : '📅 강의 신청하기 →'}
              </button>
              <button onClick={handleAddToCart}
                style={{ width: '100%', background: cartAdded ? '#D1FAE5' : '#fff', color: cartAdded ? '#065F46' : '#374151', border: `2px solid ${cartAdded ? '#6EE7B7' : '#E5E7EB'}`, borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8, transition: 'all 0.2s' }}>
                {cartAdded ? '✓ 장바구니 담김!' : '🛒 장바구니 담기'}
              </button>
              {inquiryDone && (
                <div style={{ background: '#D1FAE5', color: '#065F46', borderRadius: 10, padding: '10px 14px', fontSize: 12, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
                  ✓ 문의가 접수되었습니다
                </div>
              )}
              <button onClick={() => { if (!user) { router.push('/login'); return } setShowInquiry(v => !v); setInquiryDone(false) }}
                style={{ width: '100%', background: '#fff', color: '#6B7280', border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '11px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10, transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#111827'; e.currentTarget.style.color = '#111827' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#6B7280' }}>
                💬 판매자에게 문의
              </button>
              <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center' }}>✅ 안전결제 · 환불정책 적용</div>
              {user && user.id !== p.seller.id && (
                <button onClick={() => { setShowReport(v => !v); setReportDone(false) }}
                  style={{ display: 'block', width: '100%', textAlign: 'center', fontSize: 11, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', marginTop: 10, fontFamily: 'inherit' }}>
                  🚨 이 프로그램 신고하기
                </button>
              )}
              {reportDone && (
                <div style={{ background: '#D1FAE5', color: '#065F46', borderRadius: 10, padding: '8px 12px', fontSize: 12, fontWeight: 700, marginTop: 8, textAlign: 'center' }}>
                  ✓ 신고가 접수되었습니다
                </div>
              )}
            </div>
            {/* 판매자 문의 인라인 폼 */}
            {showInquiry && (
              <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '2px solid #E5E7EB' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 14 }}>💬 판매자에게 문의</div>
                <input value={inquiryForm.title} onChange={e => setInquiryForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="제목" maxLength={100}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '2px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit', outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} />
                <textarea value={inquiryForm.content} onChange={e => setInquiryForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="문의 내용을 입력하세요" rows={4}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '2px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', marginBottom: 10, boxSizing: 'border-box' }} />
                <button onClick={handleInquirySubmit}
                  disabled={inquirySubmitting || !inquiryForm.title.trim() || !inquiryForm.content.trim()}
                  style={{ width: '100%', background: !inquiryForm.title.trim() || !inquiryForm.content.trim() ? '#E5E7EB' : '#111827', color: !inquiryForm.title.trim() || !inquiryForm.content.trim() ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {inquirySubmitting ? '제출 중...' : '문의 제출'}
                </button>
              </div>
            )}
          {/* 신고 인라인 폼 */}
          {showReport && (
            <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '2px solid #EF4444' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#EF4444', marginBottom: 14 }}>🚨 프로그램 신고</div>
              <select value={reportReason} onChange={e => setReportReason(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '2px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit', outline: 'none', marginBottom: 10, background: '#fff', boxSizing: 'border-box' }}>
                <option value="">신고 사유 선택</option>
                <option value="inappropriate_content">부적절한 콘텐츠</option>
                <option value="spam">스팸/광고</option>
                <option value="copyright">저작권 침해</option>
                <option value="fake">허위 정보</option>
                <option value="other">기타</option>
              </select>
              <textarea value={reportDetail} onChange={e => setReportDetail(e.target.value)}
                placeholder="상세 내용 (선택)" rows={3}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '2px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', marginBottom: 10, boxSizing: 'border-box' }} />
              <button onClick={handleReportSubmit}
                disabled={reportSubmitting || !reportReason}
                style={{ width: '100%', background: !reportReason ? '#E5E7EB' : '#EF4444', color: !reportReason ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 800, cursor: !reportReason ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {reportSubmitting ? '접수 중...' : '신고 제출'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* 모바일 하단 바 */}
      <div className="mobile-buy-bar" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #F0EDE8', padding: '12px 20px 20px', display: 'flex', gap: 10, alignItems: 'center', zIndex: 99 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#111827' }}>{fmt(p.price)}</div>
          {rating > 0 && <div style={{ fontSize: 11, color: '#9CA3AF' }}>★ {rating.toFixed(1)} ({p.review_count})</div>}
        </div>
        {isFile && p.files.some(f => f.is_preview) && (
          <a href={`/api/programs/${p.id}/sample`} target="_blank" rel="noopener noreferrer"
            style={{ background: '#EDE9FE', color: '#5B21B6', border: 'none', borderRadius: 12, padding: '14px 12px', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            👁 샘플
          </a>
        )}
        <button onClick={handleBuy} style={{ flex: 1, background: isFile ? '#0369A1' : '#111827', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
          {isFile ? '📥 파일 구매하기' : '📅 강의 신청하기'}
        </button>
      </div>

      {/* 결제 모달 */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '28px 24px 40px', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            {payStep === 'form' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#111827' }}>{isFile ? '📥 파일 구매' : '📅 강의 신청'}</div>
                  <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>✕</button>
                </div>
                <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 14, marginBottom: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{p.title}</div>
                  <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>{fmt(p.price)}</div>
                  {isFile && <div style={{ fontSize: 12, color: '#0369A1', fontWeight: 700, marginTop: 6 }}>📥 결제 즉시 다운로드 링크 발송</div>}
                </div>
                {!isFile && (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>희망 일시</label>
                      <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="input-field" />
                    </div>
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>요청사항 (선택)</label>
                      <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="장소, 참여 인원, 특이사항 등" className="input-field" style={{ resize: 'none', height: 80 }} />
                    </div>
                  </>
                )}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10 }}>결제 수단</div>
                  {[['point', '💰 포인트 결제', true]].map(([v, l, isPoint]) => {
                    const tooFew = isPoint && notEnough
                    return (
                      <div key={v as string} className={`pay-method ${payMethod === v ? 'on' : ''}`}
                        style={{ marginBottom: 8, opacity: tooFew ? 0.5 : 1 }}
                        onClick={() => !tooFew && setPayMethod(v as string)}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${payMethod === v ? '#111827' : '#D1D5DB'}`, background: payMethod === v ? '#111827' : 'transparent', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 14, fontWeight: 700 }}>{l as string}</span>
                          {isPoint && (
                            <span style={{ fontSize: 12, marginLeft: 8, color: tooFew ? '#EF4444' : '#4F46E5', fontWeight: 700 }}>
                              {userPoints === null ? '조회 중...' : `보유 ${userPoints.toLocaleString()}P`}{tooFew ? ' (부족)' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {/* 쿠폰 */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>🎟 할인 쿠폰</div>

                  {/* 내 쿠폰 선택 (등록된 쿠폰이 있을 때) */}
                  {myCoupons.length > 0 && !couponResult && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 700, marginBottom: 6 }}>내 쿠폰 ({myCoupons.length}개)</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {myCoupons.map(mc => (
                          <button key={mc.id} onClick={() => { setCouponInput(mc.code); setCouponResult(null); setCouponError('') }}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, border: `2px solid ${couponInput === mc.code ? '#4F46E5' : '#E5E7EB'}`, background: couponInput === mc.code ? '#EDE9FE' : '#F9FAFB', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 900, color: '#111827', letterSpacing: '0.04em' }}>{mc.code}</div>
                              {mc.description && <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>{mc.description}</div>}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#4F46E5', flexShrink: 0, marginLeft: 8 }}>
                              {mc.type === 'percentage' ? `${mc.discount_value}%` : `${mc.discount_value.toLocaleString()}원`} 할인
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 코드 직접 입력 */}
                  {!couponResult && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        value={couponInput}
                        onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError('') }}
                        placeholder={myCoupons.length > 0 ? '또는 코드 직접 입력' : '쿠폰 코드 입력'}
                        className="input-field"
                        style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                      />
                      <button onClick={applyCoupon} disabled={couponLoading || !couponInput.trim()}
                        style={{ padding: '12px 16px', borderRadius: 10, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', opacity: !couponInput.trim() ? 0.4 : 1 }}>
                        {couponLoading ? '...' : '적용'}
                      </button>
                    </div>
                  )}
                  {couponError && <div style={{ fontSize: 12, color: '#EF4444', fontWeight: 700, marginTop: 6 }}>✕ {couponError}</div>}
                  {couponResult && (
                    <div style={{ background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#166534' }}>✓ {couponInput} 적용됨</div>
                        {couponResult.description && <div style={{ fontSize: 11, color: '#15803D', marginTop: 2 }}>{couponResult.description}</div>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: '#166534' }}>-{couponResult.discount.toLocaleString()}원</div>
                        <button onClick={() => { setCouponResult(null); setCouponInput('') }} style={{ fontSize: 11, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', marginTop: 2 }}>제거</button>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 14, marginBottom: payError ? 10 : 20 }}>
                  {couponResult && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: '#374151' }}>정가</span>
                      <span style={{ fontSize: 13, color: '#9CA3AF', textDecoration: 'line-through' }}>{fmt(p.price)}</span>
                    </div>
                  )}
                  {couponResult && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: '#166534', fontWeight: 700 }}>쿠폰 할인</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#166534' }}>-{couponResult.discount.toLocaleString()}원</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>총 결제 금액</span>
                    <span style={{ fontSize: 16, fontWeight: 900, color: '#111827' }}>{fmt(couponResult ? couponResult.finalPrice : p.price)}</span>
                  </div>
                  {payMethod === 'point' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      <span style={{ fontSize: 13, color: '#4F46E5', fontWeight: 700 }}>포인트 차감</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#4F46E5' }}>-{(couponResult ? couponResult.finalPrice : p.price).toLocaleString()}P</span>
                    </div>
                  )}
                </div>
                {payError && <div style={{ background: '#FEF2F2', color: '#991B1B', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>✕ {payError}</div>}
                <button onClick={handlePay} disabled={payMethod === 'point' && notEnough}
                  style={{ width: '100%', border: 'none', borderRadius: 14, padding: '16px', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', opacity: payMethod === 'point' && notEnough ? 0.4 : 1,
                    background: payMethod === 'kakao' ? '#FEE500' : payMethod === 'toss' ? '#0064FF' : payMethod === 'point' ? '#4F46E5' : isFile ? '#0369A1' : '#111827',
                    color: payMethod === 'kakao' ? '#1A1A1A' : '#fff',
                  }}>
                  {payMethod === 'point' ? `${(couponResult ? couponResult.finalPrice : p.price).toLocaleString()}P 사용하여 결제` : `${fmt(couponResult ? couponResult.finalPrice : p.price)} 결제하기`}
                </button>
              </>
            )}
            {payStep === 'paying' && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 16, animation: 'spin 1s linear infinite' }}>⏳</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>결제 처리 중...</div>
                <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
              </div>
            )}
            {payStep === 'done' && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>{isFile ? '📥' : '🎉'}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#111827', marginBottom: 8 }}>
                  {isFile ? '구매 완료! 파일을 다운로드하세요' : '신청이 완료되었습니다!'}
                </div>
                <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 28 }}>
                  {isFile ? '마이페이지 > 구매내역에서 다운로드할 수 있습니다' : '확인 알림톡이 발송되었습니다'}
                </div>
                <button onClick={() => { setShowModal(false); router.push('/my/orders') }}
                  style={{ background: isFile ? '#0369A1' : '#111827', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 28px', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {isFile ? '다운로드 받기 →' : '구매 내역 확인 →'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
