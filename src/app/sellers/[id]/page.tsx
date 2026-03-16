'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'

const fmt = (n: number) => n === 0 ? '무료' : `${n.toLocaleString()}원`
const catGrad = (c: string) => ({ '레크리에이션': '#E0F2FE,#BAE6FD', '교육': '#EDE9FE,#DDD6FE', '진로': '#FEF3C7,#FDE68A', '예체능': '#FCE7F3,#FBCFE8', '재능봉사': '#D1FAE5,#A7F3D0' }[c] ?? '#F3F4F6,#E5E7EB')
const catIcon = (c: string) => ({ '레크리에이션': '🎯', '교육': '📚', '진로': '🔭', '예체능': '🎨', '재능봉사': '🤝' }[c] ?? '📄')

interface SellerProgram {
  id: string
  product_type: 'file_product' | 'class'
  title: string
  subtitle: string | null
  category: string
  price: number
  rating_avg: string
  review_count: number
  thumbnail_url: string | null
}

interface SellerProfile {
  id: string
  nickname: string
  profileImage: string | null
  joinedAt: string
  programCount: number
  totalReviews: number
  avgRating: number
  programs: SellerProgram[]
}

export default function SellerProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [seller, setSeller] = useState<SellerProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/sellers/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setSeller(d?.seller ?? null))
      .catch(() => setSeller(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{ fontFamily: "'Pretendard Variable',sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <Header />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ height: 180, background: 'linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', borderRadius: 20 }} />
        <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      </div>
    </div>
  )

  if (!seller) return (
    <div style={{ fontFamily: "'Pretendard Variable',sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <Header />
      <div style={{ textAlign: 'center', padding: '100px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😢</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 8 }}>판매자를 찾을 수 없어요</div>
        <Link href="/sellers" style={{ color: '#4FC3F7', fontWeight: 700 }}>← 판매자 목록으로</Link>
      </div>
    </div>
  )

  const joinYear = new Date(seller.joinedAt).getFullYear()

  return (
    <div style={{ fontFamily: "'Pretendard Variable',Pretendard,-apple-system,sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        .pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;}
        .pcard{background:#fff;border-radius:16px;border:1px solid #F0EDE8;overflow:hidden;text-decoration:none;color:inherit;display:flex;flex-direction:column;transition:all 0.2s;}
        .pcard:hover{box-shadow:0 6px 24px rgba(0,0,0,0.09);transform:translateY(-2px);}
        @media(max-width:640px){
          .seller-hero{padding:28px 16px!important;}
          .seller-main{padding:20px 16px 60px!important;}
          .pgrid{grid-template-columns:1fr 1fr;}
        }
      `}</style>

      <Header />

      {/* 판매자 히어로 */}
      <div className="seller-hero" style={{ background: 'linear-gradient(135deg,#111827,#1F2D45)', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <Link href="/sellers" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', display: 'inline-block', marginBottom: 20 }}>← 판매자 목록</Link>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#4FC3F7,#667EEA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 900, color: '#fff', margin: '0 auto 16px', border: '3px solid rgba(255,255,255,0.15)' }}>
            {seller.profileImage
              ? <img src={seller.profileImage} alt={seller.nickname} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : seller.nickname[0]
            }
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 6 }}>{seller.nickname}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>{joinYear}년부터 활동 중</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32 }}>
            {[
              { v: seller.programCount, l: '등록 자료' },
              { v: seller.totalReviews, l: '전체 리뷰' },
              { v: seller.avgRating > 0 ? `★ ${seller.avgRating}` : '-', l: '평균 별점' },
            ].map(({ v, l }) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{v}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 자료 목록 */}
      <main className="seller-main" style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px 60px' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 16 }}>
          등록 자료 <span style={{ fontSize: 14, color: '#9CA3AF', fontWeight: 600 }}>({seller.programs.length}개)</span>
        </div>

        {seller.programs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>등록된 자료가 없습니다</div>
          </div>
        ) : (
          <div className="pgrid">
            {seller.programs.map(p => {
              const rating = parseFloat(p.rating_avg) || 0
              const isFile = p.product_type === 'file_product'
              return (
                <Link key={p.id} href={`/programs/${p.id}`} className="pcard">
                  <div style={{ height: 120, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                    {p.thumbnail_url ? (
                      <img src={p.thumbnail_url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg,${catGrad(p.category)})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
                        {catIcon(p.category)}
                      </div>
                    )}
                    <span style={{ position: 'absolute', top: 8, right: 8, background: isFile ? 'rgba(3,105,161,0.9)' : 'rgba(91,33,182,0.9)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 4 }}>
                      {isFile ? '📄 파일' : '🎓 강의'}
                    </span>
                  </div>
                  <div style={{ padding: '12px 14px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', lineHeight: 1.35, marginBottom: 4, flex: 1 }}>{p.title}</div>
                    {p.subtitle && <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>{p.subtitle}</div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 15, fontWeight: 900, color: p.price === 0 ? '#10B981' : '#111827' }}>{fmt(p.price)}</span>
                      {rating > 0 && (
                        <span style={{ fontSize: 12, color: '#F59E0B', fontWeight: 700 }}>★ {rating.toFixed(1)} <span style={{ color: '#9CA3AF', fontWeight: 400 }}>({p.review_count})</span></span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
