'use client'

import Link from 'next/link'
import Header from '@/components/layout/Header'
import { SELLERS, PROGRAMS } from '@/store/data'

export default function SellersPage() {
  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <Header />

      {/* 히어로 */}
      <section style={{ background: 'linear-gradient(135deg, #111827, #1F2D45)', padding: '44px 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'rgba(79,195,247,0.15)', color: '#4FC3F7', fontSize: 12, fontWeight: 800, padding: '5px 14px', borderRadius: 20, marginBottom: 14 }}>인기 판매자</div>
        <h1 style={{ fontSize: 'clamp(22px,4vw,34px)', fontWeight: 900, color: '#fff', marginBottom: 10 }}>검증된 대학생 판매자</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>직접 진행하고 리뷰로 검증받은 신뢰할 수 있는 판매자들</p>
      </section>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 24px 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {SELLERS.map(s => {
            const sellerPrograms = PROGRAMS.filter(p => p.seller === s.name)
            return (
              <div key={s.id} style={{ background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #F0EDE8', transition: 'box-shadow 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.10)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                {/* 헤더 */}
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #667EEA, #764BA2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{s.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{s.name}</span>
                      {s.badge && <span style={{ fontSize: 10, background: '#111827', color: '#fff', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>{s.badge}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>{s.university}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>{s.major}</div>
                  </div>
                </div>

                <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #F3F4F6' }}>{s.bio}</p>

                {/* 통계 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
                  {[['프로그램', s.programs + '개'], ['리뷰', s.totalReviews + '개'], ['평점', '★ ' + s.rating]].map(([k, v]) => (
                    <div key={k} style={{ background: '#F9FAFB', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>{k}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* 프로그램 목록 */}
                {sellerPrograms.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', marginBottom: 8 }}>등록 프로그램</div>
                    {sellerPrograms.slice(0, 2).map(p => (
                      <Link key={p.id} href={`/programs/${p.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#F9FAFB', borderRadius: 10, marginBottom: 6, textDecoration: 'none', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F0F0F0')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#F9FAFB')}>
                        <span style={{ fontSize: 20 }}>{p.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                          <div style={{ fontSize: 11, color: '#9CA3AF' }}>{p.price === 0 ? '무료' : p.price.toLocaleString() + '원'} · ★ {p.rating}</div>
                        </div>
                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>→</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
