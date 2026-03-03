'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { useAuth } from '@/store/auth'
import { PROGRAMS, SELLERS } from '@/store/data'

export default function AdminPage() {
  const { user } = useAuth()
  const router   = useRouter()
  const [tab, setTab] = useState<'dash'|'programs'|'users'|'settlements'>('dash')
  const [approving, setApproving] = useState<string | null>(null)
  const [approved, setApproved]   = useState<string[]>([])

  useEffect(() => {
    if (!user) router.replace('/login')
    else if (user.role !== 'admin') router.replace('/')
  }, [user, router])
  if (!user || user.role !== 'admin') return null

  const PENDING = PROGRAMS.filter(p => p.id === '3' || p.id === '4').filter(p => !approved.includes(p.id))

  const handleApprove = (id: string) => {
    setApproving(id)
    setTimeout(() => { setApproved(a => [...a, id]); setApproving(null) }, 1000)
  }

  const KPI = [
    { label: '총 거래액', value: '₩18,240,000', icon: '💰', color: '#D1FAE5' },
    { label: '활성 프로그램', value: '142개', icon: '📦', color: '#DBEAFE' },
    { label: '전체 회원', value: '2,847명', icon: '👥', color: '#EDE9FE' },
    { label: '검수 대기', value: PENDING.length + '건', icon: '⏳', color: '#FEF3C7' },
  ]

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <style>{`
        @media(max-width:640px){
          .admin-main{padding:20px 16px 60px!important;}
          .admin-tab-bar{overflow-x:auto;-webkit-overflow-scrolling:touch;}
          .admin-tab-bar::-webkit-scrollbar{display:none;}
          .admin-tab-btn{white-space:nowrap;padding:10px 12px!important;font-size:13px!important;}
          .admin-kpi-grid{grid-template-columns:1fr 1fr!important;}
          .admin-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;}
          .admin-table-wrap table{min-width:520px;}
          .admin-settle-grid{grid-template-columns:1fr!important;}
          .approve-row{flex-wrap:wrap;gap:12px!important;}
          .approve-actions{width:100%;display:flex;justify-content:flex-end;gap:8px;}
          .settle-row{flex-wrap:wrap;gap:10px!important;}
          .settle-row-amount{order:3;}
          .settle-row-btn{margin-left:auto;}
        }
      `}</style>
      <Header />
      <main className="admin-main" style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 60px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111827', marginBottom: 2 }}>관리자 콘솔</h1>
            <div style={{ fontSize: 13, color: '#9CA3AF' }}>링커스 운영 현황</div>
          </div>
          <span style={{ background: '#7C3AED', color: '#fff', fontSize: 11, fontWeight: 800, padding: '5px 12px', borderRadius: 8, flexShrink: 0 }}>ADMIN</span>
        </div>

        {/* 탭 */}
        <div className="admin-tab-bar" style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #F0EDE8' }}>
          {[['dash','대시보드'],['programs','프로그램 검수'],['users','회원 관리'],['settlements','정산 처리']].map(([v,l]) => (
            <button key={v} onClick={() => setTab(v as any)} className="admin-tab-btn" style={{ padding: '10px 18px', border: 'none', background: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: tab===v?'#111827':'#9CA3AF', borderBottom: `2px solid ${tab===v?'#111827':'transparent'}`, marginBottom: -1, flexShrink: 0 }}>
              {l}
            </button>
          ))}
        </div>

        {/* 대시보드 */}
        {tab === 'dash' && (
          <>
            <div className="admin-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
              {KPI.map(k => (
                <div key={k.label} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #F0EDE8', cursor: k.label==='검수 대기'?'pointer':'default' }} onClick={() => k.label==='검수 대기' && setTab('programs')}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: k.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 12 }}>{k.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#111827', marginBottom: 2 }}>{k.value}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>{k.label}</div>
                </div>
              ))}
            </div>
            {PENDING.length > 0 && (
              <div style={{ background: '#FEF3C7', borderRadius: 14, padding: '16px 20px', border: '1px solid #FDE68A' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#92400E', marginBottom: 4 }}>⚠️ 긴급 처리 필요</div>
                <div style={{ fontSize: 13, color: '#78350F' }}>프로그램 검수 {PENDING.length}건이 대기 중입니다.
                  <button onClick={() => setTab('programs')} style={{ background: 'none', border: 'none', color: '#D97706', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, marginLeft: 4 }}>검수하기 →</button>
                </div>
              </div>
            )}
          </>
        )}

        {/* 프로그램 검수 */}
        {tab === 'programs' && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 16 }}>검수 대기 ({PENDING.length}건)</h2>
            {PENDING.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 16, padding: '40px', textAlign: 'center', border: '1px solid #F0EDE8' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#374151' }}>모든 프로그램 검수 완료!</div>
              </div>
            ) : PENDING.map(p => (
              <div key={p.id} className="approve-row" style={{ background: '#fff', borderRadius: 18, padding: 20, border: '1px solid #F0EDE8', marginBottom: 12, display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{p.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 2 }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>{p.seller} · {p.university} · {p.price.toLocaleString()}원</div>
                </div>
                <div className="approve-actions" style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => handleApprove(p.id)} disabled={approving === p.id} style={{ background: approving===p.id?'#9CA3AF':'#111827', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 800, cursor: approving===p.id?'not-allowed':'pointer', fontFamily: 'inherit' }}>
                    {approving === p.id ? '처리중...' : '✅ 승인'}
                  </button>
                  <button style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 10, padding: '9px 14px', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>❌ 반려</button>
                </div>
              </div>
            ))}

            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 16, marginTop: 28 }}>전체 프로그램</h2>
            {PROGRAMS.slice(0, 5).map(p => (
              <div key={p.id} style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', border: '1px solid #F0EDE8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 22 }}>{p.icon}</span>
                <div style={{ flex: 1 }}>
                  <Link href={`/programs/${p.id}`} style={{ fontSize: 14, fontWeight: 700, color: '#111827', textDecoration: 'none' }}>{p.title}</Link>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>{p.seller} · ★{p.rating} · 리뷰 {p.reviewCount}개</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 6, background: '#D1FAE5', color: '#065F46' }}>판매중</span>
              </div>
            ))}
          </div>
        )}

        {/* 회원 관리 */}
        {tab === 'users' && (
          <div className="admin-table-wrap" style={{ background: '#fff', borderRadius: 20, border: '1px solid #F0EDE8', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  {['이름','소속','역할','가입일','상태'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#9CA3AF', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SELLERS.map(s => (
                  <tr key={s.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 20 }}>{s.avatar}</span>{s.name}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#6B7280' }}>{s.university}</td>
                    <td style={{ padding: '14px 16px' }}><span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 6, background: '#EDE9FE', color: '#5B21B6' }}>판매자</span></td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#9CA3AF' }}>2025.01.01</td>
                    <td style={{ padding: '14px 16px' }}><span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 6, background: '#D1FAE5', color: '#065F46' }}>정상</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 정산 처리 */}
        {tab === 'settlements' && (
          <div>
            <div className="admin-settle-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[['정산 대기', '₩3,420,000', '7건'], ['이번달 정산 완료', '₩12,840,000', '38건']].map(([l,v,c]) => (
                <div key={l} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #F0EDE8' }}>
                  <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>{l}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#111827', marginBottom: 2 }}>{v}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{c}</div>
                </div>
              ))}
            </div>
            {SELLERS.slice(0, 3).map(s => (
              <div key={s.id} className="settle-row" style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', border: '1px solid #F0EDE8', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>{s.avatar}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>{s.university} · 수익 {(s.totalReviews * 10000).toLocaleString()}원</div>
                </div>
                <div className="settle-row-amount" style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#111827' }}>{(s.totalReviews * 9000).toLocaleString()}원</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>수수료 10% 제외</div>
                </div>
                <button className="settle-row-btn" style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>입금 처리</button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
