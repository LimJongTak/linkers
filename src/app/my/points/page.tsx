'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { useAuth } from '@/store/auth'

type TxType = 'charge_card' | 'charge_gift_card' | 'charge_admin' | 'purchase' | 'refund'

interface PointTx {
  id: string
  amount: number
  type: TxType
  description: string
  created_at: string
}

const TX_LABEL: Record<TxType, string> = {
  charge_card:      '카드 충전',
  charge_gift_card: '상품권 충전',
  charge_admin:     '관리자 지급',
  purchase:         '구매 차감',
  refund:           '환불',
}

const CARD_AMOUNTS = [10000, 30000, 50000, 100000, 200000, 300000]

const GIFT_PROVIDERS = [
  { id: 'cultureland',  name: '문화상품권',      placeholder: '0000-0000-0000-0000' },
  { id: 'booknlife',    name: '도서문화상품권',   placeholder: '0000-0000-0000-0000' },
  { id: 'happymoney',   name: '해피머니',         placeholder: '0000-0000-0000-0000' },
  { id: 'smartculture', name: '스마트문화상품권', placeholder: '000000000000000000' },
]

export default function PointsPage() {
  const { user, accessToken } = useAuth()
  const router = useRouter()

  const [points, setPoints] = useState(0)
  const [txList, setTxList] = useState<PointTx[]>([])
  const [loading, setLoading] = useState(true)

  // 충전 탭
  const [tab, setTab] = useState<'gift' | 'card'>('gift')

  // 상품권
  const [provider, setProvider] = useState('cultureland')
  const [pin, setPin] = useState('')
  const [giftLoading, setGiftLoading] = useState(false)
  const [giftMsg, setGiftMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // 카드
  const [cardAmount, setCardAmount] = useState(10000)
  const [cardLoading, setCardLoading] = useState(false)
  const [cardMsg, setCardMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    if (!user) { router.replace('/login'); return }
    fetch('/api/points', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => { setPoints(d.points ?? 0); setTxList(d.transactions ?? []) })
      .finally(() => setLoading(false))
  }, [user, accessToken, router])

  const handleGiftCharge = async () => {
    setGiftLoading(true); setGiftMsg(null)
    try {
      const res = await fetch('/api/points/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ method: 'gift_card', provider, pin }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg: Record<string, string> = {
          GIFT_CARD_ALREADY_USED: '이미 사용된 상품권입니다.',
          INVALID_PIN_FORMAT: '핀번호 형식이 올바르지 않습니다.',
        }
        setGiftMsg({ ok: false, text: msg[data.error] ?? '충전 실패. 다시 시도해주세요.' })
      } else {
        setPoints(data.points)
        setPin('')
        setGiftMsg({ ok: true, text: `${data.charged.toLocaleString()}P 충전 완료!` })
        setTxList(prev => [{ id: Date.now().toString(), amount: data.charged, type: 'charge_gift_card', description: `${GIFT_PROVIDERS.find(p => p.id === provider)?.name} 충전`, created_at: new Date().toISOString() }, ...prev])
      }
    } finally { setGiftLoading(false) }
  }

  const handleCardCharge = async () => {
    setCardLoading(true); setCardMsg(null)
    // 실제론 PortOne 결제 UI 먼저 띄운 후 payment_id 받아서 처리
    // 현재는 직접 충전 (PortOne 연동 시 교체)
    try {
      const res = await fetch('/api/points/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ method: 'card', card_amount: cardAmount }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCardMsg({ ok: false, text: '충전 실패. 다시 시도해주세요.' })
      } else {
        setPoints(data.points)
        setCardMsg({ ok: true, text: `${data.charged.toLocaleString()}P 충전 완료!` })
        setTxList(prev => [{ id: Date.now().toString(), amount: data.charged, type: 'charge_card', description: `카드 충전 ${data.charged.toLocaleString()}원`, created_at: new Date().toISOString() }, ...prev])
      }
    } finally { setCardLoading(false) }
  }

  if (!user) return null

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <Header />
      <main style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px 60px' }}>

        {/* 잔액 카드 */}
        <div style={{ background: 'linear-gradient(135deg,#111827,#1F2D45)', borderRadius: 24, padding: 28, marginBottom: 24, color: '#fff' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>보유 포인트</div>
          <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-1px' }}>
            {loading ? '—' : points.toLocaleString()}<span style={{ fontSize: 18, fontWeight: 600, marginLeft: 6, opacity: 0.7 }}>P</span>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>1P = 1원 · 결제 시 자유롭게 사용</div>
        </div>

        {/* 충전 섹션 */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 24, marginBottom: 20, border: '1px solid #F0EDE8' }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, color: '#111827' }}>포인트 충전</div>

          {/* 탭 */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {([['gift', '상품권'], ['card', '카드']] as const).map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'inherit',
                background: tab === t ? '#111827' : '#F5F4F1', color: tab === t ? '#fff' : '#6B7280',
                transition: 'all 0.15s',
              }}>{label}</button>
            ))}
          </div>

          {/* 상품권 충전 */}
          {tab === 'gift' && (
            <>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 8 }}>상품권 종류</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {GIFT_PROVIDERS.map(p => (
                    <button key={p.id} onClick={() => { setProvider(p.id); setPin('') }} style={{
                      padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, textAlign: 'left',
                      border: `2px solid ${provider === p.id ? '#111827' : '#E5E7EB'}`,
                      background: provider === p.id ? '#F9FAFB' : '#fff',
                      color: provider === p.id ? '#111827' : '#6B7280',
                      transition: 'all 0.15s',
                    }}>{p.name}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 6 }}>핀번호</div>
                <input
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder={GIFT_PROVIDERS.find(p => p.id === provider)?.placeholder}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 15, fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              {giftMsg && (
                <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 12, background: giftMsg.ok ? '#F0FDF4' : '#FEF2F2', color: giftMsg.ok ? '#166534' : '#991B1B', fontSize: 13, fontWeight: 700 }}>
                  {giftMsg.ok ? '✓' : '✕'} {giftMsg.text}
                </div>
              )}
              <button onClick={handleGiftCharge} disabled={!pin.trim() || giftLoading} style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 800, fontFamily: 'inherit', cursor: pin.trim() ? 'pointer' : 'not-allowed',
                background: pin.trim() ? '#111827' : '#F3F4F6', color: pin.trim() ? '#fff' : '#9CA3AF', transition: 'all 0.15s',
              }}>{giftLoading ? '확인 중...' : '상품권 충전하기'}</button>
            </>
          )}

          {/* 카드 충전 */}
          {tab === 'card' && (
            <>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 8 }}>충전 금액 선택</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {CARD_AMOUNTS.map(amt => (
                    <button key={amt} onClick={() => setCardAmount(amt)} style={{
                      padding: '12px 8px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 800,
                      border: `2px solid ${cardAmount === amt ? '#111827' : '#E5E7EB'}`,
                      background: cardAmount === amt ? '#111827' : '#fff',
                      color: cardAmount === amt ? '#fff' : '#374151',
                      transition: 'all 0.15s',
                    }}>{(amt / 10000).toLocaleString()}만원</button>
                  ))}
                </div>
              </div>
              <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#6B7280' }}>
                충전 금액 <strong style={{ color: '#111827' }}>{cardAmount.toLocaleString()}원</strong> → <strong style={{ color: '#4F46E5' }}>{cardAmount.toLocaleString()}P</strong> 적립
              </div>
              {cardMsg && (
                <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 12, background: cardMsg.ok ? '#F0FDF4' : '#FEF2F2', color: cardMsg.ok ? '#166534' : '#991B1B', fontSize: 13, fontWeight: 700 }}>
                  {cardMsg.ok ? '✓' : '✕'} {cardMsg.text}
                </div>
              )}
              <button onClick={handleCardCharge} disabled={cardLoading} style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
                background: '#111827', color: '#fff', transition: 'all 0.15s',
              }}>{cardLoading ? '처리 중...' : `${cardAmount.toLocaleString()}원 카드 결제`}</button>
            </>
          )}
        </div>

        {/* 내역 */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #F0EDE8' }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, color: '#111827' }}>포인트 내역</div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF', fontSize: 14 }}>불러오는 중...</div>
          ) : txList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF', fontSize: 14 }}>포인트 내역이 없습니다</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {txList.map(tx => (
                <div key={tx.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #F5F4F1' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{tx.description}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                      {TX_LABEL[tx.type]} · {new Date(tx.created_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: tx.amount > 0 ? '#4F46E5' : '#EF4444' }}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}P
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
