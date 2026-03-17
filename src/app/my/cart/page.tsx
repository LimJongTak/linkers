'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { useAuth } from '@/store/auth'

const fmt = (n: number) => n === 0 ? '무료' : `${n.toLocaleString()}원`

interface CartItem {
  id: string
  program: {
    id: string
    title: string
    subtitle: string | null
    price: number
    category: string
    product_type: string
    thumbnail_url: string | null
    rating_avg: string
    review_count: number
    seller: { id: string; nickname: string }
  }
}

const catGrad = (c: string) => ({ '레크리에이션': '#E0F2FE,#BAE6FD', '교육': '#EDE9FE,#DDD6FE', '진로': '#FEF3C7,#FDE68A', '예체능': '#FCE7F3,#FBCFE8', '재능봉사': '#D1FAE5,#A7F3D0' }[c] ?? '#F3F4F6,#E5E7EB')
const catIcon = (c: string) => ({ '레크리에이션': '🎯', '교육': '📚', '진로': '🔭', '예체능': '🎨', '재능봉사': '🤝' }[c] ?? '📄')

export default function CartPage() {
  const { user, accessToken } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [userPoints, setUserPoints] = useState<number | null>(null)
  const [payMethod, setPayMethod] = useState('point')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user) { router.replace('/login'); return }
    Promise.all([
      fetch('/api/cart', { headers: { Authorization: `Bearer ${accessToken}` } })
        .then(r => r.json()).then(d => { setItems(d.items ?? []); setSelected(new Set((d.items ?? []).map((i: CartItem) => i.id))) }),
      fetch('/api/points', { headers: { Authorization: `Bearer ${accessToken}` } })
        .then(r => r.json()).then(d => setUserPoints(d.points ?? 0)),
    ]).finally(() => setLoading(false))
  }, [user, accessToken, router])

  const removeItem = async (itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId))
    setSelected(prev => { const s = new Set(prev); s.delete(itemId); return s })
    await fetch(`/api/cart/${itemId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } })
  }

  const toggleSelect = (itemId: string) => {
    setSelected(prev => { const s = new Set(prev); s.has(itemId) ? s.delete(itemId) : s.add(itemId); return s })
  }

  const selectedItems = items.filter(i => selected.has(i.id))
  const total = selectedItems.reduce((s, i) => s + i.program.price, 0)
  const notEnoughPoints = payMethod === 'point' && userPoints !== null && userPoints < total

  const handleCheckout = async () => {
    if (selectedItems.length === 0) return
    setChecking(true); setError('')
    try {
      const res = await fetch('/api/cart/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ paymentMethod: payMethod, usePoints: total }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '결제 실패'); return }
      setDone(true)
      setItems(prev => prev.filter(i => !selected.has(i.id)))
      setSelected(new Set())
    } catch { setError('네트워크 오류') }
    finally { setChecking(false) }
  }

  if (!user) return null

  if (done) return (
    <div style={{ fontFamily: "'Pretendard Variable', sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <Header />
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#111827', marginBottom: 8 }}>결제 완료!</div>
        <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 28 }}>구매 내역에서 다운로드할 수 있습니다</div>
        <button onClick={() => router.push('/my/orders')}
          style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 28px', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
          구매 내역 확인 →
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: "'Pretendard Variable', sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <Header />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Link href="/my" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: 22 }}>←</Link>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: '#111827', margin: 0 }}>장바구니</h1>
          {items.length > 0 && <span style={{ fontSize: 14, color: '#9CA3AF', fontWeight: 700 }}>{items.length}개</span>}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>불러오는 중...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 8 }}>장바구니가 비어있어요</div>
            <Link href="/" style={{ color: '#4FC3F7', fontWeight: 700, textDecoration: 'none' }}>프로그램 둘러보기 →</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* 전체 선택 */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', border: '1px solid #F0EDE8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#374151' }}>
                  <input type="checkbox"
                    checked={selected.size === items.length}
                    onChange={() => setSelected(selected.size === items.length ? new Set() : new Set(items.map(i => i.id)))}
                    style={{ width: 16, height: 16, cursor: 'pointer' }} />
                  전체 선택 ({selected.size}/{items.length})
                </label>
                {selected.size > 0 && (
                  <button onClick={() => { selected.forEach(id => removeItem(id)) }}
                    style={{ fontSize: 12, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    선택 삭제
                  </button>
                )}
              </div>

              {items.map(item => (
                <div key={item.id} style={{ background: '#fff', borderRadius: 16, border: `2px solid ${selected.has(item.id) ? '#111827' : '#F0EDE8'}`, overflow: 'hidden', transition: 'border-color 0.15s' }}>
                  <div style={{ display: 'flex', gap: 14, padding: 16 }}>
                    <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)}
                      style={{ width: 18, height: 18, cursor: 'pointer', flexShrink: 0, marginTop: 2 }} />
                    <div style={{ width: 72, height: 72, borderRadius: 10, background: `linear-gradient(135deg,${catGrad(item.program.category)})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0 }}>
                      {catIcon(item.program.category)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link href={`/programs/${item.program.id}`} style={{ fontSize: 15, fontWeight: 800, color: '#111827', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                        {item.program.title}
                      </Link>
                      <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>{item.program.seller.nickname} · {item.program.category}</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: item.program.price === 0 ? '#10B981' : '#111827' }}>{fmt(item.program.price)}</div>
                    </div>
                    <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#D1D5DB', alignSelf: 'flex-start', padding: 0 }}>✕</button>
                  </div>
                </div>
              ))}
            </div>

            {/* 결제 요약 */}
            <div style={{ position: 'sticky', top: 80 }}>
              <div style={{ background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #F0EDE8', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 16 }}>결제 정보</div>

                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>결제 수단</div>
                {[['point', '💰 포인트']].map(([v, l]) => (
                  <div key={v} onClick={() => setPayMethod(v)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: `2px solid ${payMethod === v ? '#111827' : '#E5E7EB'}`, marginBottom: 8, cursor: 'pointer', background: payMethod === v ? '#F9FAFB' : '#fff', transition: 'all 0.15s' }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${payMethod === v ? '#111827' : '#D1D5DB'}`, background: payMethod === v ? '#111827' : 'transparent', flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{l}</span>
                    {v === 'point' && (
                      <span style={{ fontSize: 12, marginLeft: 'auto', color: notEnoughPoints ? '#EF4444' : '#4F46E5', fontWeight: 700 }}>
                        {userPoints !== null ? `${userPoints.toLocaleString()}P` : '...'}
                        {notEnoughPoints && ' (부족)'}
                      </span>
                    )}
                  </div>
                ))}

                <div style={{ borderTop: '1px solid #F3F4F6', margin: '16px 0', paddingTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#6B7280' }}>선택 상품 ({selectedItems.length}개)</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{total.toLocaleString()}원</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>총 결제 금액</span>
                    <span style={{ fontSize: 18, fontWeight: 900, color: '#111827' }}>{fmt(total)}</span>
                  </div>
                </div>

                {error && <div style={{ background: '#FEF2F2', color: '#991B1B', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>✕ {error}</div>}

                <button onClick={handleCheckout}
                  disabled={checking || selectedItems.length === 0 || notEnoughPoints}
                  style={{ width: '100%', background: selectedItems.length === 0 || notEnoughPoints ? '#E5E7EB' : '#111827', color: selectedItems.length === 0 || notEnoughPoints ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 14, padding: '16px', fontSize: 15, fontWeight: 900, cursor: selectedItems.length === 0 || notEnoughPoints ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {checking ? '처리 중...' : selectedItems.length === 0 ? '상품을 선택하세요' : `${fmt(total)} 결제하기`}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
