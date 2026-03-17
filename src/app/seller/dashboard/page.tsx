'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { useAuth } from '@/store/auth'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  active:    { label: '판매중',   bg: '#D1FAE5', color: '#065F46' },
  pending:   { label: '검수중',   bg: '#FEF3C7', color: '#92400E' },
  draft:     { label: '임시저장', bg: '#F3F4F6', color: '#6B7280' },
  paused:    { label: '일시중지', bg: '#F3F4F6', color: '#6B7280' },
  rejected:  { label: '반려됨',   bg: '#FEE2E2', color: '#991B1B' },
  confirmed: { label: '진행완료', bg: '#D1FAE5', color: '#065F46' },
  paid:      { label: '결제완료', bg: '#DBEAFE', color: '#1E40AF' },
  open:      { label: '미답변',   bg: '#FEF3C7', color: '#92400E' },
  answered:  { label: '답변완료', bg: '#D1FAE5', color: '#065F46' },
  closed:    { label: '종료',     bg: '#F3F4F6', color: '#6B7280' },
}

const CATEGORY_ICON: Record<string, string> = {
  '레크리에이션': '🎯', '체육': '⚽', '음악': '🎵', '미술': '🎨',
  '과학': '🔬', '수학': '🧮', '독서': '📚', '진로': '🧭',
  '상담': '💬', '특강': '🎤', '기타': '📦',
}

interface Program {
  id: string; title: string; category: string; price: number
  status: string; ratingAvg: number; reviewCount: number; orderCount: number; revenue: number
  thumbnailUrl?: string | null
}

interface Order {
  id: string; orderNumber: string; buyerName: string
  programTitle: string; programId: string; amount: number
  status: string; createdAt: string
}

interface Stats {
  totalPrograms: number; activePrograms: number
  totalOrders: number; monthOrders: number
  totalRevenue: number; monthRevenue: number
  avgRating: number; totalReviews: number
}

interface Review {
  id: string; rating: number; content: string; photoUrls: string[]
  createdAt: string; buyerName: string; buyerImage?: string | null
  programId: string; programTitle: string
}

interface Inquiry {
  id: string; title: string; content: string; status: string; createdAt: string
  user: { id: string; nickname: string }
  program?: { id: string; title: string } | null
  replies: { id: string }[]
}

interface Coupon {
  id: string; code: string; type: string; discountValue: number
  scope: string; programId?: string | null
  minPrice: number; maxDiscount?: number | null
  usageLimit?: number | null; perUserLimit: number; usedCount: number
  isActive: boolean; expiresAt?: string | null
  description?: string | null; createdAt: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR')
}

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: '#F59E0B', fontSize: 13 }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

