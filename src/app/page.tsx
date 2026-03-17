'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { useAuth } from '@/store/auth'

const CATEGORIES = ['전체', '레크리에이션', '교육', '진로', '예체능', '재능봉사']
const TARGETS    = ['전체', '초등', '중등', '고등', '대학']
const SORTS: [string, string][] = [['popular', '인기순'], ['rating', '별점순'], ['price_asc', '가격↑'], ['price_desc', '가격↓'], ['recent', '최신순']]
const RATINGS = [0, 3, 3.5, 4, 4.5]

type Tab = 'all' | 'file_product' | 'class'

interface DBProgram {
  id: string
  product_type: 'file_product' | 'class'
  title: string
  subtitle: string | null
  category: string
  target_levels: string[]
  region: string[]
  price: number
  sale_price: number | null
  sale_start_at: string | null
  sale_end_at: string | null
  file_format: string | null
  page_count: number | null
  duration: string | null
  max_participants: number | null
  rating_avg: string
  review_count: number
  tags: string[]
  thumbnail_url: string | null
  seller: { id: string; nickname: string; profile_image: string | null }
}

const fmt = (n: number) => n === 0 ? '무료' : `${n.toLocaleString()}원`

const catGrad = (c: string) => ({ '레크리에이션': '#E0F2FE,#BAE6FD', '교육': '#EDE9FE,#DDD6FE', '진로': '#FEF3C7,#FDE68A', '예체능': '#FCE7F3,#FBCFE8', '재능봉사': '#D1FAE5,#A7F3D0' }[c] ?? '#F3F4F6,#E5E7EB')

const catIcon = (c: string) => ({ '레크리에이션': '🎯', '교육': '📚', '진로': '🔭', '예체능': '🎨', '재능봉사': '🤝' }[c] ?? '📄')

