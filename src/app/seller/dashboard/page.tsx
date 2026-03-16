'use client'

import { useEffect, useState } from 'react'
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR')
}

export default function SellerDashboardPage() {
  const { user, accessToken } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<'overview' | 'programs' | 'orders' | 'settlements'>('overview')
  const [programs, setPrograms] = useState<Program[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [chartData, setChartData] = useState<{ date: string; revenue: number; orders: number }[]>([])
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'monthly'>('daily')

  const programAction = async (id: string, method: string, body?: object) => {
    if (!accessToken) return
    setActionLoading(id)
    try {
      await fetch(`/api/seller/programs/${id}`, {
        method,
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        ...(body ? { body: JSON.stringify(body) } : {}),
      })
      // refresh
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

  if (!user) return null

  const KPI = stats ? [
    { label: '이번달 수익', value: `₩${stats.monthRevenue.toLocaleString()}`, sub: `총 ${stats.totalRevenue.toLocaleString()}원`, icon: '💰' },
    { label: '등록 프로그램', value: `${stats.totalPrograms}개`, sub: `${stats.activePrograms}개 판매중`, icon: '📦' },
    { label: '총 주문', value: `${stats.totalOrders}건`, sub: `이번달 ${stats.monthOrders}건`, icon: '📋' },
    { label: '평균 별점', value: `${stats.avgRating.toFixed(1)} ★`, sub: `${stats.totalReviews}개 리뷰`, icon: '⭐' },
  ] : []

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
          {[['overview', '대시보드'], ['programs', '프로그램'], ['orders', '주문 내역'], ['settlements', '정산']].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v as any)} className="dash-tab-btn"
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
            {/* 매출 차트 */}
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
                    <Tooltip formatter={(v: number) => [`${v.toLocaleString()}원`, '매출']}
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