export default function SellerDashboardPage() {
  const { user, accessToken } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<'overview' | 'programs' | 'orders' | 'settlements' | 'reviews' | 'inquiries' | 'coupons'>('overview')
  const [programs, setPrograms] = useState<Program[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [chartData, setChartData] = useState<{ date: string; revenue: number; orders: number }[]>([])
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'monthly'>('daily')

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsLoaded, setReviewsLoaded] = useState(false)

  // Inquiries
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [inquiriesLoaded, setInquiriesLoaded] = useState(false)
  const [replyOpen, setReplyOpen] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)

  // Coupons
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [couponsLoaded, setCouponsLoaded] = useState(false)
  const [couponForm, setCouponForm] = useState({
    type: 'fixed', discountValue: '', scope: 'seller', programId: '',
    minPrice: '', maxDiscount: '', usageLimit: '', perUserLimit: '1',
    expiresAt: '', description: '',
  })
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [showCouponForm, setShowCouponForm] = useState(false)

  const authHeaders = useCallback(() => ({
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }), [accessToken])

  const programAction = async (id: string, method: string, body?: object) => {
    if (!accessToken) return
    setActionLoading(id)
    try {
      await fetch(`/api/seller/programs/${id}`, {
        method,
        headers: authHeaders(),
        ...(body ? { body: JSON.stringify(body) } : {}),
      })
      const r = await fetch('/api/seller/stats', { headers: { Authorization: `Bearer ${accessToken}` } })
      const d = await r.json()
      setPrograms(d.programs ?? [])
      setOrders(d.orders ?? [])
      setStats(d.stats ?? null)
    } finally {
      setActionLoading(null)
    }
  }

  useEffect(() => {
    if (!user) router.replace('/login')
  }, [user, router])

  useEffect(() => {
    if (!accessToken || !user) return
    fetch('/api/seller/stats', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => {
        setPrograms(d.programs ?? [])
        setOrders(d.orders ?? [])
        setStats(d.stats ?? null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [accessToken, user])

  useEffect(() => {
    if (!accessToken) return
    fetch(`/api/seller/stats/chart?period=${chartPeriod}`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => setChartData(d.chart ?? []))
      .catch(() => {})
  }, [accessToken, chartPeriod])

  // Lazy load tabs
  useEffect(() => {
    if (tab === 'reviews' && !reviewsLoaded && accessToken) {
      fetch('/api/seller/reviews', { headers: { Authorization: `Bearer ${accessToken}` } })
        .then(r => r.json())
        .then(d => { setReviews(d.reviews ?? []); setReviewsLoaded(true) })
        .catch(() => setReviewsLoaded(true))
    }
    if (tab === 'inquiries' && !inquiriesLoaded && accessToken) {
      fetch('/api/inquiries?type=seller&target=received', { headers: { Authorization: `Bearer ${accessToken}` } })
        .then(r => r.json())
        .then(d => { setInquiries(d.inquiries ?? []); setInquiriesLoaded(true) })
        .catch(() => setInquiriesLoaded(true))
    }
    if (tab === 'coupons' && !couponsLoaded && accessToken) {
      fetch('/api/seller/coupons', { headers: { Authorization: `Bearer ${accessToken}` } })
        .then(r => r.json())
        .then(d => { setCoupons(d.coupons ?? []); setCouponsLoaded(true) })
        .catch(() => setCouponsLoaded(true))
    }
  }, [tab, reviewsLoaded, inquiriesLoaded, couponsLoaded, accessToken])

  const handleReply = async (inquiryId: string) => {
    if (!replyContent.trim() || !accessToken) return
    setReplyLoading(true)
    try {
      const r = await fetch(`/api/inquiries/${inquiryId}/reply`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ content: replyContent }),
      })
      if (r.ok) {
        setReplyOpen(null)
        setReplyContent('')
        // refresh inquiries
        const d = await fetch('/api/inquiries?type=seller&target=received', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }).then(x => x.json())
        setInquiries(d.inquiries ?? [])
      }
    } finally {
      setReplyLoading(false)
    }
  }

  const handleCouponSubmit = async () => {
    setCouponError('')
    if (!couponForm.discountValue) { setCouponError('할인값을 입력하세요'); return }
    setCouponLoading(true)
    try {
      const r = await fetch('/api/seller/coupons', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(couponForm),
      })
      const d = await r.json()
      if (!r.ok) { setCouponError(d.message ?? '생성 실패'); return }
      setCoupons(prev => [{ ...d.coupon, usedCount: 0 }, ...prev])
      setShowCouponForm(false)
      setCouponForm({
        type: 'fixed', discountValue: '', scope: 'seller', programId: '',
        minPrice: '', maxDiscount: '', usageLimit: '', perUserLimit: '1',
        expiresAt: '', description: '',
      })
    } finally {
      setCouponLoading(false)
    }
  }

  if (!user) return null

  const KPI = stats ? [
    { label: '이번달 수익', value: `₩${stats.monthRevenue.toLocaleString()}`, sub: `총 ${stats.totalRevenue.toLocaleString()}원`, icon: '💰' },
    { label: '등록 프로그램', value: `${stats.totalPrograms}개`, sub: `${stats.activePrograms}개 판매중`, icon: '📦' },
    { label: '총 주문', value: `${stats.totalOrders}건`, sub: `이번달 ${stats.monthOrders}건`, icon: '📋' },
    { label: '평균 별점', value: `${stats.avgRating.toFixed(1)} ★`, sub: `${stats.totalReviews}개 리뷰`, icon: '⭐' },
  ] : []

  const TABS = [
    ['overview', '대시보드'],
    ['programs', '프로그램'],
    ['orders', '주문 내역'],
    ['reviews', '리뷰'],
    ['inquiries', '문의 관리'],
    ['coupons', '쿠폰'],
    ['settlements', '정산'],
  ] as const

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <style>{`
        @media(max-width:640px){
          .dash-main{padding:20px 16px 60px!important;}
          .dash-header{flex-wrap:wrap;gap:10px!important;}
          .dash-tab-bar{overflow-x:auto;-webkit-overflow-scrolling:touch;}
          .dash-tab-bar::-webkit-scrollbar{display:none;}
          .dash-tab-btn{white-space:nowrap;padding:10px 14px!important;font-size:13px!important;}
          .kpi-grid{grid-template-columns:1fr 1fr!important;}
          .table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;}
          .table-wrap table{min-width:480px;}
          .settle-grid{grid-template-columns:1fr!important;}
          .recent-order-row{flex-direction:column;align-items:flex-start!important;gap:8px!important;}
          .recent-order-right{width:100%;display:flex;justify-content:space-between;align-items:center;}
          .coupon-grid{grid-template-columns:1fr!important;}
        }
      `}</style>
      <Header />
      <main className="dash-main" style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 60px' }}>
        <div className="dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111827' }}>판매자 대시보드</h1>
          <Link href="/seller/programs/new" style={{ background: '#111827', color: '#fff', borderRadius: 12, padding: '10px 18px', fontSize: 14, fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            + 프로그램 등록
          </Link>
        </div>

        <div className="dash-tab-bar" style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #F0EDE8' }}>
          {TABS.map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)} className="dash-tab-btn"
              style={{ padding: '10px 18px', border: 'none', background: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: tab === v ? '#111827' : '#9CA3AF', borderBottom: `2px solid ${tab === v ? '#111827' : 'transparent'}`, marginBottom: -1, flexShrink: 0 }}>
              {l}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <div>불러오는 중...</div>
          </div>
        )}

        {/* ── 대시보드 ── */}
        {!loading && tab === 'overview' && (
          <>
            <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
              {KPI.map(k => (
                <div key={k.label} style={{ background: '#fff', borderRadius: 16, padding: '20px', border: '1px solid #F0EDE8' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{k.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#111827', marginBottom: 2 }}>{k.value}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>{k.label}</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>{k.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #F0EDE8', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: 0 }}>매출 트렌드</h2>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['daily', 'monthly'] as const).map(p => (
                    <button key={p} onClick={() => setChartPeriod(p)}
                      style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: chartPeriod === p ? '#111827' : '#F3F4F6', color: chartPeriod === p ? '#fff' : '#6B7280', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {p === 'daily' ? '일별' : '월별'}
                    </button>
                  ))}
                </div>
              </div>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="sellerGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#111827" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }}
                      tickFormatter={v => chartPeriod === 'daily' ? v.slice(5) : v} />
                    <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} width={36} />
                    <Tooltip formatter={(v) => [`${Number(v).toLocaleString()}원`, '매출']}
                      labelStyle={{ fontSize: 12 }} contentStyle={{ borderRadius: 10, border: '1px solid #F0EDE8', fontSize: 13 }} />
                    <Area type="monotone" dataKey="revenue" stroke="#111827" strokeWidth={2} fill="url(#sellerGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 14 }}>
                  아직 매출 데이터가 없습니다
                </div>
              )}
            </div>

            <div style={{ background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #F0EDE8' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 16 }}>최근 주문</h2>
              {orders.slice(0, 5).map(o => {
                const s = STATUS_STYLE[o.status] ?? STATUS_STYLE['paid']
                return (
                  <div key={o.id} className="recent-order-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F3F4F6' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{o.buyerName}</div>
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>{o.programTitle} · {formatDate(o.createdAt)}</div>
                    </div>
                    <div className="recent-order-right" style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{o.amount.toLocaleString()}원</span>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 6, background: s.bg, color: s.color }}>{s.label}</span>
                    </div>
                  </div>
                )
              })}
              {orders.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#9CA3AF', fontSize: 14 }}>아직 주문이 없습니다</div>
              )}
            </div>
          </>
        )}

        {/* ── 프로그램 ── */}
        {!loading && tab === 'programs' && (
          <div>
            {programs.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>등록된 프로그램이 없습니다</div>
                <Link href="/seller/programs/new" style={{ background: '#111827', color: '#fff', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                  첫 프로그램 등록하기
                </Link>
              </div>
            )}
            {programs.map(p => {
              const s = STATUS_STYLE[p.status] ?? STATUS_STYLE['draft']
              const icon = CATEGORY_ICON[p.category] ?? '📦'
              return (
                <div key={p.id} style={{ background: '#fff', borderRadius: 18, padding: 20, border: '1px solid #F0EDE8', marginBottom: 12, display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, overflow: 'hidden', flexShrink: 0, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {p.thumbnailUrl ? (
                      <img src={p.thumbnailUrl} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: 26 }}>{icon}</span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <Link href={`/programs/${p.id}`} style={{ fontSize: 15, fontWeight: 800, color: '#111827', textDecoration: 'none' }}>{p.title}</Link>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 5, background: s.bg, color: s.color }}>{s.label}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                      주문 {p.orderCount}건 · 수익 {p.revenue.toLocaleString()}원
                      {p.reviewCount > 0 && ` · ★${p.ratingAvg.toFixed(1)} (${p.reviewCount})`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>{p.price.toLocaleString()}원</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <Link href={`/seller/programs/${p.id}/files`} style={{ fontSize: 11, fontWeight: 700, background: '#F0F9FF', color: '#0369A1', borderRadius: 6, padding: '3px 8px', textDecoration: 'none' }}>
                        📁 파일 관리
                      </Link>
                      {p.status === 'active' && (
                        <button onClick={() => programAction(p.id, 'PATCH', { status: 'paused' })} disabled={actionLoading === p.id}
                          style={{ fontSize: 11, fontWeight: 700, background: '#FEF3C7', color: '#92400E', borderRadius: 6, padding: '3px 8px', border: 'none', cursor: 'pointer' }}>
                          ⏸ 일시중지
                        </button>
                      )}
                      {p.status === 'paused' && (
                        <button onClick={() => programAction(p.id, 'PATCH', { status: 'active' })} disabled={actionLoading === p.id}
                          style={{ fontSize: 11, fontWeight: 700, background: '#D1FAE5', color: '#065F46', borderRadius: 6, padding: '3px 8px', border: 'none', cursor: 'pointer' }}>
                          ▶ 재개
                        </button>
                      )}
                      {p.status !== 'deleted' && (
                        <button onClick={() => { if (confirm('정말 삭제하시겠습니까?')) programAction(p.id, 'DELETE') }} disabled={actionLoading === p.id}
                          style={{ fontSize: 11, fontWeight: 700, background: '#FEE2E2', color: '#991B1B', borderRadius: 6, padding: '3px 8px', border: 'none', cursor: 'pointer' }}>
                          🗑 삭제
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── 주문 내역 ── */}
        {!loading && tab === 'orders' && (
          <div className="table-wrap" style={{ background: '#fff', borderRadius: 20, border: '1px solid #F0EDE8', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  {['구매자', '프로그램', '날짜', '금액', '상태'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#9CA3AF', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: '40px 16px', textAlign: 'center', color: '#9CA3AF' }}>아직 주문이 없습니다</td></tr>
                )}
                {orders.map(o => {
                  const s = STATUS_STYLE[o.status] ?? STATUS_STYLE['paid']
                  return (
                    <tr key={o.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: '#111827' }}>{o.buyerName}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#6B7280' }}>{o.programTitle}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#9CA3AF' }}>{formatDate(o.createdAt)}</td>
                      <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 800, color: '#111827' }}>{o.amount.toLocaleString()}원</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 6, background: s.bg, color: s.color }}>{s.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── 리뷰 ── */}
        {!loading && tab === 'reviews' && (
          <div>
            {!reviewsLoaded && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>불러오는 중...</div>
            )}
            {reviewsLoaded && reviews.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
                <div>아직 리뷰가 없습니다</div>
              </div>
            )}
            {reviews.map(r => (
              <div key={r.id} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #F0EDE8', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {r.buyerImage
                        ? <img src={r.buyerImage} alt={r.buyerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                        : <span style={{ fontSize: 14, fontWeight: 700, color: '#6B7280' }}>{r.buyerName[0]}</span>}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{r.buyerName}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{formatDate(r.createdAt)}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Stars rating={r.rating} />
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                      <Link href={`/programs/${r.programId}`} style={{ color: '#6B7280', textDecoration: 'none' }}>{r.programTitle}</Link>
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>{r.content}</p>
                {r.photoUrls.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    {r.photoUrls.map((url, i) => (
                      <img key={i} src={url} alt="" style={{ width: 72, height: 72, borderRadius: 8, objectFit: 'cover' }} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── 문의 관리 ── */}
        {!loading && tab === 'inquiries' && (
          <div>
            {!inquiriesLoaded && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>불러오는 중...</div>
            )}
            {inquiriesLoaded && inquiries.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
                <div>아직 문의가 없습니다</div>
              </div>
            )}
            {inquiries.map(inq => {
              const s = STATUS_STYLE[inq.status] ?? STATUS_STYLE['open']
              const isOpen = replyOpen === inq.id
              return (
                <div key={inq.id} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #F0EDE8', marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 5, background: s.bg, color: s.color }}>{s.label}</span>
                        {inq.program && (
                          <Link href={`/programs/${inq.program.id}`} style={{ fontSize: 11, color: '#6B7280', textDecoration: 'none', background: '#F3F4F6', padding: '2px 8px', borderRadius: 5 }}>
                            {inq.program.title}
                          </Link>
                        )}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{inq.title}</div>
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>{inq.user.nickname} · {formatDate(inq.createdAt)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>{inq.replies.length}개 답변</span>
                      <button
                        onClick={() => { setReplyOpen(isOpen ? null : inq.id); setReplyContent('') }}
                        style={{ fontSize: 12, fontWeight: 700, background: '#111827', color: '#fff', borderRadius: 8, padding: '4px 12px', border: 'none', cursor: 'pointer' }}>
                        {isOpen ? '닫기' : '답변하기'}
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: '#374151', margin: '8px 0 0', lineHeight: 1.6, background: '#F9FAFB', borderRadius: 8, padding: '10px 12px' }}>{inq.content}</p>
                  {isOpen && (
                    <div style={{ marginTop: 12 }}>
                      <textarea
                        value={replyContent}
                        onChange={e => setReplyContent(e.target.value)}
                        placeholder="답변 내용을 입력하세요..."
                        rows={4}
                        style={{ width: '100%', borderRadius: 10, border: '1px solid #E5E7EB', padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                        <button onClick={() => { setReplyOpen(null); setReplyContent('') }}
                          style={{ fontSize: 13, fontWeight: 600, background: '#F3F4F6', color: '#6B7280', borderRadius: 8, padding: '6px 14px', border: 'none', cursor: 'pointer' }}>
                          취소
                        </button>
                        <button onClick={() => handleReply(inq.id)} disabled={replyLoading || !replyContent.trim()}
                          style={{ fontSize: 13, fontWeight: 700, background: '#111827', color: '#fff', borderRadius: 8, padding: '6px 14px', border: 'none', cursor: 'pointer', opacity: replyLoading || !replyContent.trim() ? 0.5 : 1 }}>
                          {replyLoading ? '전송 중...' : '답변 등록'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── 쿠폰 ── */}
        {!loading && tab === 'coupons' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button onClick={() => setShowCouponForm(v => !v)}
                style={{ background: '#111827', color: '#fff', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                {showCouponForm ? '✕ 닫기' : '+ 쿠폰 만들기'}
              </button>
            </div>

            {showCouponForm && (
              <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #F0EDE8', marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 16 }}>새 쿠폰 만들기</h3>
                <div className="coupon-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>할인 유형</label>
                    <select value={couponForm.type} onChange={e => setCouponForm(f => ({ ...f, type: e.target.value }))}
                      style={{ width: '100%', borderRadius: 8, border: '1px solid #E5E7EB', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit' }}>
                      <option value="fixed">정액 할인</option>
                      <option value="percent">비율 할인 (%)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>
                      할인값 {couponForm.type === 'fixed' ? '(원)' : '(%)'}
                    </label>
                    <input type="number" value={couponForm.discountValue} onChange={e => setCouponForm(f => ({ ...f, discountValue: e.target.value }))}
                      placeholder={couponForm.type === 'fixed' ? '예: 5000' : '예: 10'}
                      style={{ width: '100%', borderRadius: 8, border: '1px solid #E5E7EB', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>적용 범위</label>
                    <select value={couponForm.scope} onChange={e => setCouponForm(f => ({ ...f, scope: e.target.value }))}
                      style={{ width: '100%', borderRadius: 8, border: '1px solid #E5E7EB', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit' }}>
                      <option value="seller">내 모든 프로그램</option>
                      <option value="program">특정 프로그램</option>
                    </select>
                  </div>
                  {couponForm.scope === 'program' && (
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>프로그램 선택</label>
                      <select value={couponForm.programId} onChange={e => setCouponForm(f => ({ ...f, programId: e.target.value }))}
                        style={{ width: '100%', borderRadius: 8, border: '1px solid #E5E7EB', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit' }}>
                        <option value="">선택하세요</option>
                        {programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>최소 주문금액 (원, 선택)</label>
                    <input type="number" value={couponForm.minPrice} onChange={e => setCouponForm(f => ({ ...f, minPrice: e.target.value }))}
                      placeholder="예: 10000"
                      style={{ width: '100%', borderRadius: 8, border: '1px solid #E5E7EB', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                  {couponForm.type === 'percent' && (
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>최대 할인금액 (원, 선택)</label>
                      <input type="number" value={couponForm.maxDiscount} onChange={e => setCouponForm(f => ({ ...f, maxDiscount: e.target.value }))}
                        placeholder="예: 10000"
                        style={{ width: '100%', borderRadius: 8, border: '1px solid #E5E7EB', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                    </div>
                  )}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>총 사용 한도 (선택)</label>
                    <input type="number" value={couponForm.usageLimit} onChange={e => setCouponForm(f => ({ ...f, usageLimit: e.target.value }))}
                      placeholder="비워두면 무제한"
                      style={{ width: '100%', borderRadius: 8, border: '1px solid #E5E7EB', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>인당 사용 횟수</label>
                    <input type="number" value={couponForm.perUserLimit} onChange={e => setCouponForm(f => ({ ...f, perUserLimit: e.target.value }))}
                      min={1}
                      style={{ width: '100%', borderRadius: 8, border: '1px solid #E5E7EB', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>만료일 (선택)</label>
                    <input type="date" value={couponForm.expiresAt} onChange={e => setCouponForm(f => ({ ...f, expiresAt: e.target.value }))}
                      style={{ width: '100%', borderRadius: 8, border: '1px solid #E5E7EB', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>쿠폰 설명 (선택)</label>
                    <input type="text" value={couponForm.description} onChange={e => setCouponForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="예: 신규 가입 감사 쿠폰"
                      style={{ width: '100%', borderRadius: 8, border: '1px solid #E5E7EB', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                </div>
                {couponError && <div style={{ color: '#EF4444', fontSize: 13, marginTop: 10 }}>{couponError}</div>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                  <button onClick={handleCouponSubmit} disabled={couponLoading}
                    style={{ background: '#111827', color: '#fff', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', opacity: couponLoading ? 0.6 : 1 }}>
                    {couponLoading ? '생성 중...' : '쿠폰 생성'}
                  </button>
                </div>
              </div>
            )}

            {!couponsLoaded && <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>불러오는 중...</div>}
            {couponsLoaded && coupons.length === 0 && !showCouponForm && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎟</div>
                <div>생성된 쿠폰이 없습니다</div>
              </div>
            )}
            {coupons.map(c => (
              <div key={c.id} style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', border: '1px solid #F0EDE8', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#111827', fontFamily: 'monospace', background: '#F3F4F6', padding: '2px 8px', borderRadius: 6 }}>{c.code}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, background: c.isActive ? '#D1FAE5' : '#F3F4F6', color: c.isActive ? '#065F46' : '#6B7280', borderRadius: 5, padding: '2px 7px' }}>
                      {c.isActive ? '활성' : '비활성'}
                    </span>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>{c.scope === 'program' ? '특정 프로그램' : '내 전체 상품'}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 2 }}>
                    {c.type === 'fixed' ? `${c.discountValue.toLocaleString()}원 할인` : `${c.discountValue}% 할인`}
                    {c.maxDiscount && ` (최대 ${c.maxDiscount.toLocaleString()}원)`}
                    {c.minPrice > 0 && <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}> · {c.minPrice.toLocaleString()}원 이상 구매 시</span>}
                  </div>
                  {c.description && <div style={{ fontSize: 12, color: '#6B7280' }}>{c.description}</div>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>
                    {c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ''} 사용
                  </div>
                  {c.expiresAt && (
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                      ~{formatDate(c.expiresAt)}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>인당 {c.perUserLimit}회</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── 정산 ── */}
        {!loading && tab === 'settlements' && stats && (
          <div>
            <div className="settle-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                ['정산 예정', `₩${Math.floor(stats.monthRevenue * 0.9).toLocaleString()}`, '이번달 말 (수수료 10% 제외)'],
                ['정산 완료', `₩${Math.floor(stats.totalRevenue * 0.9).toLocaleString()}`, '누적 (수수료 10% 제외)'],
              ].map(([l, v, s]) => (
                <div key={l} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #F0EDE8' }}>
                  <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>{l}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#111827', marginBottom: 2 }}>{v}</div>
                  <div style={{ fontSize: 11, color: '#6B7280' }}>{s}</div>
                </div>
              ))}
            </div>
            <div style={{ background: '#FEF3C7', borderRadius: 12, padding: '14px 16px', fontSize: 13, color: '#92400E', fontWeight: 600 }}>
              ⚠️ 수수료 10% 제외 후 정산 · 구매 확정 후 7영업일 이내 입금
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
