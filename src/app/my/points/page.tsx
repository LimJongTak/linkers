'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { useAuth } from '@/store/auth'

type TxType = 'charge_card' | 'charge_gift_card' | 'charge_bank' | 'charge_admin' | 'purchase' | 'purchase_reward' | 'refund'

interface PointTx {
  id: string
  amount: number
  type: TxType
  description: string
  created_at: string
}

interface DepositReq {
  id: string
  amount: number
  status: 'pending' | 'completed' | 'rejected'
  requested_at: string
  processed_at: string | null
  admin_note: string | null
}

const TX_LABEL: Record<TxType, string> = {
  charge_card:      '카드 충전',
  charge_gift_card: '상품권 충전',
  charge_bank:      '계좌이체 충전',
  charge_admin:     '관리자 지급',
  purchase:         '구매 차감',
  purchase_reward:  '구매 적립',
  refund:           '환불',
}

const AMOUNTS = [10000, 30000, 50000, 100000, 200000, 300000]

const BANK_INFO = {
  bank:   '카카오뱅크',
  account: '3333-07-6590136',
  holder: '임종탁',
}

export default function PointsPage() {
  const { user, accessToken } = useAuth()
  const router = useRouter()

  const [points, setPoints] = useState(0)
  const [txList, setTxList] = useState<PointTx[]>([])
  const [loading, setLoading] = useState(true)

  const [tab, setTab] = useState<'bank' | 'card'>('bank')

  // 계좌이체 스텝: 'select' | 'confirm' | 'done'
  const [step, setStep] = useState<'select' | 'confirm' | 'done'>('select')
  const [selectedAmount, setSelectedAmount] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const [myDeposits, setMyDeposits] = useState<DepositReq[]>([])

  useEffect(() => {
    if (!user) { router.replace('/login'); return }
    Promise.all([
      fetch('/api/points', { headers: { Authorization: `Bearer ${accessToken}` } }).then(r => r.json()),
      fetch('/api/points/deposit', { headers: { Authorization: `Bearer ${accessToken}` } }).then(r => r.json()),
    ]).then(([pd, dd]) => {
      setPoints(pd.points ?? 0)
      setTxList(pd.transactions ?? [])
      setMyDeposits(dd.deposits ?? [])
    }).finally(() => setLoading(false))
  }, [user, accessToken, router])

  const handleDepositRequest = async () => {
    setSubmitting(true); setSubmitError('')
    const res = await fetch('/api/points/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ amount: selectedAmount }),
    })
    const d = await res.json()
    setSubmitting(false)
    if (res.ok) {
      setMyDeposits(prev => [d.deposit, ...prev])
      setStep('done')
    } else {
      setSubmitError(d.error ?? '요청 실패. 다시 시도해주세요.')
    }
  }

  const resetBank = () => { setStep('select'); setSelectedAmount(0); setSubmitError('') }

  if (!user) return null

  const CARD: React.CSSProperties = { background: '#fff', borderRadius: 20, padding: 24, marginBottom: 20, border: '1px solid #F0EDE8' }
  const BTN_AMOUNT = (selected: boolean): React.CSSProperties => ({
    padding: '12px 8px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 800,
    border: `2px solid ${selected ? '#111827' : '#E5E7EB'}`,
    background: selected ? '#111827' : '#fff',
    color: selected ? '#fff' : '#374151',
    transition: 'all 0.15s',
  })

  const depositStatusLabel: Record<string, [string, string]> = {
    pending:   ['#92400E', '#FEF3C7'],
    completed: ['#065F46', '#D1FAE5'],
    rejected:  ['#991B1B', '#FEE2E2'],
  }
  const depositStatusText: Record<string, string> = { pending: '처리 대기', completed: '충전 완료', rejected: '반려됨' }

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
        <div style={CARD}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, color: '#111827' }}>포인트 충전</div>

          {/* 탭 */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {(['bank', 'card'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); resetBank() }} style={{
                flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: 14, fontFamily: 'inherit',
                background: tab === t ? '#111827' : '#F5F4F1',
                color: tab === t ? '#fff' : '#6B7280',
                transition: 'all 0.15s',
              }}>{t === 'bank' ? '계좌이체' : '카드결제'}</button>
            ))}
          </div>

          {/* ── 계좌이체 ── */}
          {tab === 'bank' && (
            <>
              {step === 'select' && (
                <>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10 }}>충전 금액 선택</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
                    {AMOUNTS.map(amt => (
                      <button key={amt} onClick={() => setSelectedAmount(amt)} style={BTN_AMOUNT(selectedAmount === amt)}>
                        {(amt / 10000).toLocaleString()}만원
                      </button>
                    ))}
                  </div>
                  <button
                    disabled={!selectedAmount}
                    onClick={() => setStep('confirm')}
                    style={{
                      width: '100%', padding: '14px', borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 800, fontFamily: 'inherit',
                      background: selectedAmount ? '#111827' : '#F3F4F6',
                      color: selectedAmount ? '#fff' : '#9CA3AF',
                      cursor: selectedAmount ? 'pointer' : 'not-allowed',
                    }}
                  >
                    다음 — 입금 안내 확인
                  </button>
                </>
              )}

              {step === 'confirm' && (
                <>
                  {/* 입금 안내 */}
                  <div style={{ background: '#F0F9FF', border: '1.5px solid #BAE6FD', borderRadius: 14, padding: '20px 20px', marginBottom: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#0369A1', marginBottom: 14 }}>입금 계좌 안내</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                        <span style={{ color: '#64748B', fontWeight: 600 }}>은행</span>
                        <span style={{ fontWeight: 800, color: '#111827' }}>{BANK_INFO.bank}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                        <span style={{ color: '#64748B', fontWeight: 600 }}>계좌번호</span>
                        <span style={{ fontWeight: 900, color: '#111827', letterSpacing: 1 }}>{BANK_INFO.account}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                        <span style={{ color: '#64748B', fontWeight: 600 }}>예금주</span>
                        <span style={{ fontWeight: 800, color: '#111827' }}>{BANK_INFO.holder}</span>
                      </div>
                      <div style={{ height: 1, background: '#BAE6FD', margin: '4px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
                        <span style={{ color: '#64748B', fontWeight: 600 }}>입금 금액</span>
                        <span style={{ fontWeight: 900, color: '#0369A1', fontSize: 16 }}>{selectedAmount.toLocaleString()}원</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 14px', marginBottom: 20, fontSize: 13, color: '#92400E', fontWeight: 600, lineHeight: 1.6 }}>
                    위 계좌로 <strong>{selectedAmount.toLocaleString()}원</strong>을 입금하신 후 아래 버튼을 눌러주세요.<br />
                    입금 확인 후 <strong>최대 1시간 내</strong>에 포인트가 지급됩니다.
                  </div>

                  {submitError && (
                    <div style={{ background: '#FEE2E2', color: '#991B1B', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, fontWeight: 700 }}>
                      {submitError}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={resetBank} style={{
                      flex: 1, padding: '13px', borderRadius: 12, border: '1.5px solid #E5E7EB',
                      fontSize: 14, fontWeight: 700, background: '#fff', color: '#6B7280', cursor: 'pointer', fontFamily: 'inherit',
                    }}>이전</button>
                    <button onClick={handleDepositRequest} disabled={submitting} style={{
                      flex: 2, padding: '13px', borderRadius: 12, border: 'none',
                      fontSize: 15, fontWeight: 800, fontFamily: 'inherit', cursor: submitting ? 'not-allowed' : 'pointer',
                      background: '#111827', color: '#fff', opacity: submitting ? 0.7 : 1,
                    }}>
                      {submitting ? '처리 중...' : '입금 완료했어요'}
                    </button>
                  </div>
                </>
              )}

              {step === 'done' && (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: '#111827', marginBottom: 8 }}>입금 요청이 접수되었습니다</div>
                  <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, marginBottom: 24 }}>
                    입금 확인 후 <strong style={{ color: '#111827' }}>최대 1시간 내</strong>로 포인트를 지급해드립니다.<br />
                    처리 완료 시 포인트 내역에서 확인하실 수 있습니다.
                  </div>
                  <button onClick={resetBank} style={{
                    padding: '12px 28px', borderRadius: 12, border: 'none', background: '#111827',
                    color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                  }}>다시 충전하기</button>
                </div>
              )}
            </>
          )}

          {/* ── 카드결제 (추후 예정) ── */}
          {tab === 'card' && (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <div style={{ fontSize: 36, marginBottom: 14 }}>💳</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#374151', marginBottom: 8 }}>카드 결제</div>
              <div style={{ fontSize: 14, color: '#9CA3AF', lineHeight: 1.7 }}>
                카드 결제 기능은 현재 준비 중입니다.<br />
                빠른 시일 내에 서비스를 제공할 예정입니다.
              </div>
              <div style={{ marginTop: 16, display: 'inline-block', background: '#F3F4F6', color: '#9CA3AF', fontSize: 12, fontWeight: 800, padding: '6px 14px', borderRadius: 20 }}>
                추후 기능 추가 예정
              </div>
            </div>
          )}
        </div>

        {/* 내 입금 요청 내역 */}
        {myDeposits.length > 0 && (
          <div style={CARD}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 14, color: '#111827' }}>입금 요청 내역</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {myDeposits.map(d => {
                const [color, bg] = depositStatusLabel[d.status]
                return (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F5F4F1' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>계좌이체 {d.amount.toLocaleString()}원</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                        {new Date(d.requested_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {d.admin_note && <span style={{ marginLeft: 6, color: '#EF4444' }}>· {d.admin_note}</span>}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 6, background: bg, color }}>{depositStatusText[d.status]}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 포인트 내역 */}
        <div style={CARD}>
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
                      {TX_LABEL[tx.type] ?? tx.type} · {new Date(tx.created_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
