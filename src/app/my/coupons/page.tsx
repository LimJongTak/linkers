'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { useAuth } from '@/store/auth'

// ── 공통 타입 ──────────────────────────────────────────────────
interface CouponBase {
  id: string; code: string; type: 'percentage' | 'fixed'
  discount_value: number; scope: 'global' | 'seller' | 'program'
  min_price: number; max_discount: number | null
  usage_limit: number | null; per_user_limit: number; used_count: number
  is_active: boolean; expires_at: string | null; description: string | null
}
interface IssuedCoupon extends CouponBase {
  created_at: string; program: { id: string; title: string } | null
}
interface RegisteredCoupon {
  id: string; registeredAt: string; coupon: CouponBase
  myUsedCount: number; status: 'available' | 'used' | 'expired' | 'exhausted' | 'inactive'; usable: boolean
}

const scopeLabel = { global: '전체 상품', seller: '판매자 상품', program: '특정 상품' }
const scopeColor: Record<string, string> = { global: '#EDE9FE', seller: '#DBEAFE', program: '#D1FAE5' }
const scopeTextColor: Record<string, string> = { global: '#5B21B6', seller: '#1D4ED8', program: '#065F46' }
const statusLabel: Record<string, string> = { available: '사용 가능', used: '사용 완료', expired: '만료됨', exhausted: '소진됨', inactive: '비활성' }
const statusColor: Record<string, [string, string]> = {
  available: ['#D1FAE5', '#065F46'], used: ['#F3F4F6', '#6B7280'],
  expired: ['#FEE2E2', '#991B1B'], exhausted: ['#FEF3C7', '#92400E'], inactive: ['#F3F4F6', '#9CA3AF'],
}

function discountText(c: CouponBase) {
  const base = c.type === 'percentage' ? `${c.discount_value}% 할인` : `${c.discount_value.toLocaleString()}원 할인`
  return c.max_discount ? `${base} (최대 ${c.max_discount.toLocaleString()}원)` : base
}

function useToastLocal() {
  const [toast, setToast] = useState('')
  const show = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }
  return { toast, show }
}

// ══════════════════════════════════════════════════════════════
// 구매·판매자용: 쿠폰 등록 & 지갑
// ══════════════════════════════════════════════════════════════
function BuyerCouponsView({ accessToken }: { accessToken: string | null }) {
  const [codeInput, setCodeInput] = useState('')
  const [registering, setRegistering] = useState(false)
  const [registerError, setRegisterError] = useState('')
  const [coupons, setCoupons] = useState<RegisteredCoupon[]>([])
  const [loading, setLoading] = useState(true)
  const { toast, show } = useToastLocal()

  const load = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    fetch('/api/my/coupons/registered', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json()).then(d => setCoupons(d.coupons ?? [])).catch(() => {}).finally(() => setLoading(false))
  }, [accessToken])

  useEffect(() => { load() }, [load])

  const register = async () => {
    if (!codeInput.trim()) return
    setRegistering(true)
    setRegisterError('')
    try {
      const res = await fetch('/api/my/coupons/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ code: codeInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setRegisterError(data.error ?? '등록 실패'); return }
      setCodeInput('')
      load()
      show(`🎟 ${data.coupon.code} 쿠폰이 등록되었습니다`)
    } catch {
      setRegisterError('네트워크 오류')
    } finally {
      setRegistering(false)
    }
  }

  const available = coupons.filter(c => c.usable)
  const unavailable = coupons.filter(c => !c.usable)

  return (
    <>
      {toast && (
        <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 2000, background: '#111827', color: '#fff', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
          ✓ {toast}
        </div>
      )}

      {/* 쿠폰 등록 박스 */}
      <div style={{ background: 'linear-gradient(135deg,#1E1B4B,#312E81)', borderRadius: 20, padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 6 }}>🎟 쿠폰 등록</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>관리자/판매자에게 받은 쿠폰 코드를 입력하세요</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={codeInput}
            onChange={e => { setCodeInput(e.target.value.toUpperCase()); setRegisterError('') }}
            onKeyDown={e => e.key === 'Enter' && register()}
            placeholder="쿠폰 코드 입력 (예: SUMMER20)"
            style={{ flex: 1, padding: '13px 16px', borderRadius: 12, border: 'none', fontSize: 14, fontFamily: 'inherit', outline: 'none', fontWeight: 700, background: 'rgba(255,255,255,0.12)', color: '#fff', letterSpacing: '0.05em' }}
          />
          <button onClick={register} disabled={registering || !codeInput.trim()}
            style={{ padding: '13px 20px', borderRadius: 12, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', opacity: !codeInput.trim() ? 0.5 : 1 }}>
            {registering ? '등록 중...' : '등록하기'}
          </button>
        </div>
        {registerError && (
          <div style={{ marginTop: 10, fontSize: 13, color: '#FCA5A5', fontWeight: 700 }}>✕ {registerError}</div>
        )}
      </div>

      {/* 사용 가능 쿠폰 */}
      <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 12 }}>
        사용 가능 <span style={{ color: '#4F46E5' }}>({available.length})</span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {[1, 2].map(i => <div key={i} style={{ height: 90, borderRadius: 14, background: 'linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />)}
        </div>
      ) : available.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 14, border: '1.5px dashed #E5E7EB', padding: '28px', textAlign: 'center', color: '#9CA3AF', fontSize: 13, marginBottom: 24 }}>
          사용 가능한 쿠폰이 없습니다
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {available.map(uc => <CouponCard key={uc.id} uc={uc} />)}
        </div>
      )}

      {/* 사용 완료/만료 쿠폰 */}
      {!loading && unavailable.length > 0 && (
        <>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#9CA3AF', marginBottom: 12 }}>지난 쿠폰 ({unavailable.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {unavailable.map(uc => <CouponCard key={uc.id} uc={uc} />)}
          </div>
        </>
      )}
    </>
  )
}

