'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { useAuth } from '@/store/auth'

const BANKS = [
  'KB국민은행', '신한은행', '하나은행', '우리은행', 'IBK기업은행',
  'NH농협은행', 'SC제일은행', '카카오뱅크', '케이뱅크', '토스뱅크',
  '씨티은행', 'DGB대구은행', 'BNK부산은행', '광주은행', '전북은행',
  '제주은행', '경남은행', '수협은행', '새마을금고', '신협',
]

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  paid:      { label: '결제완료', bg: '#DBEAFE', color: '#1E40AF' },
  confirmed: { label: '진행완료', bg: '#D1FAE5', color: '#065F46' },
  pending:   { label: '결제대기', bg: '#FEF3C7', color: '#92400E' },
  refunded:  { label: '환불완료', bg: '#FEE2E2', color: '#991B1B' },
  cancelled: { label: '취소됨',   bg: '#F3F4F6', color: '#6B7280' },
}

const W_STATUS: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  pending:    { label: '신청완료', bg: '#FEF3C7', color: '#92400E', icon: '⏳' },
  processing: { label: '처리중',   bg: '#DBEAFE', color: '#1D4ED8', icon: '🔄' },
  completed:  { label: '지급완료', bg: '#D1FAE5', color: '#065F46', icon: '✅' },
  rejected:   { label: '거절됨',   bg: '#FEE2E2', color: '#991B1B', icon: '❌' },
}