export default function HomePage() {
  const { user, accessToken } = useAuth()
  const [tab, setTab] = useState<Tab>('all')
  const [cat, setCat] = useState('전체')
  const [tgt, setTgt] = useState('전체')
  const [srt, setSrt] = useState('popular')
  const [q, setQ]     = useState('')
  const [inputQ, setInputQ] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minRating, setMinRating] = useState(0)
  const [showPriceFilter, setShowPriceFilter] = useState(false)

  const [programs, setPrograms]       = useState<DBProgram[]>([])
  const [total, setTotal]             = useState(0)
  const [loading, setLoading]         = useState(true)
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set())
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set())
  const [siteStats, setSiteStats]     = useState<{ totalPrograms: number; totalDownloads: number; avgRating: string | null } | null>(null)

  const fetchPrograms = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (cat !== '전체') params.set('category', cat)
      if (tgt !== '전체') params.set('target', tgt)
      if (tab !== 'all')  params.set('productType', tab)
      if (q)              params.set('q', q)
      if (minPrice)       params.set('minPrice', minPrice)
      if (maxPrice)       params.set('maxPrice', maxPrice)
      if (minRating > 0)  params.set('minRating', String(minRating))
      params.set('sort', srt)

      const res = await fetch(`/api/programs?${params}`)
      if (!res.ok) return
      const data = await res.json()
      setPrograms(data.programs ?? [])
      setTotal(data.total ?? 0)
    } catch {
      setPrograms([])
    } finally {
      setLoading(false)
    }
  }, [cat, tgt, tab, q, srt, minPrice, maxPrice, minRating])

  useEffect(() => { fetchPrograms() }, [fetchPrograms])

  // 사이트 통계 (최초 1회)
  useEffect(() => {
    fetch('/api/stats').then(r => r.ok ? r.json() : null).then(d => { if (d) setSiteStats(d) }).catch(() => {})
  }, [])

  // 구매한 프로그램 ID 목록
  useEffect(() => {
    if (!accessToken) { setPurchasedIds(new Set()); return }
    fetch('/api/orders', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.ok ? r.json() : { orders: [] })
      .then(d => {
        const ids = (d.orders ?? [])
          .filter((o: any) => ['paid', 'confirmed'].includes(o.status))
          .map((o: any) => (o.program_id ?? o.program?.id) as string)
        setPurchasedIds(new Set(ids))
      })
      .catch(() => {})
  }, [accessToken])

  // 찜 목록
  useEffect(() => {
    if (!accessToken) { setWishlistIds(new Set()); return }
    fetch('/api/my/wishlist', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.ok ? r.json() : { programIds: [] })
      .then(d => setWishlistIds(new Set(d.programIds ?? [])))
      .catch(() => {})
  }, [accessToken])

  const toggleWishlist = async (programId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!accessToken) return
    const wasWished = wishlistIds.has(programId)
    setWishlistIds(prev => {
      const next = new Set(prev)
      if (wasWished) next.delete(programId); else next.add(programId)
      return next
    })
    try {
      await fetch('/api/my/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ programId }),
      })
    } catch {
      // revert
      setWishlistIds(prev => {
        const next = new Set(prev)
        if (wasWished) next.add(programId); else next.delete(programId)
        return next
      })
    }
  }

  // 검색어 디바운스
  useEffect(() => {
    const t = setTimeout(() => setQ(inputQ), 400)
    return () => clearTimeout(t)
  }, [inputQ])

  const hasFilter = minPrice !== '' || maxPrice !== '' || minRating > 0

  return (
    <div style={{ fontFamily: "'Pretendard Variable',Pretendard,-apple-system,sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:#D1D5DB;border-radius:4px;}
        .chip{padding:7px 16px;border-radius:20px;border:1.5px solid #E5E7EB;background:#fff;font-size:13px;font-weight:700;cursor:pointer;transition:all 0.15s;font-family:inherit;color:#374151;white-space:nowrap;}
        .chip.on{background:#111827;color:#fff;border-color:#111827;}
        .chip:hover:not(.on){border-color:#9CA3AF;}
        .sort-btn{padding:7px 14px;border-radius:8px;border:1.5px solid #E5E7EB;background:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;color:#374151;transition:all 0.15s;white-space:nowrap;}
        .sort-btn.on{background:#111827;color:#fff;border-color:#111827;}
        .card{background:#fff;border-radius:18px;border:1px solid #F0EDE8;overflow:hidden;transition:all 0.2s;display:flex;flex-direction:column;text-decoration:none;color:inherit;}
        .card:hover{box-shadow:0 8px 32px rgba(0,0,0,0.10);transform:translateY(-3px);}
        .pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;}
        .fscroll{display:flex;gap:8px;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:2px;}
        .fscroll::-webkit-scrollbar{display:none;}
        .tab-switch{display:flex;background:#F3F4F6;border-radius:14px;padding:4px;gap:4px;}
        .tab-sw-btn{flex:1;padding:10px;border:none;border-radius:10px;font-size:14px;font-weight:800;cursor:pointer;font-family:inherit;transition:all 0.15s;color:#6B7280;background:transparent;}
        .tab-sw-btn.on{background:#fff;color:#111827;box-shadow:0 2px 8px rgba(0,0,0,0.08);}
        .skeleton{background:linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .wish-btn{position:absolute;top:10px;right:40px;z-index:11;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,0.92);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;transition:transform 0.15s;backdrop-filter:blur(4px);}
        .wish-btn:hover{transform:scale(1.15);}
        .price-filter-panel{position:absolute;top:calc(100% + 4px);left:0;background:#fff;border-radius:14px;border:1.5px solid #E5E7EB;padding:16px;z-index:50;box-shadow:0 8px 24px rgba(0,0,0,0.12);min-width:260px;}
        @media(max-width:640px){
          .pgrid{grid-template-columns:1fr;}
          .filter-bar-padding{padding:10px 16px!important;}
          .hero-section{padding:36px 16px 32px!important;}
          .hero-stats{gap:20px!important;}
          .main-padding{padding:20px 16px 60px!important;}
        }
      `}</style>

      <Header />

      {/* 히어로 */}
      <section className="hero-section" style={{ background: 'linear-gradient(135deg,#111827 0%,#1F2D45 60%,#111827 100%)', padding: '52px 24px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 80%,rgba(79,195,247,0.12) 0%,transparent 50%),radial-gradient(circle at 80% 20%,rgba(139,92,246,0.08) 0%,transparent 50%)' }} />
        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'inline-block', background: 'rgba(79,195,247,0.15)', color: '#4FC3F7', fontSize: 12, fontWeight: 800, padding: '5px 14px', borderRadius: 20, marginBottom: 16 }}>교육 자료 마켓플레이스</div>
          <h1 style={{ fontSize: 'clamp(22px,5vw,38px)', fontWeight: 900, color: '#fff', lineHeight: 1.25, marginBottom: 14, letterSpacing: '-0.5px' }}>
            검증된 수업자료를<br /><span style={{ color: '#4FC3F7' }}>바로 다운로드</span>하세요
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', marginBottom: 28 }}>활동지 · PPT · 워크시트 · 강의자료 · Zoom 강의</p>
          <div style={{ position: 'relative', maxWidth: 480, margin: '0 auto 24px' }}>
            <input
              value={inputQ}
              onChange={e => setInputQ(e.target.value)}
              placeholder="자료명, 태그로 검색..."
              style={{ width: '100%', padding: '14px 52px 14px 20px', borderRadius: 14, border: 'none', fontSize: 15, fontFamily: 'inherit', outline: 'none', fontWeight: 500, background: 'rgba(255,255,255,0.95)', color: '#111827' }}
            />
            <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 20, opacity: 0.4 }}>🔍</span>
          </div>
          {/* 타입 탭 */}
          <div style={{ maxWidth: 360, margin: '0 auto 24px' }}>
            <div className="tab-switch">
              {([['all', '📚 전체'], ['file_product', '📄 파일 자료'], ['class', '🎓 강의']] as [Tab, string][]).map(([v, l]) => (
                <button key={v} className={`tab-sw-btn ${tab === v ? 'on' : ''}`} onClick={() => setTab(v)}>{l}</button>
              ))}
            </div>
          </div>
          <div className="hero-stats" style={{ display: 'flex', justifyContent: 'center', gap: 32 }}>
            {[
              { value: siteStats ? siteStats.totalPrograms.toLocaleString() : (loading ? '...' : total.toLocaleString()), label: '등록 자료' },
              { value: siteStats ? siteStats.totalDownloads.toLocaleString() : '...', label: '누적 다운로드' },
              { value: siteStats?.avgRating ? `${siteStats.avgRating}★` : '...', label: '평균 별점' },
            ].map(({ value, label }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{value}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 필터 */}
      <div className="filter-bar-padding" style={{ background: '#fff', borderBottom: '1px solid #F0EDE8', padding: '14px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="fscroll" style={{ marginBottom: 10 }}>
            {CATEGORIES.map(c => <button key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>{c}</button>)}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 700 }}>대상</span>
            {TARGETS.map(t => <button key={t} className={`chip ${tgt === t ? 'on' : ''}`} style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => setTgt(t)}>{t}</button>)}
            <div style={{ flex: 1 }} />
            {/* 가격/별점 필터 */}
            <div style={{ position: 'relative' }}>
              <button
                className={`sort-btn ${hasFilter ? 'on' : ''}`}
                onClick={() => setShowPriceFilter(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                🎚 필터{hasFilter ? ' ✓' : ''}
              </button>
              {showPriceFilter && (
                <div className="price-filter-panel" onClick={e => e.stopPropagation()}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', marginBottom: 12 }}>상세 필터</div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 700, marginBottom: 6 }}>가격 범위</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        type="number" placeholder="최소" value={minPrice}
                        onChange={e => setMinPrice(e.target.value)}
                        style={{ width: 90, padding: '7px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                      />
                      <span style={{ fontSize: 13, color: '#9CA3AF' }}>~</span>
                      <input
                        type="number" placeholder="최대" value={maxPrice}
                        onChange={e => setMaxPrice(e.target.value)}
                        style={{ width: 90, padding: '7px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                      />
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>원</span>
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 700, marginBottom: 6 }}>최소 별점</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {RATINGS.map(r => (
                        <button key={r} onClick={() => setMinRating(r)}
                          style={{ padding: '5px 10px', borderRadius: 8, border: `1.5px solid ${minRating === r ? '#111827' : '#E5E7EB'}`, background: minRating === r ? '#111827' : '#fff', color: minRating === r ? '#fff' : '#374151', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                          {r === 0 ? '전체' : `★ ${r}+`}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => { setMinPrice(''); setMaxPrice(''); setMinRating(0); setShowPriceFilter(false) }}
                    style={{ width: '100%', padding: '8px', border: '1.5px solid #E5E7EB', borderRadius: 8, background: '#F9FAFB', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#6B7280' }}>
                    필터 초기화
                  </button>
                </div>
              )}
            </div>
            <div className="fscroll" style={{ gap: 6 }}>
              {SORTS.map(([v, l]) => <button key={v} className={`sort-btn ${srt === v ? 'on' : ''}`} onClick={() => setSrt(v)}>{l}</button>)}
            </div>
          </div>
        </div>
      </div>

      {/* 목록 */}
      <main className="main-padding" style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 60px' }} onClick={() => setShowPriceFilter(false)}>
        <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          {tab === 'file_product' && <span style={{ display: 'inline-block', background: '#F0F9FF', color: '#0369A1', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 6 }}>📄 파일 자료</span>}
          {tab === 'class' && <span style={{ display: 'inline-block', background: '#EDE9FE', color: '#5B21B6', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 6 }}>🎓 강의</span>}
          {minRating > 0 && <span style={{ display: 'inline-block', background: '#FEF3C7', color: '#92400E', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 6 }}>★ {minRating}점 이상</span>}
          {(minPrice || maxPrice) && <span style={{ display: 'inline-block', background: '#F0FDF4', color: '#166534', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 6 }}>{minPrice ? `${Number(minPrice).toLocaleString()}원` : '0원'} ~ {maxPrice ? `${Number(maxPrice).toLocaleString()}원` : '∞'}</span>}
          총 <strong style={{ color: '#111827' }}>{loading ? '...' : total}</strong>개
          {q && <span style={{ marginLeft: 4 }}>— &ldquo;<strong>{q}</strong>&rdquo;</span>}
          {user && <Link href="/my/wishlist" style={{ marginLeft: 'auto', fontSize: 12, color: '#4F46E5', fontWeight: 700, textDecoration: 'none' }}>♡ 내 찜 목록 ({wishlistIds.size})</Link>}
        </div>

        {loading ? (
          <div className="pgrid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 18, border: '1px solid #F0EDE8', overflow: 'hidden' }}>
                <div className="skeleton" style={{ height: 130 }} />
                <div style={{ padding: 16 }}>
                  <div className="skeleton" style={{ height: 18, borderRadius: 6, marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 13, borderRadius: 6, width: '70%', marginBottom: 16 }} />
                  <div className="skeleton" style={{ height: 40, borderRadius: 10 }} />
                </div>
              </div>
            ))}
          </div>
        ) : programs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9CA3AF' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>등록된 자료가 없어요</div>
            <div style={{ fontSize: 14 }}>
              {q ? '다른 키워드로 검색해보세요' : '판매자가 자료를 등록하면 이곳에 나타납니다'}
            </div>
          </div>
        ) : (
          <div className="pgrid">{programs.map(p => (
            <PCard key={p.id} p={p} purchased={purchasedIds.has(p.id)} wishlisted={wishlistIds.has(p.id)} onToggleWishlist={user ? toggleWishlist : undefined} />
          ))}</div>
        )}
      </main>

      {/* 푸터 */}
      <footer style={{ background: '#111827', padding: '28px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>링커스<span style={{ color: '#4FC3F7' }}>.</span></span>
            {[['/', '자료 찾기'], ['/sellers', '인기 판매자'], ['/notices', '공지사항'], ['/faq', 'FAQ'], ['/terms', '이용약관'], ['/privacy', '개인정보처리방침']].map(([h, l]) => (
              <Link key={h} href={h} style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>{l}</Link>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', lineHeight: 1.6 }}>
            링커스는 통신판매중개업자로서 거래 당사자가 아니며, 판매자가 등록한 콘텐츠에 대한 책임은 판매자에게 있습니다.<br />
            © 2025 링커스. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

function PCard({ p, purchased, wishlisted, onToggleWishlist }: {
  p: DBProgram
  purchased?: boolean
  wishlisted?: boolean
  onToggleWishlist?: (id: string, e: React.MouseEvent) => void
}) {
  const isFile = p.product_type === 'file_product'
  const rating = parseFloat(p.rating_avg) || 0
  const now = new Date()
  const isSaleActive = !!(
    p.sale_price && p.sale_price > 0 && p.sale_price < p.price &&
    (!p.sale_start_at || new Date(p.sale_start_at) <= now) &&
    (!p.sale_end_at || new Date(p.sale_end_at) >= now)
  )
  const displayPrice = isSaleActive ? p.sale_price! : p.price
  const saleRate = isSaleActive ? Math.round((1 - p.sale_price! / p.price) * 100) : 0

  return (
    <Link href={purchased ? '/my/orders' : `/programs/${p.id}`} className="card" style={{ position: 'relative' }}>
      {/* 구매 완료 오버레이 뱃지 */}
      {purchased && (
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, background: 'rgba(16,185,129,0.93)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 6, backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', gap: 4 }}>
          ✓ 구매 완료
        </div>
      )}
      {/* 찜하기 버튼 */}
      {onToggleWishlist && (
        <button className="wish-btn" onClick={e => onToggleWishlist(p.id, e)} title={wishlisted ? '찜 해제' : '찜하기'}>
          {wishlisted ? '❤️' : '🤍'}
        </button>
      )}
      <div style={{ height: 160, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        {p.thumbnail_url ? (
          <>
            <img
              src={p.thumbnail_url}
              alt={p.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={e => {
                const el = e.currentTarget
                el.style.display = 'none'
                const fallback = el.nextElementSibling as HTMLElement
                if (fallback) fallback.style.display = 'flex'
              }}
            />
            <div style={{ display: 'none', position: 'absolute', inset: 0, background: `linear-gradient(135deg,${catGrad(p.category)})`, alignItems: 'center', justifyContent: 'center', fontSize: 52 }}>
              {catIcon(p.category)}
            </div>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 55%)' }} />
          </>
        ) : (
          <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg,${catGrad(p.category)})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ fontSize: 42, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.12))' }}>{catIcon(p.category)}</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(0,0,0,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{p.category}</div>
          </div>
        )}
        <span style={{ position: 'absolute', top: 10, right: 10, background: isFile ? 'rgba(3,105,161,0.88)' : 'rgba(91,33,182,0.88)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 5, backdropFilter: 'blur(6px)' }}>
          {isFile ? '📄 파일' : '🎓 강의'}
        </span>
        {isSaleActive && (
          <span style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(239,68,68,0.92)', color: '#fff', fontSize: 10, fontWeight: 900, padding: '3px 8px', borderRadius: 5, backdropFilter: 'blur(6px)' }}>
            SALE {saleRate}%
          </span>
        )}
      </div>
      <div style={{ padding: '16px 16px 0', flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', lineHeight: 1.35, marginBottom: 4 }}>{p.title}</div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 10 }}>{p.subtitle ?? ''}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #F3F4F6' }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#667EEA,#764BA2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 800, flexShrink: 0, overflow: 'hidden' }}>
            {p.seller.profile_image
              ? <img src={p.seller.profile_image} alt={p.seller.nickname} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
              : p.seller.nickname[0]}
          </div>
          <span style={{ fontSize: 12, color: '#374151', fontWeight: 700 }}>{p.seller.nickname}</span>
        </div>
        {isFile ? (
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            {p.file_format && <span style={{ fontSize: 11, background: '#F0F9FF', color: '#0369A1', padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>{p.file_format}</span>}
            {p.page_count && <span style={{ fontSize: 11, background: '#F3F4F6', color: '#6B7280', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>{p.page_count}p</span>}
            {p.target_levels.slice(0, 2).map(t => <span key={t} style={{ fontSize: 11, background: '#F3F4F6', color: '#6B7280', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>{t}</span>)}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            {p.duration && <span style={{ fontSize: 11, background: '#EDE9FE', color: '#5B21B6', padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>⏱ {p.duration}</span>}
            {p.target_levels.slice(0, 2).map(t => <span key={t} style={{ fontSize: 11, background: '#F3F4F6', color: '#6B7280', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>{t}</span>)}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            {isSaleActive ? (
              <>
                <span style={{ fontSize: 17, fontWeight: 900, color: '#EF4444' }}>{fmt(displayPrice)}</span>
                <span style={{ fontSize: 11, color: '#9CA3AF', textDecoration: 'line-through', marginLeft: 5 }}>{fmt(p.price)}</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: 17, fontWeight: 900, color: p.price === 0 ? '#10B981' : '#111827' }}>{fmt(p.price)}</span>
                {p.price > 0 && <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 3 }}>{isFile ? '/ 다운로드' : '/ 1회'}</span>}
              </>
            )}
          </div>
          {rating > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: '#F59E0B', fontSize: 13 }}>★</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>{rating.toFixed(1)}</span>
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>({p.review_count})</span>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: '0 16px 16px' }}>
        {purchased ? (
          <div style={{ width: '100%', background: 'linear-gradient(135deg,#059669,#10B981)', color: '#fff', borderRadius: 10, padding: '11px', fontSize: 14, fontWeight: 800, textAlign: 'center' }}>
            ✓ 구매 완료 — 다운로드
          </div>
        ) : (
          <div style={{ width: '100%', background: isFile ? '#0369A1' : '#111827', color: '#fff', borderRadius: 10, padding: '11px', fontSize: 14, fontWeight: 800, textAlign: 'center' }}>
            {isFile ? '📥 다운로드 구매' : '📅 강의 신청하기'}
          </div>
        )}
      </div>
    </Link>
  )
}