function CouponCard({ uc }: { uc: RegisteredCoupon }) {
  const c = uc.coupon
  const [sbg, stxt] = statusColor[uc.status]
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: `1.5px solid ${uc.usable ? '#E0E7FF' : '#F3F4F6'}`, padding: '16px 20px', opacity: uc.usable ? 1 : 0.65, position: 'relative', overflow: 'hidden' }}>
      {uc.usable && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: '#4F46E5', borderRadius: '4px 0 0 4px' }} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 900, color: '#111827', letterSpacing: '0.06em', fontFamily: 'monospace' }}>{c.code}</span>
            <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: scopeColor[c.scope], color: scopeTextColor[c.scope] }}>{scopeLabel[c.scope]}</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 900, color: uc.usable ? '#4F46E5' : '#9CA3AF', marginBottom: 6 }}>{discountText(c)}</div>
          <div style={{ fontSize: 12, color: '#9CA3AF', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {c.min_price > 0 && <span>최소 {c.min_price.toLocaleString()}원 이상</span>}
            {c.expires_at && <span>~{new Date(c.expires_at).toLocaleDateString('ko-KR')} 만료</span>}
            {c.description && <span>{c.description}</span>}
          </div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, padding: '5px 12px', borderRadius: 8, background: sbg, color: stxt, whiteSpace: 'nowrap' }}>
          {statusLabel[uc.status]}
        </span>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// 관리자·매니저용: 쿠폰 발급 & 관리