interface SaleOrder {
  id: string; orderNumber: string; buyerName: string
  programTitle: string; programId: string; amount: number
  status: string; createdAt: string
}
interface Stats {
  totalOrders: number; monthOrders: number
  totalRevenue: number; monthRevenue: number
}
interface Withdrawal {
  id: string; amount: number; bankName: string
  accountNumber: string; accountHolder: string
  status: string; adminNote: string | null
  requestedAt: string; processedAt: string | null
}
interface EarningsData {
  grossEarnings: number; netEarnings: number
  withdrawn: number; available: number
  withdrawals: Withdrawal[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .replace(/\. /g, '.').replace(/\.$/, '')
}

function maskAccount(num: string) {
  if (num.length <= 4) return num
  return num.slice(0, -4).replace(/./g, '*') + num.slice(-4)
}

export default function MySalesPage() {
  const { user, accessToken } = useAuth()
  const router = useRouter()
  const [orders, setOrders]       = useState<SaleOrder[]>([])
  const [stats, setStats]         = useState<Stats | null>(null)
  const [earnings, setEarnings]   = useState<EarningsData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState<'all' | 'paid' | 'confirmed' | 'refunded'>('all')
  const [tab, setTab]             = useState<'sales' | 'earnings'>('sales')
  const [showModal, setShowModal] = useState(false)

  // 환전 신청 폼
  const [form, setForm]         = useState({ bank: '', account: '', holder: '', amount: '' })
  const [formErr, setFormErr]   = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user) { router.replace('/login'); return }
  }, [user, router])

  const loadData = () => {
    if (!accessToken || !user) return
    setLoading(true)
    Promise.all([
      fetch('/api/seller/stats',    { headers: { Authorization: `Bearer ${accessToken}` } }).then(r => r.json()),
      fetch('/api/my/withdrawals',  { headers: { Authorization: `Bearer ${accessToken}` } }).then(r => r.json()),
    ]).then(([saleData, earnData]) => {
      setOrders(saleData.orders ?? [])
      setStats(saleData.stats ?? null)
      setEarnings(earnData)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [accessToken, user]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const handleWithdraw = async () => {
    setFormErr('')
    const amt = parseInt(form.amount.replace(/,/g, ''))
    if (!form.bank)    return setFormErr('은행을 선택해주세요')
    if (!form.account) return setFormErr('계좌번호를 입력해주세요')
    if (!form.holder)  return setFormErr('예금자명을 입력해주세요')
    if (!amt || amt < 10000) return setFormErr('최소 환전 금액은 10,000원입니다')
    if (earnings && amt > earnings.available) return setFormErr(`출금 가능 금액(₩${earnings.available.toLocaleString()})을 초과했습니다`)

    setSubmitting(true)
    try {
      const res = await fetch('/api/my/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ amount: amt, bankName: form.bank, accountNumber: form.account, accountHolder: form.holder }),
      })
      const d = await res.json()
      if (!res.ok) { setFormErr(d.error ?? '오류가 발생했습니다'); return }
      setShowModal(false)
      setForm({ bank: '', account: '', holder: '', amount: '' })
      loadData()
    } finally { setSubmitting(false) }
  }

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <style>{`
        @media(max-width:640px){
          .sales-main{padding:20px 16px 60px!important;}
          .kpi-grid{grid-template-columns:1fr 1fr!important;}
          .table-wrap{overflow-x:auto;}
          .table-wrap table{min-width:520px;}
        }
      `}</style>
      <Header />
      <main className="sales-main" style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 60px' }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Link href="/my" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: 22 }}>←</Link>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111827' }}>판매 내역 · 수익금</h1>
        </div>

        {/* 탭 */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #E5E7EB' }}>
          {([['sales', '📋 판매 내역'], ['earnings', '💰 수익금 관리']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)} style={{
              padding: '10px 18px', border: 'none', background: 'none', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              color: tab === v ? '#111827' : '#9CA3AF',
              borderBottom: `2px solid ${tab === v ? '#111827' : 'transparent'}`,
              marginBottom: -1,
            }}>{l}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <div>불러오는 중...</div>
          </div>
        ) : tab === 'sales' ? (
          <>
            {/* KPI 카드 */}
            {stats && (
              <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                {[
                  { label: '이번달 판매', value: `${stats.monthOrders}건` },
                  { label: '이번달 수익', value: `₩${stats.monthRevenue.toLocaleString()}` },
                  { label: '총 판매',     value: `${stats.totalOrders}건` },
                  { label: '총 수익',     value: `₩${stats.totalRevenue.toLocaleString()}` },
                ].map(k => (
                  <div key={k.label} style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', border: '1px solid #F0EDE8' }}>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4, fontWeight: 700 }}>{k.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#111827' }}>{k.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* 필터 */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              {([['all', '전체'], ['paid', '결제완료'], ['confirmed', '진행완료'], ['refunded', '환불']] as const).map(([v, l]) => (
                <button key={v} onClick={() => setFilter(v)}
                  style={{ padding: '7px 16px', borderRadius: 20, border: `1.5px solid ${filter === v ? '#111827' : '#E5E7EB'}`, background: filter === v ? '#111827' : '#fff', color: filter === v ? '#fff' : '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {l}{v === 'all' ? ` (${orders.length})` : ` (${orders.filter(o => o.status === v).length})`}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{orders.length === 0 ? '아직 판매 내역이 없습니다' : '해당 상태의 주문이 없습니다'}</div>
                {orders.length === 0 && (
                  <Link href="/seller/programs/new" style={{ display: 'inline-block', marginTop: 16, background: '#111827', color: '#fff', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>프로그램 등록하기</Link>
                )}
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #F0EDE8', overflow: 'hidden' }}>
                <div className="table-wrap">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#F9FAFB' }}>
                        {['날짜', '구매자', '프로그램', '금액', '상태'].map(h => (
                          <th key={h} style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#9CA3AF', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(o => {
                        const s = STATUS_STYLE[o.status] ?? STATUS_STYLE['pending']
                        return (
                          <tr key={o.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                            <td style={{ padding: '14px 16px', fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{formatDate(o.createdAt)}</td>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{o.buyerName}</div>
                              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{o.orderNumber}</div>
                            </td>
                            <td style={{ padding: '14px 16px', maxWidth: 240 }}>
                              <Link href={`/programs/${o.programId}`} style={{ fontSize: 13, fontWeight: 600, color: '#374151', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {o.programTitle}
                              </Link>
                            </td>
                            <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 800, color: '#111827', whiteSpace: 'nowrap' }}>{o.amount.toLocaleString()}원</td>
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 6, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{s.label}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ── 수익금 관리 탭 ── */
          <>
            {/* 잔액 카드 */}
            {(() => {
              const available      = earnings?.available      ?? 0
              const grossEarnings  = earnings?.grossEarnings  ?? 0
              const netEarnings    = earnings?.netEarnings    ?? 0
              const withdrawn      = earnings?.withdrawn      ?? 0
              return (
                <div style={{ background: 'linear-gradient(135deg, #111827, #1F2D45)', borderRadius: 24, padding: 28, marginBottom: 20, color: '#fff' }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4, fontWeight: 700 }}>출금 가능 수익금</div>
                  <div style={{ fontSize: 36, fontWeight: 900, marginBottom: 16 }}>₩{available.toLocaleString()}</div>
                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 20 }}>
                    {[
                      { label: '총 판매 수익',          value: `₩${grossEarnings.toLocaleString()}` },
                      { label: '수수료 차감 후 (10%)', value: `₩${netEarnings.toLocaleString()}` },
                      { label: '출금 완료 · 진행중',   value: `₩${withdrawn.toLocaleString()}` },
                    ].map(k => (
                      <div key={k.label}>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 2 }}>{k.label}</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,0.85)' }}>{k.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>
                    * '진행완료' 상태의 주문만 수익으로 인정됩니다. 결제완료 상태는 관리자 확정 후 반영됩니다.
                  </div>
                  <button
                    onClick={() => setShowModal(true)}
                    disabled={!available}
                    style={{ background: '#4FC3F7', color: '#111827', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 900, cursor: available ? 'pointer' : 'not-allowed', fontFamily: 'inherit', opacity: available ? 1 : 0.5 }}>
                    환전 신청 →
                  </button>
                </div>
              )
            })()}

            {/* 환전 내역 */}
            <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 12 }}>환전 신청 내역</div>
            {(earnings?.withdrawals ?? []).length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #F0EDE8', padding: '48px 20px', textAlign: 'center', color: '#9CA3AF' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>💸</div>
                <div style={{ fontWeight: 700 }}>환전 신청 내역이 없습니다</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(earnings?.withdrawals ?? []).map(w => {
                  const ws = W_STATUS[w.status]
                  return (
                    <div key={w.id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #F0EDE8', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 16, fontWeight: 900, color: '#111827' }}>₩{w.amount.toLocaleString()}</span>
                          <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 6, background: ws.bg, color: ws.color }}>{ws.icon} {ws.label}</span>
                        </div>
                        <div style={{ fontSize: 13, color: '#6B7280' }}>{w.bankName} · {maskAccount(w.accountNumber)} · {w.accountHolder}</div>
                        {w.adminNote && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3 }}>관리자 메모: {w.adminNote}</div>}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 12, color: '#9CA3AF' }}>신청일 {formatDate(w.requestedAt)}</div>
                        {w.processedAt && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>처리일 {formatDate(w.processedAt)}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* 환전 신청 모달 */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => { setShowModal(false); setFormErr('') }} />
          <div style={{ position: 'relative', background: '#fff', borderRadius: '24px 24px 0 0', padding: '28px 24px 40px', width: '100%', maxWidth: 520, zIndex: 1 }}>
            <div style={{ width: 36, height: 4, background: '#E5E7EB', borderRadius: 2, margin: '0 auto 20px' }} />
            <div style={{ fontSize: 18, fontWeight: 900, color: '#111827', marginBottom: 4 }}>환전 신청</div>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 20 }}>
              출금 가능 금액: <span style={{ color: '#111827', fontWeight: 800 }}>₩{(earnings?.available ?? 0).toLocaleString()}</span>
            </div>

            {/* 은행 선택 */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>은행 선택</label>
              <select value={form.bank} onChange={e => setForm(f => ({ ...f, bank: e.target.value }))}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 15, fontFamily: 'inherit', background: '#fff', outline: 'none', boxSizing: 'border-box' }}>
                <option value="">은행을 선택하세요</option>
                {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* 계좌번호 */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>계좌번호</label>
              <input value={form.account} onChange={e => setForm(f => ({ ...f, account: e.target.value.replace(/[^0-9-]/g, '') }))}
                placeholder="계좌번호 입력 (숫자만)"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {/* 예금자명 */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>예금자명</label>
              <input value={form.holder} onChange={e => setForm(f => ({ ...f, holder: e.target.value }))}
                placeholder="예금자명 입력"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {/* 환전 금액 */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>환전 금액</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: '#6B7280', fontWeight: 700 }}>₩</span>
                <input
                  type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="10,000 이상"
                  min={10000} max={earnings?.available}
                  style={{ width: '100%', padding: '12px 14px 12px 28px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {[10000, 50000, 100000].map(amt => (
                  <button key={amt} onClick={() => setForm(f => ({ ...f, amount: String(Math.min(amt, earnings?.available ?? amt)) }))}
                    style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: '1px solid #E5E7EB', background: '#F9FAFB', fontSize: 12, fontWeight: 700, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>
                    +{(amt / 10000).toFixed(0)}만
                  </button>
                ))}
                <button onClick={() => setForm(f => ({ ...f, amount: String(earnings?.available ?? 0) }))}
                  style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: '1px solid #E5E7EB', background: '#F9FAFB', fontSize: 12, fontWeight: 700, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>
                  전액
                </button>
              </div>
            </div>

            {formErr && (
              <div style={{ background: '#FEF2F2', color: '#991B1B', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
                ✕ {formErr}
              </div>
            )}

            <button onClick={handleWithdraw} disabled={submitting}
              style={{ width: '100%', padding: '15px', background: '#111827', color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
              {submitting ? '신청 중...' : '환전 신청하기'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
