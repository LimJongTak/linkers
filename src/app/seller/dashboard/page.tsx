'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { useAuth } from '@/store/auth'
import { PROGRAMS } from '@/store/data'

const MY_PROGRAMS = [
  { ...PROGRAMS[0], status: 'active',  sales: 12, revenue: 1800000 },
  { ...PROGRAMS[6], status: 'pending', sales: 0,  revenue: 0 },
]
const ORDERS = [
  { id: 'o1', buyer: '서울 한강중 학생부', program: PROGRAMS[0].title, date: '2025.03.01', amount: 150000, status: 'confirmed' },
  { id: 'o2', buyer: '경기 분당초 담임교사', program: PROGRAMS[0].title, date: '2025.02.20', amount: 150000, status: 'paid' },
  { id: 'o3', buyer: '인천 계양중 교무처', program: PROGRAMS[0].title, date: '2025.02.10', amount: 150000, status: 'confirmed' },
]
const STATUS_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  active:   { label: '판매중',  bg: '#D1FAE5', color: '#065F46' },
  pending:  { label: '검수중',  bg: '#FEF3C7', color: '#92400E' },
  paused:   { label: '일시중지', bg: '#F3F4F6', color: '#6B7280' },
  confirmed:{ label: '진행완료', bg: '#D1FAE5', color: '#065F46' },
  paid:     { label: '결제완료', bg: '#DBEAFE', color: '#1E40AF' },
}

export default function SellerDashboardPage() {
  const { user } = useAuth()
  const router   = useRouter()
  const [tab, setTab] = useState<'overview'|'programs'|'orders'|'settlements'>('overview')

  useEffect(() => {
    if (!user) router.replace('/login')
    else if (user.role === 'buyer') router.replace('/seller/programs/new')
  }, [user, router])
  if (!user) return null

  const KPI = [
    { label: '이번달 수익', value: '₩1,800,000', sub: '+12% vs 지난달', icon: '💰' },
    { label: '등록 프로그램', value: '2개', sub: '1개 판매중', icon: '📦' },
    { label: '총 주문', value: '15건', sub: '이번달 3건', icon: '📋' },
    { label: '평균 별점', value: '4.9 ★', sub: '38개 리뷰', icon: '⭐' },
  ]

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <Header />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 60px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111827' }}>판매자 대시보드</h1>
          <Link href="/seller/programs/new" style={{ background: '#111827', color: '#fff', borderRadius: 12, padding: '10px 18px', fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>
            + 프로그램 등록
          </Link>
        </div>

        {/* 탭 */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #F0EDE8', paddingBottom: 0 }}>
          {[['overview','대시보드'],['programs','프로그램'],['orders','주문 내역'],['settlements','정산']] .map(([v,l]) => (
            <button key={v} onClick={() => setTab(v as any)} style={{ padding: '10px 18px', border: 'none', background: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: tab===v?'#111827':'#9CA3AF', borderBottom: `2px solid ${tab===v?'#111827':'transparent'}`, marginBottom: -1 }}>
              {l}
            </button>
          ))}
        </div>

        {/* 대시보드 */}
        {tab === 'overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
              {KPI.map(k => (
                <div key={k.label} style={{ background: '#fff', borderRadius: 16, padding: '20px', border: '1px solid #F0EDE8' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{k.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#111827', marginBottom: 2 }}>{k.value}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>{k.label}</div>
                  <div style={{ fontSize: 11, color: '#10B981', marginTop: 4 }}>{k.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #F0EDE8' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 16 }}>최근 주문</h2>
              {ORDERS.slice(0, 3).map(o => {
                const s = STATUS_STYLE[o.status]
                return (
                  <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F3F4F6' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{o.buyer}</div>
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>{o.program} · {o.date}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{o.amount.toLocaleString()}원</span>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 6, background: s.bg, color: s.color }}>{s.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* 프로그램 관리 */}
        {tab === 'programs' && (
          <div>
            {MY_PROGRAMS.map(p => {
              const s = STATUS_STYLE[p.status]
              return (
                <div key={p.id} style={{ background: '#fff', borderRadius: 18, padding: 20, border: '1px solid #F0EDE8', marginBottom: 12, display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{p.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <Link href={`/programs/${p.id}`} style={{ fontSize: 15, fontWeight: 800, color: '#111827', textDecoration: 'none' }}>{p.title}</Link>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 5, background: s.bg, color: s.color }}>{s.label}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>주문 {p.sales}건 · 수익 {p.revenue.toLocaleString()}원</div>
                  </div>
                  <button style={{ background: '#F3F4F6', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#374151' }}>수정</button>
                </div>
              )
            })}
          </div>
        )}

        {/* 주문 내역 */}
        {tab === 'orders' && (
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #F0EDE8', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  {['구매자','프로그램','날짜','금액','상태'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#9CA3AF', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ORDERS.map(o => {
                  const s = STATUS_STYLE[o.status]
                  return (
                    <tr key={o.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: '#111827' }}>{o.buyer}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#6B7280' }}>{o.program}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#9CA3AF' }}>{o.date}</td>
                      <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 800, color: '#111827' }}>{o.amount.toLocaleString()}원</td>
                      <td style={{ padding: '14px 16px' }}><span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 6, background: s.bg, color: s.color }}>{s.label}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 정산 */}
        {tab === 'settlements' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[['정산 예정', '₩1,620,000', '이번달 말'], ['정산 완료', '₩8,400,000', '누적']].map(([l,v,s])=>(
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
