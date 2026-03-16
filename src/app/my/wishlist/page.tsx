'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { useAuth } from '@/store/auth'

const fmt = (n: number) => n === 0 ? '무료' : `${n.toLocaleString()}원`
const catGrad = (c: string) => ({ '레크리에이션': '#E0F2FE,#BAE6FD', '교육': '#EDE9FE,#DDD6FE', '진로': '#FEF3C7,#FDE68A', '예체능': '#FCE7F3,#FBCFE8', '재능봉사': '#D1FAE5,#A7F3D0' }[c] ?? '#F3F4F6,#E5E7EB')
const catIcon = (c: string) => ({ '레크리에이션': '🎯', '교육': '📚', '진로': '🔭', '예체능': '🎨', '재능봉사': '🤝' }[c] ?? '📄')

interface WishProgram {
  id: string
  product_type: 'file_product' | 'class'
  title: string
  subtitle: string | null
  category: string
  target_levels: string[]
  price: number
  file_format: string | null
  page_count: number | null
  duration: string | null
  rating_avg: string
  review_count: number
  thumbnail_url: string | null
  seller: { id: string; nickname: string; profile_image: string | null }
}

export default function WishlistPage() {
  const { user, accessToken } = useAuth()
  const router = useRouter()
  const [programs, setPrograms] = useState<WishProgram[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.replace('/login'); return }
    fetch('/api/my/wishlist', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.ok ? r.json() : { programs: [] })
      .then(d => setPrograms(d.programs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user, accessToken, router])

  const removeWish = async (programId: string) => {
    setPrograms(prev => prev.filter(p => p.id !== programId))
    await fetch('/api/my/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ programId }),
    }).catch(() => {})
  }

  if (!user) return null

  return (
    <div style={{ fontFamily: "'Pretendard Variable',Pretendard,-apple-system,sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        .pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;}
        .skeleton{background:linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @media(max-width:640px){
          .wish-main{padding:20px 16px 60px!important;}
          .pgrid{grid-template-columns:1fr;}
        }
      `}</style>

      <Header />

      <main className="wish-main" style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Link href="/my" style={{ fontSize: 13, color: '#6B7280', textDecoration: 'none' }}>← 마이페이지</Link>
        </div>

        <div style={{ fontSize: 22, fontWeight: 900, color: '#111827', marginBottom: 20 }}>
          ❤️ 찜 목록 <span style={{ fontSize: 16, color: '#9CA3AF', fontWeight: 600 }}>({programs.length}개)</span>
        </div>

        {loading ? (
          <div className="pgrid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 16, border: '1px solid #F0EDE8', overflow: 'hidden' }}>
                <div className="skeleton" style={{ height: 120 }} />
                <div style={{ padding: 14 }}>
                  <div className="skeleton" style={{ height: 16, borderRadius: 6, marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 12, borderRadius: 6, width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : programs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9CA3AF' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🤍</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>찜한 자료가 없어요</div>
            <div style={{ fontSize: 14, marginBottom: 24 }}>마음에 드는 자료에 ♡를 눌러 찜해보세요</div>
            <Link href="/" style={{ display: 'inline-block', background: '#111827', color: '#fff', textDecoration: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 800 }}>
              자료 둘러보기 →
            </Link>
          </div>
        ) : (
          <div className="pgrid">
            {programs.map(p => {
              const rating = parseFloat(p.rating_avg) || 0
              const isFile = p.product_type === 'file_product'
              return (
                <div key={p.id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #F0EDE8', overflow: 'hidden', position: 'relative' }}>
                  {/* 찜 해제 버튼 */}
                  <button
                    onClick={() => removeWish(p.id)}
                    title="찜 해제"
                    style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, backdropFilter: 'blur(4px)' }}>
                    ❤️
                  </button>
                  <Link href={`/programs/${p.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                    <div style={{ height: 120, position: 'relative', overflow: 'hidden' }}>
                      {p.thumbnail_url ? (
                        <img src={p.thumbnail_url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg,${catGrad(p.category)})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
                          {catIcon(p.category)}
                        </div>
                      )}
                      <span style={{ position: 'absolute', top: 8, left: 8, background: isFile ? 'rgba(3,105,161,0.9)' : 'rgba(91,33,182,0.9)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 4 }}>
                        {isFile ? '📄 파일' : '🎓 강의'}
                      </span>
                    </div>
                    <div style={{ padding: '12px 14px 14px' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', lineHeight: 1.35, marginBottom: 4 }}>{p.title}</div>
                      {p.subtitle && <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>{p.subtitle}</div>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'linear-gradient(135deg,#667EEA,#764BA2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', fontWeight: 800 }}>
                          {p.seller.nickname[0]}
                        </div>
                        <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>{p.seller.nickname}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 15, fontWeight: 900, color: p.price === 0 ? '#10B981' : '#111827' }}>{fmt(p.price)}</span>
                        {rating > 0 && <span style={{ fontSize: 12, color: '#F59E0B', fontWeight: 700 }}>★ {rating.toFixed(1)} <span style={{ color: '#9CA3AF', fontWeight: 400 }}>({p.review_count})</span></span>}
                      </div>
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
