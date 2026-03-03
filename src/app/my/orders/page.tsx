'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { useAuth } from '@/store/auth'
import { PROGRAMS } from '@/store/data'

const STATUS_LABEL: Record<string, { label: string; bg: string; color: string }> = {
  confirmed: { label: '진행완료', bg: '#D1FAE5', color: '#065F46' },
  paid:      { label: '결제완료', bg: '#DBEAFE', color: '#1E40AF' },
  pending:   { label: '대기중',   bg: '#FEF3C7', color: '#92400E' },
  refunded:  { label: '환불완료', bg: '#FEE2E2', color: '#991B1B' },
}

const DEMO_ORDERS = [
  { id: 'o1', program: PROGRAMS[0], orderNumber: 'LK-20250301-0001', date: '2025.03.01', amount: 150000, status: 'confirmed', scheduledAt: '2025.03.15 오전 10:00' },
  { id: 'o2', program: PROGRAMS[4], orderNumber: 'LK-20250228-0012', date: '2025.02.28', amount: 180000, status: 'paid',      scheduledAt: '2025.03.20 오후 2:00' },
  { id: 'o3', program: PROGRAMS[2], orderNumber: 'LK-20250220-0008', date: '2025.02.20', amount: 200000, status: 'pending',   scheduledAt: '협의 중' },
]

export default function MyOrdersPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => { if (!user) router.replace('/login') }, [user, router])
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

        {DEMO_ORDERS.map(o => {
          const s = STATUS_LABEL[o.status]
          return (
            <div key={o.id} style={{ background: '#fff', borderRadius: 18, padding: 20, border: '1px solid #F0EDE8', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div className="order-number" style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 2 }}>{o.orderNumber} · {o.date}</div>
                  <div style={{ fontSize: 11, color: '#6B7280' }}>진행 예정: {o.scheduledAt}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 7, background: s.bg, color: s.color, flexShrink: 0 }}>{s.label}</span>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{o.program.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/programs/${o.program.id}`} style={{ fontSize: 15, fontWeight: 800, color: '#111827', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.program.title}</Link>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>{o.program.seller} · {o.program.university}</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#111827', flexShrink: 0 }}>{o.amount.toLocaleString()}원</div>
              </div>

              {o.status === 'confirmed' && (
                <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                  <Link href="/my/downloads" style={{ flex: 1, background: '#111827', color: '#fff', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>자료 다운로드</Link>
                  <button style={{ flex: 1, background: '#F9FAFB', color: '#374151', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>리뷰 작성</button>
                </div>
              )}
            </div>
          )
        })}
      </main>
    </div>
  )
}