// ══════════════════════════════════════════════════════════════
function AdminCouponsView({ accessToken }: { accessToken: string | null }) {
  const [coupons, setCoupons] = useState<IssuedCoupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [myPrograms] = useState<{ id: string; title: string }[]>([]) // admin은 프로그램 없음
  const [form, setForm] = useState({
    code: '', type: 'percentage' as 'percentage' | 'fixed', discountValue: '',
    scope: 'global' as 'global' | 'seller' | 'program', programId: '',
    minPrice: '', maxDiscount: '', usageLimit: '', perUserLimit: '1',
    expiresAt: '', description: '',
  })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { toast, show } = useToastLocal()

  const load = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    fetch('/api/my/coupons', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json()).then(d => setCoupons(d.coupons ?? [])).catch(() => {}).finally(() => setLoading(false))
  }, [accessToken])

  useEffect(() => { load() }, [load])

  const submit = async () => {
    if (!form.code.trim()) { setFormError('쿠폰 코드를 입력해주세요'); return }
    if (!form.discountValue || Number(form.discountValue) <= 0) { setFormError('할인값을 입력해주세요'); return }
    setSubmitting(true); setFormError('')
    try {
      const res = await fetch('/api/my/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          code: form.code.trim(), type: form.type, discountValue: Number(form.discountValue), scope: form.scope,
          programId: form.scope === 'program' ? form.programId : undefined,
          minPrice: form.minPrice ? Number(form.minPrice) : 0,
          maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
          usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
          perUserLimit: Number(form.perUserLimit) || 1,
          expiresAt: form.expiresAt || undefined,
          description: form.description || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error ?? '쿠폰 생성 실패'); return }
      setShowForm(false)
      setForm({ code: '', type: 'percentage', discountValue: '', scope: 'global', programId: '', minPrice: '', maxDiscount: '', usageLimit: '', perUserLimit: '1', expiresAt: '', description: '' })
      load(); show('쿠폰이 발급되었습니다')
    } catch {
      setFormError('네트워크 오류')
    } finally { setSubmitting(false) }
  }

  const toggleActive = async (c: IssuedCoupon) => {
    await fetch(`/api/my/coupons/${c.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ isActive: !c.is_active }) })
    setCoupons(prev => prev.map(x => x.id === c.id ? { ...x, is_active: !x.is_active } : x))
    show(c.is_active ? '비활성화됨' : '활성화됨')
  }

  const deleteCoupon = async (id: string) => {
    if (!confirm('이 쿠폰을 삭제하시겠습니까?')) return
    const res = await fetch(`/api/my/coupons/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } })
    if (!res.ok) { const d = await res.json(); alert(d.error ?? '삭제 실패'); return }
    setCoupons(prev => prev.filter(c => c.id !== id)); show('삭제됨')
  }

  const copyCode = (code: string) => { navigator.clipboard.writeText(code).then(() => show(`${code} 복사됨`)) }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff' }

  return (
    <>
      {toast && (
        <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 2000, background: '#111827', color: '#fff', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
          ✓ {toast}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 14, color: '#6B7280' }}>총 {coupons.length}개 쿠폰 발급됨</div>
        <button onClick={() => { setShowForm(v => !v); setFormError('') }}
          style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: 12, padding: '11px 20px', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
          + 쿠폰 발급
        </button>
      </div>

      {/* 발급 폼 */}
      {showForm && (
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #F0EDE8', padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>새 쿠폰 발급</div>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9CA3AF' }}>✕</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>쿠폰 코드 *</label>
              <input style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: '0.05em' }} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="예: ADMIN20" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>할인 종류 *</label>
              <select style={inputStyle} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}>
                <option value="percentage">% 할인</option>
                <option value="fixed">금액 할인 (원)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>할인값 * {form.type === 'percentage' ? '(1~100%)' : '(원)'}</label>
              <input style={inputStyle} type="number" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))} placeholder={form.type === 'percentage' ? '20' : '5000'} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>적용 범위 *</label>
              <select style={inputStyle} value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value as any }))}>
                <option value="global">전체 상품</option>
                <option value="seller">특정 판매자 상품</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>최소 구매 금액 (원)</label>
              <input style={inputStyle} type="number" value={form.minPrice} onChange={e => setForm(f => ({ ...f, minPrice: e.target.value }))} placeholder="0 (제한 없음)" />
            </div>
            {form.type === 'percentage' && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>최대 할인 한도 (원)</label>
                <input style={inputStyle} type="number" value={form.maxDiscount} onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value }))} placeholder="제한 없음" />
              </div>
            )}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>총 사용 한도</label>
              <input style={inputStyle} type="number" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} placeholder="무제한" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>인당 사용 횟수</label>
              <input style={inputStyle} type="number" value={form.perUserLimit} onChange={e => setForm(f => ({ ...f, perUserLimit: e.target.value }))} min="1" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>만료일</label>
              <input style={inputStyle} type="datetime-local" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>쿠폰 설명 (선택)</label>
              <input style={inputStyle} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="예: 신규 가입 환영 할인" />
            </div>
          </div>
          {formError && <div style={{ background: '#FEF2F2', color: '#991B1B', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>✕ {formError}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid #E5E7EB', background: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#374151' }}>취소</button>
            <button onClick={submit} disabled={submitting} style={{ padding: '10px 22px', borderRadius: 10, border: 'none', background: '#111827', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', opacity: submitting ? 0.6 : 1 }}>
              {submitting ? '발급 중...' : '쿠폰 발급'}
            </button>
          </div>
        </div>
      )}

      {/* 쿠폰 목록 */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => <div key={i} style={{ height: 88, borderRadius: 14, background: 'linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />)}
        </div>
      ) : coupons.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#9CA3AF' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎟</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>발급한 쿠폰이 없습니다</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {coupons.map(c => {
            const expired = c.expires_at ? new Date(c.expires_at) < new Date() : false
            const exhausted = c.usage_limit !== null && c.used_count >= c.usage_limit
            const inactive = !c.is_active || expired || exhausted
            return (
              <div key={c.id} style={{ background: '#fff', borderRadius: 16, border: `1.5px solid ${inactive ? '#F3F4F6' : '#F0EDE8'}`, padding: '16px 20px', opacity: inactive ? 0.7 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 15, fontWeight: 900, color: '#111827', letterSpacing: '0.05em', fontFamily: 'monospace' }}>{c.code}</span>
                      <button onClick={() => copyCode(c.code)} style={{ background: '#F3F4F6', border: 'none', borderRadius: 6, padding: '2px 8px', fontSize: 11, cursor: 'pointer', color: '#6B7280', fontFamily: 'inherit' }}>복사</button>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: scopeColor[c.scope], color: scopeTextColor[c.scope] }}>{scopeLabel[c.scope]}</span>
                      {!c.is_active && <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: '#F3F4F6', color: '#9CA3AF' }}>비활성</span>}
                      {expired && <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: '#FEE2E2', color: '#991B1B' }}>만료됨</span>}
                      {exhausted && <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: '#FEF3C7', color: '#92400E' }}>소진됨</span>}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#4F46E5' }}>{discountText(c)}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {c.min_price > 0 && <span>최소 {c.min_price.toLocaleString()}원</span>}
                      <span>사용 {c.used_count}/{c.usage_limit ?? '∞'}</span>
                      <span>인당 {c.per_user_limit}회</span>
                      {c.expires_at && <span>~{new Date(c.expires_at).toLocaleDateString('ko-KR')}</span>}
                      {c.description && <span>{c.description}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => toggleActive(c)} style={{ padding: '7px 13px', borderRadius: 8, border: '1.5px solid #E5E7EB', background: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#374151' }}>
                      {c.is_active ? '비활성화' : '활성화'}
                    </button>
                    <button onClick={() => deleteCoupon(c.id)} style={{ padding: '7px 13px', borderRadius: 8, border: '1.5px solid #FEE2E2', background: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#EF4444' }}>
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

// ══════════════════════════════════════════════════════════════
// 메인 페이지
// ══════════════════════════════════════════════════════════════
export default function MyCouponsPage() {
  const { user, accessToken } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) router.replace('/login')
  }, [user, router])

  if (!user) return null

  const isAdmin = user.role === 'admin' || user.role === 'manager'

  return (
    <div style={{ fontFamily: "'Pretendard Variable',Pretendard,-apple-system,sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @media(max-width:640px){.coupon-main{padding:20px 16px 60px!important;}}
      `}</style>
      <Header />
      <main className="coupon-main" style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 60px' }}>
        <div style={{ marginBottom: 28 }}>
          <Link href="/my" style={{ fontSize: 13, color: '#6B7280', textDecoration: 'none' }}>← 마이페이지</Link>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#111827', marginTop: 6 }}>
            🎟 {isAdmin ? '쿠폰 발급 · 관리' : '내 쿠폰'}
          </div>
          {!isAdmin && <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>쿠폰 코드를 등록하고 구매 시 사용하세요</div>}
        </div>

        {isAdmin
          ? <AdminCouponsView accessToken={accessToken} />
          : <BuyerCouponsView accessToken={accessToken} />
        }
      </main>
    </div>
  )
}
