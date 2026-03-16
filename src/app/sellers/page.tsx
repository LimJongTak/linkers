'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'

const catIcon = (c: string) => ({ '레크리에이션': '🎯', '교육': '📚', '진로': '🔭', '예체능': '🎨', '재능봉사': '🤝' }[c] ?? '📄')
const catGrad = (c: string) => ({ '레크리에이션': '#E0F2FE,#BAE6FD', '교육': '#EDE9FE,#DDD6FE', '진로': '#FEF3C7,#FDE68A', '예체능': '#FCE7F3,#FBCFE8', '재능봉사': '#D1FAE5,#A7F3D0' }[c] ?? '#F3F4F6,#E5E7EB')

interface SellerProgram {
  id: string
  title: string
  category: string
  price: number
  rating: number
  reviewCount: number
  thumbnailUrl: string | null
  productType: string
}

interface Seller {
  id: string
  nickname: string
  profileImage: string | null
  programCount: number
  totalReviews: number
  avgRating: number
  joinedAt: string
  programs: SellerProgram[]
}

function avatarInitial(name: string) {
  return name.charAt(0).toUpperCase()
}

// 닉네임 기반 고정 그라디언트 색상
const GRADIENTS = [
  '#667EEA,#764BA2', '#F093FB,#F5576C', '#4FACFE,#00F2FE',
  '#43E97B,#38F9D7', '#FA709A,#FEE140', '#A18CD1,#FBC2EB',
  '#FCCB90,#D57EEB', '#A1C4FD,#C2E9FB',
]
function avatarGrad(id: string) {
  const idx = id.charCodeAt(0) % GRADIENTS.length
  return GRADIENTS[idx]
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 가입`
}

export default function SellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/sellers')
      .then(r => r.json())
      .then(d => setSellers(d.sellers ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <style>{`
        @media(max-width:640px){
          .sellers-hero{padding:32px 16px!important;}
          .sellers-main{padding:20px 16px 60px!important;}
          .seller-grid{grid-template-columns:1fr!important;}
        }
        .prog-link{transition:background 0.15s;}
        .prog-link:hover{background:#F0F0F0!important;}
        .seller-card{transition:box-shadow 0.2s;}
        .seller-card:hover{box-shadow:0 8px 32px rgba(0,0,0,0.10);}
      `}</style>
      <Header />

      {/* 히어로 */}
      <section className="sellers-hero" style={{ background: 'linear-gradient(135deg, #111827, #1F2D45)', padding: '44px 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'rgba(79,195,247,0.15)', color: '#4FC3F7', fontSize: 12, fontWeight: 800, padding: '5px 14px', borderRadius: 20, marginBottom: 14 }}>인기 판매자</div>
        <h1 style={{ fontSize: 'clamp(22px,4vw,34px)', fontWeight: 900, color: '#fff', marginBottom: 10 }}>검증된 판매자</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>직접 진행하고 리뷰로 검증받은 신뢰할 수 있는 판매자들</p>
        {!loading && (
          <div style={{ marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
            총 {sellers.length}명의 판매자
          </div>
        )}
      </section>

      <main className="sellers-main" style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 24px 60px' }}>
        {loading ? (
          <div className="seller-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #F0EDE8' }}>
                <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 16, borderRadius: 6, background: 'linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', marginBottom: 8 }} />
                    <div style={{ height: 12, width: '60%', borderRadius: 6, background: 'linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
                  </div>
                </div>
                <div style={{ height: 60, borderRadius: 10, background: 'linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
              </div>
            ))}
          </div>
        ) : sellers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9CA3AF' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>등록된 판매자가 없습니다</div>
            <div style={{ fontSize: 14 }}>아직 활성 프로그램을 등록한 판매자가 없어요</div>
          </div>
        ) : (
          <div className="seller-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {sellers.map((s, rank) => (
              <div key={s.id} className="seller-card" style={{ background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #F0EDE8', position: 'relative' }}>
                <Link href={`/sellers/${s.id}`} style={{ position: 'absolute', top: 14, right: 14, fontSize: 12, color: '#4F46E5', fontWeight: 700, textDecoration: 'none', background: '#EDE9FE', padding: '4px 10px', borderRadius: 8 }}>프로필 보기 →</Link>
                {/* 헤더 */}
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
                  {/* 아바타 */}
                  <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                    {s.profileImage ? (
                      <img src={s.profileImage} alt={s.nickname} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg,${avatarGrad(s.id)})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#fff', fontWeight: 900 }}>
                        {avatarInitial(s.nickname)}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{s.nickname}</span>
                      {rank === 0 && (
                        <span style={{ fontSize: 10, background: '#F59E0B', color: '#fff', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>🏆 TOP 1</span>
                      )}
                      {rank === 1 && (
                        <span style={{ fontSize: 10, background: '#9CA3AF', color: '#fff', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>🥈 TOP 2</span>
                      )}
                      {rank === 2 && (
                        <span style={{ fontSize: 10, background: '#CD7F32', color: '#fff', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>🥉 TOP 3</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>{formatDate(s.joinedAt)}</div>
                  </div>
                </div>

                {/* 통계 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #F3F4F6' }}>
                  {[
                    ['프로그램', `${s.programCount}개`],
                    ['리뷰', `${s.totalReviews}개`],
                    ['평점', s.avgRating > 0 ? `★ ${s.avgRating.toFixed(1)}` : '–'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ background: '#F9FAFB', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>{k}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* 프로그램 목록 */}
                {s.programs.length > 0 ? (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', marginBottom: 8 }}>등록 프로그램</div>
                    {s.programs.slice(0, 2).map(p => (
                      <Link key={p.id} href={`/programs/${p.id}`} className="prog-link"
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#F9FAFB', borderRadius: 10, marginBottom: 6, textDecoration: 'none' }}>
                        {/* 썸네일 or 카테고리 아이콘 */}
                        <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: `linear-gradient(135deg,${catGrad(p.category)})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {p.thumbnailUrl ? (
                            <img src={p.thumbnailUrl} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: 18 }}>{catIcon(p.category)}</span>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                          <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                            {p.price === 0 ? '무료' : `${p.price.toLocaleString()}원`}
                            {p.rating > 0 && ` · ★ ${p.rating.toFixed(1)}`}
                            {p.reviewCount > 0 && ` (${p.reviewCount})`}
                          </div>
                        </div>
                        <span style={{ fontSize: 12, color: '#9CA3AF', flexShrink: 0 }}>→</span>
                      </Link>
                    ))}
                    {s.programCount > 2 && (
                      <div style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', paddingTop: 4 }}>
                        외 {s.programCount - 2}개 더
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: '#D1D5DB', textAlign: 'center', padding: '12px 0' }}>등록된 프로그램이 없습니다</div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <style>{`
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
      `}</style>
    </div>
  )
}
