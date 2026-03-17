'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { useAuth } from '@/store/auth'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Legend,
} from 'recharts'

type Tab = 'dash' | 'users' | 'programs' | 'orders' | 'settlements' | 'downloads' | 'withdrawals' | 'coupons' | 'reports' | 'settings'

function useAdminFetch<T>(url: string, token: string | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const load = useCallback(() => {
    if (!token) return
    setLoading(true)
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setData).finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, token, ...deps])
  useEffect(() => { load() }, [load])
  return { data, loading, reload: load }
}

const RoleBadge = ({ role }: { role: string }) => {
  const cfg: Record<string, [string, string, string]> = {
    admin:   ['#7C3AED', '#EDE9FE', '관리자'],
    manager: ['#1D4ED8', '#DBEAFE', '매니저'],
    seller:  ['#065F46', '#D1FAE5', '구매·판매자'],
    buyer:   ['#065F46', '#D1FAE5', '구매·판매자'],
  }
  const [color, bg, label] = cfg[role] ?? ['#374151', '#F3F4F6', role]
  return <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 6, background: bg, color }}>{label}</span>
}

const StatusBadge = ({ status }: { status: string }) => {
  const cfg: Record<string, [string, string, string]> = {
    pending:   ['#92400E', '#FEF3C7', '대기'],
    paid:      ['#1D4ED8', '#DBEAFE', '결제완료'],
    confirmed: ['#065F46', '#D1FAE5', '확정'],
    refunded:  ['#991B1B', '#FEE2E2', '환불'],
    cancelled: ['#6B7280', '#F3F4F6', '취소'],
    draft:     ['#92400E', '#FEF3C7', '검수중'],
    active:    ['#065F46', '#D1FAE5', '판매중'],
    paused:    ['#6B7280', '#F3F4F6', '일시중지'],
    deleted:   ['#991B1B', '#FEE2E2', '삭제'],
    completed: ['#065F46', '#D1FAE5', '완료'],
    held:      ['#991B1B', '#FEE2E2', '보류'],
    scheduled: ['#1D4ED8', '#DBEAFE', '예정'],
  }
  const [color, bg, label] = cfg[status] ?? ['#374151', '#F3F4F6', status]
  return <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 6, background: bg, color }}>{label}</span>
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
      {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
        <button key={p} onClick={() => onChange(p)} style={{
          width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
          background: p === page ? '#111827' : '#F3F4F6', color: p === page ? '#fff' : '#374151',
        }}>{p}</button>
      ))}
    </div>
  )
}

function useToast() {
  const [toast, setToast] = useState('')
  const show = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }
  const Toast = toast ? (
    <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 2000, background: '#111827', color: '#fff', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
      ✓ {toast}
    </div>
  ) : null
  return { show, Toast }
}

// ── 대시보드 ──────────────────────────────────────────────────
function DashTab({ token, onTabChange }: { token: string | null; onTabChange: (t: Tab) => void }) {
  const { data: stats, loading } = useAdminFetch<any>('/api/admin/stats', token)
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'monthly'>('daily')
  const { data: chartRes } = useAdminFetch<any>(`/api/admin/stats/chart?period=${chartPeriod}`, token, [chartPeriod])
  const chartData = chartRes?.chart ?? []

  const KPI = stats ? [
    { label: '총 누적 거래액', value: `₩${(stats.revenue?.total ?? 0).toLocaleString()}`, icon: '💰', color: '#D1FAE5', tab: null },
    { label: '이번달 거래액',  value: `₩${(stats.revenue?.month ?? 0).toLocaleString()}`, icon: '📈', color: '#DBEAFE', tab: null },
    { label: '전체 회원',      value: `${(stats.users?.total ?? 0).toLocaleString()}명`,   icon: '👥', color: '#EDE9FE', tab: 'users' as Tab },
    { label: '활성 프로그램',  value: `${stats.programs?.active ?? 0}개`,                  icon: '📦', color: '#FEF3C7', tab: 'programs' as Tab },
    { label: '검수 대기',      value: `${stats.programs?.pending ?? 0}건`,                  icon: '⏳', color: '#FEE2E2', tab: 'programs' as Tab },
    { label: '정산 대기',      value: `₩${(stats.settlements?.pendingAmount ?? 0).toLocaleString()}`, icon: '🏦', color: '#F0FDF4', tab: 'settlements' as Tab },
  ] : []

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12, marginBottom: 24 }}>
        {loading ? Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #F0EDE8', height: 100 }} />
        )) : KPI.map(k => (
          <div key={k.label} onClick={() => k.tab && onTabChange(k.tab)}
            style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #F0EDE8', cursor: k.tab ? 'pointer' : 'default' }}
            onMouseEnter={e => { if (k.tab) e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: k.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 10 }}>{k.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#111827', marginBottom: 2 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* 매출 차트 */}
      <div style={{ background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #F0EDE8', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>매출 트렌드</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['daily', 'monthly'] as const).map(p => (
              <button key={p} onClick={() => setChartPeriod(p)}
                style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: chartPeriod === p ? '#111827' : '#F3F4F6', color: chartPeriod === p ? '#fff' : '#6B7280', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {p === 'daily' ? '일별 (30일)' : '월별 (12개월)'}
              </button>
            ))}
          </div>
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }}
                tickFormatter={v => chartPeriod === 'daily' ? v.slice(5) : v} />
              <YAxis yAxisId="rev" tick={{ fontSize: 10, fill: '#9CA3AF' }}
                tickFormatter={v => v >= 10000 ? `${Math.floor(v / 10000)}만` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} width={44} />
              <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 10, fill: '#9CA3AF' }} width={28} />
              <Tooltip
                formatter={(v, name) => [
                  name === 'revenue' ? `${Number(v).toLocaleString()}원` : `${v}건`,
                  name === 'revenue' ? '매출' : '주문수'
                ]}
                labelStyle={{ fontSize: 12 }}
                contentStyle={{ borderRadius: 10, border: '1px solid #F0EDE8', fontSize: 13 }} />
              <Legend formatter={(v) => v === 'revenue' ? '매출' : '주문수'} wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="rev" dataKey="revenue" fill="#4FC3F7" radius={[4,4,0,0]} name="revenue" />
              <Bar yAxisId="ord" dataKey="orders" fill="#111827" radius={[4,4,0,0]} name="orders" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 14 }}>
            아직 매출 데이터가 없습니다
          </div>
        )}
      </div>

      {stats?.recentOrders?.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #F0EDE8', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F5F4F1', fontSize: 14, fontWeight: 800, color: '#111827' }}>최근 주문</div>
          {stats.recentOrders.map((o: any) => (
            <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: '1px solid #F9F8F6' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.program?.title}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{o.buyer?.nickname} · {o.order_number}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', flexShrink: 0 }}>₩{o.amount.toLocaleString()}</div>
              <StatusBadge status={o.status} />
            </div>
          ))}
        </div>
      )}
    </>
  )
}

// ── 회원 관리 ─────────────────────────────────────────────────
function UsersTab({ token }: { token: string | null }) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const { show, Toast } = useToast()
  const url = `/api/admin/users?page=${page}&search=${query}&role=${roleFilter}`
  const { data, loading, reload } = useAdminFetch<any>(url, token, [page, query, roleFilter])
  const [modal, setModal] = useState<{ userId: string; nickname: string; currentPoints?: number; action: 'grant_points' | 'deduct_points' | 'change_role' | 'update_profile'; email?: string; phone?: string } | null>(null)
  const [modalVal, setModalVal] = useState('')
  const [modalReason, setModalReason] = useState('')
  const [profileNickname, setProfileNickname] = useState('')
  const [profilePhone, setProfilePhone] = useState('')
  const [profileEmail, setProfileEmail] = useState('')
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')

  const callAction = async (userId: string, body: object) => {
    setModalLoading(true); setModalError('')
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      const d = await res.json()
      if (!res.ok) { setModalError(d.error ?? '오류 발생'); return }
      setModal(null); setModalVal(''); setModalReason('')
      show('처리 완료!')
      reload()
    } finally { setModalLoading(false) }
  }

  const isPointsAction = modal?.action === 'grant_points' || modal?.action === 'deduct_points'
  const isProfileAction = modal?.action === 'update_profile'

  return (
    <>
      {Toast}
      {/* 전체 회원 수 */}
      {!loading && data?.total != null && (
        <div style={{ marginBottom: 12, fontSize: 13, color: '#6B7280', fontWeight: 600 }}>
          전체 회원 <span style={{ color: '#111827', fontWeight: 900 }}>{data.total.toLocaleString()}</span>명
          {roleFilter && <span style={{ marginLeft: 8, color: '#9CA3AF' }}>· 필터 결과 {data.total.toLocaleString()}명</span>}
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && (setPage(1), setQuery(search))}
          placeholder="닉네임 / 이메일 검색" style={{ flex: 1, minWidth: 200, padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14, fontFamily: 'inherit', outline: 'none' }} />
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
          style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14, fontFamily: 'inherit', background: '#fff', outline: 'none' }}>
          <option value="">전체 역할</option>
          <option value="buyer">구매·판매자 (buyer)</option>
          <option value="seller">구매·판매자 (seller)</option>
          <option value="manager">매니저</option>
          <option value="admin">관리자</option>
        </select>
        <button onClick={() => { setPage(1); setQuery(search) }} style={{ padding: '10px 20px', background: '#111827', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>검색</button>
      </div>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F0EDE8', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {['닉네임', '이메일', '역할', '포인트', '구매', '판매', '가입일', '관리'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', fontSize: 12, fontWeight: 700, color: '#6B7280', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF' }}>불러오는 중...</td></tr>
                : data?.users?.length === 0 ? <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF' }}>회원이 없습니다</td></tr>
                : data?.users?.map((u: any) => (
                  <tr key={u.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '12px 14px', fontSize: 14, fontWeight: 600, color: '#111827' }}>{u.nickname}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: '#6B7280' }}>{u.email ?? '—'}</td>
                    <td style={{ padding: '12px 14px' }}><RoleBadge role={u.role} /></td>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#4F46E5' }}>{u.points.toLocaleString()}P</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: '#6B7280' }}>{u._count?.orders ?? 0}건</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: '#6B7280' }}>{u._count?.programs ?? 0}건</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{new Date(u.created_at).toLocaleDateString('ko-KR')}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <button onClick={() => { setModal({ userId: u.id, nickname: u.nickname, currentPoints: u.points, action: 'grant_points' }); setModalVal('') }}
                          style={{ fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 6, border: 'none', background: '#EDE9FE', color: '#5B21B6', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>P 지급</button>
                        <button onClick={() => { setModal({ userId: u.id, nickname: u.nickname, currentPoints: u.points, action: 'deduct_points' }); setModalVal('') }}
                          style={{ fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 6, border: 'none', background: '#FEE2E2', color: '#991B1B', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>P 회수</button>
                        <button onClick={() => { setModal({ userId: u.id, nickname: u.nickname, action: 'change_role' }); setModalVal(u.role) }}
                          style={{ fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 6, border: 'none', background: '#DBEAFE', color: '#1D4ED8', cursor: 'pointer', fontFamily: 'inherit' }}>역할</button>
                        <button onClick={() => { setModal({ userId: u.id, nickname: u.nickname, action: 'update_profile', email: u.email, phone: u.phone }); setProfileNickname(u.nickname); setProfilePhone(u.phone ?? ''); setProfileEmail(u.email ?? '') }}
                          style={{ fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 6, border: 'none', background: '#F0FDF4', color: '#15803D', cursor: 'pointer', fontFamily: 'inherit' }}>프로필</button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={setPage} />
      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => { setModal(null); setModalError('') }} />
          <div style={{ position: 'relative', background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 380 }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4, color: '#111827' }}>
              {modal.action === 'grant_points' ? '포인트 지급' : modal.action === 'deduct_points' ? '포인트 회수' : modal.action === 'change_role' ? '역할 변경' : '프로필 편집'}
              <span style={{ color: '#6B7280', fontWeight: 600 }}> — {modal.nickname}</span>
            </div>
            {isPointsAction && modal.currentPoints != null && (
              <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>
                현재 보유 포인트: <span style={{ color: '#4F46E5', fontWeight: 700 }}>{modal.currentPoints.toLocaleString()}P</span>
              </div>
            )}
            {isPointsAction && (
              <>
                <input type="number" value={modalVal} onChange={e => setModalVal(e.target.value)}
                  placeholder={modal.action === 'grant_points' ? '지급할 포인트 입력' : '회수할 포인트 입력'} min={1}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 15, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }} />
                <input value={modalReason} onChange={e => setModalReason(e.target.value)}
                  placeholder={modal.action === 'grant_points' ? '지급 사유 (선택)' : '회수 사유 (선택)'}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14, marginBottom: 12, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }} />
                {modalError && <div style={{ background: '#FEF2F2', color: '#991B1B', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>✕ {modalError}</div>}
                <button
                  onClick={() => callAction(modal.userId, { action: modal.action, points: parseInt(modalVal), reason: modalReason })}
                  disabled={!modalVal || modalLoading}
                  style={{ width: '100%', padding: '13px', background: modal.action === 'grant_points' ? '#4F46E5' : '#DC2626', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {modalLoading ? '처리 중...' : modal.action === 'grant_points' ? '포인트 지급' : '포인트 회수'}
                </button>
              </>
            )}
            {modal.action === 'change_role' && (
              <>
                <select value={modalVal} onChange={e => setModalVal(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 15, marginBottom: 16, fontFamily: 'inherit', background: '#fff', outline: 'none' }}>
                  <option value="buyer">구매·판매자</option>
                  <option value="manager">매니저</option>
                  <option value="admin">관리자 (최대 3명)</option>
                </select>
                {modalError && <div style={{ background: '#FEF2F2', color: '#991B1B', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>✕ {modalError}</div>}
                <button onClick={() => callAction(modal.userId, { action: 'change_role', role: modalVal })} disabled={modalLoading}
                  style={{ width: '100%', padding: '13px', background: '#111827', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {modalLoading ? '처리 중...' : '역할 변경'}
                </button>
              </>
            )}
            {isProfileAction && (
              <>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', marginBottom: 5 }}>닉네임</div>
                  <input value={profileNickname} onChange={e => setProfileNickname(e.target.value)}
                    placeholder="닉네임 (2자 이상)"
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }} />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', marginBottom: 5 }}>이메일 (관리자만 변경 가능)</div>
                  <input value={profileEmail} onChange={e => setProfileEmail(e.target.value)}
                    placeholder="이메일"
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', marginBottom: 5 }}>전화번호</div>
                  <input value={profilePhone} onChange={e => setProfilePhone(e.target.value)}
                    placeholder="010-0000-0000"
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }} />
                </div>
                {modalError && <div style={{ background: '#FEF2F2', color: '#991B1B', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>✕ {modalError}</div>}
                <button
                  onClick={() => callAction(modal.userId, { action: 'update_profile', nickname: profileNickname, email: profileEmail, phone: profilePhone })}
                  disabled={modalLoading}
                  style={{ width: '100%', padding: '13px', background: '#15803D', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {modalLoading ? '저장 중...' : '프로필 저장'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// ── 프로그램 관리 ─────────────────────────────────────────────
function ProgramsTab({ token }: { token: string | null }) {
  const [statusFilter, setStatusFilter] = useState('draft')
  const [page, setPage] = useState(1)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { show, Toast } = useToast()

  const url = `/api/admin/programs?page=${page}&status=${statusFilter}`
  const { data, loading, reload } = useAdminFetch<any>(url, token, [page, statusFilter])

  const callApprove = async (id: string, method: 'PUT' | 'DELETE', reason?: string) => {
    setActionLoading(id)
    await fetch(`/api/admin/programs/${id}/approve`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason }),
    })
    setActionLoading(null)
    show(method === 'PUT' ? '승인 완료' : '반려 완료')
    reload()
  }

  const callStatus = async (id: string, status: string) => {
    setActionLoading(id)
    await fetch(`/api/admin/programs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    })
    setActionLoading(null)
    show('상태 변경 완료')
    reload()
  }

  return (
    <>
      {Toast}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[['draft','검수 대기'], ['active','판매중'], ['paused','일시중지'], ['deleted','삭제'], ['','전체']].map(([v, l]) => (
          <button key={v} onClick={() => { setStatusFilter(v); setPage(1) }}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
              background: statusFilter === v ? '#111827' : '#F3F4F6', color: statusFilter === v ? '#fff' : '#6B7280' }}>{l}</button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? <div style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF' }}>불러오는 중...</div>
          : data?.programs?.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 16, padding: '40px', textAlign: 'center', border: '1px solid #F0EDE8' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>해당 프로그램이 없습니다</div>
            </div>
          ) : data?.programs?.map((p: any) => (
            <div key={p.id} style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', border: '1px solid #F0EDE8', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>{p.title}</span>
                  <StatusBadge status={p.status} />
                </div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                  {p.seller?.nickname} · ₩{p.price.toLocaleString()} · 주문 {p._count?.orders ?? 0}건 · 리뷰 {p._count?.reviews ?? 0}개
                </div>
                <div style={{ fontSize: 11, color: '#C0BDB8', marginTop: 2 }}>{new Date(p.created_at).toLocaleDateString('ko-KR')}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                {p.status === 'draft' && (
                  <>
                    <button onClick={() => callApprove(p.id, 'PUT')} disabled={actionLoading === p.id}
                      style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                      ✅ 승인
                    </button>
                    <button onClick={() => callApprove(p.id, 'DELETE', '기준 미충족')} disabled={actionLoading === p.id}
                      style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                      ❌ 반려
                    </button>
                  </>
                )}
                {p.status === 'active' && (
                  <button onClick={() => callStatus(p.id, 'paused')} disabled={actionLoading === p.id}
                    style={{ background: '#FEF3C7', color: '#92400E', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                    ⏸ 일시중지
                  </button>
                )}
                {p.status === 'paused' && (
                  <button onClick={() => callStatus(p.id, 'active')} disabled={actionLoading === p.id}
                    style={{ background: '#D1FAE5', color: '#065F46', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                    ▶ 재개
                  </button>
                )}
                {p.status !== 'deleted' && (
                  <button onClick={() => { if (confirm(`"${p.title}"을(를) 삭제하시겠습니까?`)) callStatus(p.id, 'deleted') }} disabled={actionLoading === p.id}
                    style={{ background: '#F3F4F6', color: '#6B7280', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                    🗑 삭제
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>
      <Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={setPage} />
    </>
  )
}

// ── 주문 관리 ─────────────────────────────────────────────────
function OrdersTab({ token }: { token: string | null }) {
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { show, Toast } = useToast()
  const url = `/api/admin/orders?page=${page}&status=${statusFilter}`
  const { data, loading, reload } = useAdminFetch<any>(url, token, [page, statusFilter])

  const callAction = async (orderId: string, action: string) => {
    if (action === 'refund' && !confirm('환불 처리하시겠습니까? 다운로드 권한도 취소됩니다.')) return
    setActionLoading(orderId)
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action }),
    })
    setActionLoading(null)
    if (res.ok) { show('처리 완료'); reload() }
  }

  return (
    <>
      {Toast}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[['','전체'], ['pending','대기'], ['paid','결제완료'], ['confirmed','확정'], ['refunded','환불'], ['cancelled','취소']].map(([v, l]) => (
          <button key={v} onClick={() => { setStatusFilter(v); setPage(1) }}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
              background: statusFilter === v ? '#111827' : '#F3F4F6', color: statusFilter === v ? '#fff' : '#6B7280' }}>{l}</button>
        ))}
      </div>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F0EDE8', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {['주문번호', '구매자', '프로그램', '금액', '상태', '일시', '관리'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', fontSize: 12, fontWeight: 700, color: '#6B7280', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF' }}>불러오는 중...</td></tr>
                : data?.orders?.length === 0 ? <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF' }}>주문이 없습니다</td></tr>
                : data?.orders?.map((o: any) => (
                  <tr key={o.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '11px 14px', fontSize: 12, fontFamily: 'monospace', color: '#6B7280', whiteSpace: 'nowrap' }}>{o.order_number}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: '#111827' }}>{o.buyer?.nickname}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#374151', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.program?.title}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>₩{o.amount.toLocaleString()}</td>
                    <td style={{ padding: '11px 14px' }}><StatusBadge status={o.status} /></td>
                    <td style={{ padding: '11px 14px', fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{new Date(o.created_at).toLocaleDateString('ko-KR')}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {o.status === 'paid' && (
                          <button onClick={() => callAction(o.id, 'confirm')} disabled={actionLoading === o.id}
                            style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 5, border: 'none', background: '#D1FAE5', color: '#065F46', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>확정</button>
                        )}
                        {['paid', 'confirmed'].includes(o.status) && (
                          <button onClick={() => callAction(o.id, 'refund')} disabled={actionLoading === o.id}
                            style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 5, border: 'none', background: '#FEE2E2', color: '#991B1B', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>환불</button>
                        )}
                        {o.status === 'paid' && (
                          <button onClick={() => callAction(o.id, 'grant_permissions')} disabled={actionLoading === o.id}
                            style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 5, border: 'none', background: '#EDE9FE', color: '#5B21B6', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>권한부여</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={setPage} />
    </>
  )
}

// ── 정산 관리 ─────────────────────────────────────────────────
function SettlementsTab({ token }: { token: string | null }) {
  const [statusFilter, setStatusFilter] = useState('pending')
  const [page, setPage] = useState(1)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { show, Toast } = useToast()
  const url = `/api/admin/settlements?page=${page}&status=${statusFilter}`
  const { data, loading, reload } = useAdminFetch<any>(url, token, [page, statusFilter])

  const handleSettle = async (id: string, action: string) => {
    setActionLoading(id)
    await fetch(`/api/admin/settlements/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action }),
    })
    setActionLoading(null)
    show('처리 완료')
    reload()
  }

  const summary = data?.summary ?? []
  const pendingAmt = summary.find((s: any) => s.status === 'pending')?._sum?.net_amount ?? 0
  const completedAmt = summary.find((s: any) => s.status === 'completed')?._sum?.net_amount ?? 0

  return (
    <>
      {Toast}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[['정산 대기', `₩${(pendingAmt ?? 0).toLocaleString()}`], ['정산 완료', `₩${(completedAmt ?? 0).toLocaleString()}`]].map(([l, v]) => (
          <div key={l} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #F0EDE8' }}>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>{l}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#111827' }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[['pending','대기'], ['scheduled','예정'], ['completed','완료'], ['held','보류'], ['','전체']].map(([v, l]) => (
          <button key={v} onClick={() => { setStatusFilter(v); setPage(1) }}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
              background: statusFilter === v ? '#111827' : '#F3F4F6', color: statusFilter === v ? '#fff' : '#6B7280' }}>{l}</button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? <div style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF' }}>불러오는 중...</div>
          : data?.settlements?.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 16, padding: '40px', textAlign: 'center', border: '1px solid #F0EDE8' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>정산 내역이 없습니다</div>
            </div>
          ) : data?.settlements?.map((s: any) => (
            <div key={s.id} style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', border: '1px solid #F0EDE8', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{s.seller?.nickname}</span>
                  <StatusBadge status={s.status} />
                </div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>{s.order?.program?.title} · {s.order?.order_number}</div>
                <div style={{ fontSize: 11, color: '#C0BDB8', marginTop: 2 }}>정산 예정: {new Date(s.scheduled_at).toLocaleDateString('ko-KR')}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#111827' }}>₩{s.net_amount.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>수수료 {(s.fee_rate * 100).toFixed(0)}% 제외</div>
              </div>
              {s.status !== 'completed' && (
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {s.status !== 'held' && (
                    <button onClick={() => handleSettle(s.id, 'complete')} disabled={actionLoading === s.id}
                      style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {actionLoading === s.id ? '처리중...' : '입금 처리'}
                    </button>
                  )}
                  <button onClick={() => handleSettle(s.id, s.status === 'held' ? 'release' : 'hold')} disabled={actionLoading === s.id}
                    style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 10, padding: '9px 14px', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {s.status === 'held' ? '보류 해제' : '보류'}
                  </button>
                </div>
              )}
            </div>
          ))}
      </div>
      <Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={setPage} />
    </>
  )
}

// ── 다운로드 권한 관리 ────────────────────────────────────────
function DownloadsTab({ token }: { token: string | null }) {
  const [page, setPage] = useState(1)
  const [grantOrderId, setGrantOrderId] = useState('')
  const [grantLoading, setGrantLoading] = useState(false)
  const { show, Toast } = useToast()
  const url = `/api/admin/downloads?page=${page}`
  const { data, loading, reload } = useAdminFetch<any>(url, token, [page])

  const handleGrant = async () => {
    if (!grantOrderId.trim()) return
    setGrantLoading(true)
    const res = await fetch('/api/admin/downloads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderId: grantOrderId.trim() }),
    })
    setGrantLoading(false)
    if (res.ok) { show('다운로드 권한 부여 완료'); setGrantOrderId(''); reload() }
    else { const d = await res.json(); alert(d.error ?? '실패') }
  }

  const handleRevoke = async (permissionId: string) => {
    if (!confirm('이 다운로드 권한을 취소하시겠습니까?')) return
    await fetch(`/api/admin/downloads/${permissionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    show('권한 취소 완료')
    reload()
  }

  return (
    <>
      {Toast}
      {/* 수동 권한 부여 */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #F0EDE8', marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 12 }}>다운로드 권한 수동 부여</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input value={grantOrderId} onChange={e => setGrantOrderId(e.target.value)} placeholder="주문 ID 입력"
            style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14, fontFamily: 'inherit', outline: 'none' }} />
          <button onClick={handleGrant} disabled={!grantOrderId.trim() || grantLoading}
            style={{ padding: '10px 20px', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
            {grantLoading ? '처리 중...' : '권한 부여'}
          </button>
        </div>
      </div>

      {/* 권한 목록 */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F0EDE8', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {['구매자', '프로그램', '파일명', '다운로드', '상태', '취소'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', fontSize: 12, fontWeight: 700, color: '#6B7280', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF' }}>불러오는 중...</td></tr>
                : data?.permissions?.length === 0 ? <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF' }}>다운로드 권한이 없습니다</td></tr>
                : data?.permissions?.map((p: any) => (
                  <tr key={p.id} style={{ borderTop: '1px solid #F3F4F6', opacity: p.is_revoked ? 0.5 : 1 }}>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: '#111827' }}>{p.buyer?.nickname}</td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: '#6B7280', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.order?.program?.title}</td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: '#374151', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.program_file?.file_name}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#374151' }}>{p.download_count}/{p.max_downloads}</td>
                    <td style={{ padding: '11px 14px' }}>
                      {p.is_revoked
                        ? <span style={{ fontSize: 11, fontWeight: 700, background: '#FEE2E2', color: '#991B1B', padding: '2px 8px', borderRadius: 5 }}>취소됨</span>
                        : <span style={{ fontSize: 11, fontWeight: 700, background: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: 5 }}>활성</span>}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      {!p.is_revoked && (
                        <button onClick={() => handleRevoke(p.id)}
                          style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 5, border: 'none', background: '#FEE2E2', color: '#991B1B', cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={setPage} />
    </>
  )
}

// ── 환전 관리 ─────────────────────────────────────────────────
const W_STATUS_CFG: Record<string, [string, string, string]> = {
  pending:    ['#92400E', '#FEF3C7', '신청완료'],
  processing: ['#1D4ED8', '#DBEAFE', '처리중'],
  completed:  ['#065F46', '#D1FAE5', '지급완료'],
  rejected:   ['#991B1B', '#FEE2E2', '거절됨'],
}
const WStatusBadge = ({ status }: { status: string }) => {
  const [color, bg, label] = W_STATUS_CFG[status] ?? ['#374151', '#F3F4F6', status]
  return <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 6, background: bg, color }}>{label}</span>
}

function WithdrawalsTab({ token }: { token: string | null }) {
  const [statusFilter, setStatusFilter] = useState('pending')
  const [page, setPage] = useState(1)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [noteModal, setNoteModal] = useState<{ id: string; action: string; label: string } | null>(null)
  const [note, setNote] = useState('')
  const { show, Toast } = useToast()
  const url = `/api/admin/withdrawals?page=${page}&status=${statusFilter}`
  const { data, loading, reload } = useAdminFetch<any>(url, token, [page, statusFilter])

  const callAction = async (id: string, action: string, adminNote?: string) => {
    setActionLoading(id)
    const res = await fetch(`/api/admin/withdrawals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, note: adminNote }),
    })
    setActionLoading(null)
    setNoteModal(null)
    if (res.ok) { show('처리 완료'); reload() }
    else { const d = await res.json(); alert(d.error ?? '오류 발생') }
  }

  const maskAccount = (num: string) =>
    num.length <= 4 ? num : num.slice(0, -4).replace(/./g, '*') + num.slice(-4)

  return (
    <>
      {Toast}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[['pending','신청완료'], ['processing','처리중'], ['completed','지급완료'], ['rejected','거절됨'], ['','전체']].map(([v, l]) => (
          <button key={v} onClick={() => { setStatusFilter(v); setPage(1) }}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
              background: statusFilter === v ? '#111827' : '#F3F4F6', color: statusFilter === v ? '#fff' : '#6B7280' }}>{l}</button>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F0EDE8', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {['판매자', '금액', '은행', '계좌번호', '예금자명', '상태', '신청일', '처리'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', fontSize: 12, fontWeight: 700, color: '#6B7280', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF' }}>불러오는 중...</td></tr>
                : data?.withdrawals?.length === 0
                ? <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF' }}>환전 신청이 없습니다</td></tr>
                : data?.withdrawals?.map((w: any) => (
                  <tr key={w.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{w.seller?.nickname}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{w.seller?.email ?? '—'}</div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 14, fontWeight: 900, color: '#111827', whiteSpace: 'nowrap' }}>
                      ₩{w.amount.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>{w.bankName}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: '#374151', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                      {maskAccount(w.accountNumber)}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: '#374151' }}>{w.accountHolder}</td>
                    <td style={{ padding: '12px 14px' }}><WStatusBadge status={w.status} /></td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                      {new Date(w.requestedAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {w.status === 'pending' && (
                          <button onClick={() => callAction(w.id, 'approve')} disabled={actionLoading === w.id}
                            style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 5, border: 'none', background: '#DBEAFE', color: '#1D4ED8', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                            처리중
                          </button>
                        )}
                        {(w.status === 'pending' || w.status === 'processing') && (
                          <button onClick={() => callAction(w.id, 'complete')} disabled={actionLoading === w.id}
                            style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 5, border: 'none', background: '#D1FAE5', color: '#065F46', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                            지급완료
                          </button>
                        )}
                        {(w.status === 'pending' || w.status === 'processing') && (
                          <button onClick={() => { setNoteModal({ id: w.id, action: 'reject', label: '거절' }); setNote('') }} disabled={actionLoading === w.id}
                            style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 5, border: 'none', background: '#FEE2E2', color: '#991B1B', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                            거절
                          </button>
                        )}
                        {w.adminNote && (
                          <span style={{ fontSize: 11, color: '#9CA3AF', padding: '3px 6px' }} title={w.adminNote}>📝</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={setPage} />

      {/* 거절 사유 모달 */}
      {noteModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setNoteModal(null)} />
          <div style={{ position: 'relative', background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 380 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 16 }}>환전 신청 {noteModal.label}</div>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="사유 입력 (선택, 판매자에게 표시됩니다)"
              rows={3}
              style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', resize: 'vertical', marginBottom: 14 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setNoteModal(null)}
                style={{ flex: 1, padding: '12px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                취소
              </button>
              <button onClick={() => callAction(noteModal.id, noteModal.action, note)}
                style={{ flex: 2, padding: '12px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                {noteModal.label} 확정
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── 쿠폰 관리 ────────────────────────────────────────────────
function CouponsTab({ token }: { token: string | null }) {
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ code: '', type: 'percentage', discountValue: '', scope: 'global', minPrice: '', maxDiscount: '', usageLimit: '', perUserLimit: '1', expiresAt: '', description: '' })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { show, Toast } = useToast()

  const load = useCallback(() => {
    if (!token) return
    setLoading(true)
    fetch('/api/my/coupons', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setCoupons(d.coupons ?? [])).finally(() => setLoading(false))
  }, [token])

  useEffect(() => { load() }, [load])

  const submit = async () => {
    if (!form.code.trim() || !form.discountValue) { setFormError('코드와 할인값은 필수입니다'); return }
    setSubmitting(true); setFormError('')
    const res = await fetch('/api/my/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        code: form.code.trim().toUpperCase(), type: form.type, discountValue: Number(form.discountValue), scope: form.scope,
        minPrice: form.minPrice ? Number(form.minPrice) : 0,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        perUserLimit: Number(form.perUserLimit) || 1,
        expiresAt: form.expiresAt || undefined,
        description: form.description || undefined,
      }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) { setFormError(data.error ?? '쿠폰 생성 실패'); return }
    setShowForm(false)
    setForm({ code: '', type: 'percentage', discountValue: '', scope: 'global', minPrice: '', maxDiscount: '', usageLimit: '', perUserLimit: '1', expiresAt: '', description: '' })
    load(); show('쿠폰 발급 완료')
  }

  const toggleActive = async (c: any) => {
    await fetch(`/api/my/coupons/${c.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ isActive: !c.is_active }) })
    setCoupons(prev => prev.map(x => x.id === c.id ? { ...x, is_active: !x.is_active } : x))
    show(c.is_active ? '비활성화됨' : '활성화됨')
  }

  const deleteCoupon = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    const res = await fetch(`/api/my/coupons/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) { const d = await res.json(); alert(d.error ?? '삭제 실패'); return }
    setCoupons(prev => prev.filter(c => c.id !== id)); show('삭제됨')
  }

  const scopeLabel: Record<string, string> = { global: '전체', seller: '판매자', program: '특정상품' }
  const scopeColor: Record<string, string> = { global: '#EDE9FE', seller: '#DBEAFE', program: '#D1FAE5' }
  const scopeText: Record<string, string>  = { global: '#5B21B6', seller: '#1D4ED8', program: '#065F46' }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff' }

  return (
    <>
      {Toast}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>🎟 쿠폰 관리 ({coupons.length})</div>
        <button onClick={() => { setShowForm(v => !v); setFormError('') }}
          style={{ padding: '9px 18px', background: '#111827', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
          + 쿠폰 발급
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F0EDE8', padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 14 }}>새 쿠폰 발급</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div><label style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: 3 }}>쿠폰 코드 *</label><input style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: '0.05em' }} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="ADMIN10" /></div>
            <div><label style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: 3 }}>할인 종류</label><select style={inputStyle} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}><option value="percentage">% 할인</option><option value="fixed">금액 할인(원)</option></select></div>
            <div><label style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: 3 }}>할인값 *</label><input style={inputStyle} type="number" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))} placeholder={form.type === 'percentage' ? '10' : '5000'} /></div>
            <div><label style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: 3 }}>적용 범위</label><select style={inputStyle} value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))}><option value="global">전체 상품</option><option value="seller">특정 판매자</option></select></div>
            <div><label style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: 3 }}>최소 금액(원)</label><input style={inputStyle} type="number" value={form.minPrice} onChange={e => setForm(f => ({ ...f, minPrice: e.target.value }))} placeholder="0" /></div>
            {form.type === 'percentage' && <div><label style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: 3 }}>최대 할인 한도(원)</label><input style={inputStyle} type="number" value={form.maxDiscount} onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value }))} placeholder="제한 없음" /></div>}
            <div><label style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: 3 }}>총 사용 한도</label><input style={inputStyle} type="number" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} placeholder="무제한" /></div>
            <div><label style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: 3 }}>인당 횟수</label><input style={inputStyle} type="number" value={form.perUserLimit} onChange={e => setForm(f => ({ ...f, perUserLimit: e.target.value }))} min="1" /></div>
            <div><label style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: 3 }}>만료일</label><input style={inputStyle} type="datetime-local" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} /></div>
            <div style={{ gridColumn: '1/-1' }}><label style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: 3 }}>설명</label><input style={inputStyle} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="쿠폰 설명 (선택)" /></div>
          </div>
          {formError && <div style={{ fontSize: 13, color: '#DC2626', fontWeight: 700, marginBottom: 10 }}>✕ {formError}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '9px 16px', border: '1.5px solid #E5E7EB', borderRadius: 9, background: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#374151' }}>취소</button>
            <button onClick={submit} disabled={submitting} style={{ padding: '9px 20px', border: 'none', borderRadius: 9, background: '#111827', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>{submitting ? '생성 중...' : '발급'}</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF', fontSize: 14 }}>불러오는 중...</div>
      ) : coupons.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎟</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>발급된 쿠폰이 없습니다</div>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F0EDE8', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead><tr style={{ background: '#F9FAFB', borderBottom: '1px solid #F0EDE8' }}>
                {['코드', '할인', '범위', '사용/한도', '만료일', '상태', '작성자', '액션'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, color: '#6B7280', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {coupons.map(c => {
                  const expired = c.expires_at ? new Date(c.expires_at) < new Date() : false
                  const exhausted = c.usage_limit !== null && c.used_count >= c.usage_limit
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid #F9F8F6' }}>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 800, fontSize: 13, color: '#111827', whiteSpace: 'nowrap' }}>{c.code}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: '#4F46E5', whiteSpace: 'nowrap' }}>
                        {c.type === 'percentage' ? `${c.discount_value}%` : `${c.discount_value.toLocaleString()}원`}
                        {c.max_discount ? ` (최대 ${c.max_discount.toLocaleString()}원)` : ''}
                      </td>
                      <td style={{ padding: '10px 14px' }}><span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: scopeColor[c.scope], color: scopeText[c.scope] }}>{scopeLabel[c.scope]}</span></td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>{c.used_count}/{c.usage_limit ?? '∞'}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{c.expires_at ? new Date(c.expires_at).toLocaleDateString('ko-KR') : '없음'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        {expired ? <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: '#FEE2E2', color: '#991B1B' }}>만료</span>
                          : exhausted ? <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: '#FEF3C7', color: '#92400E' }}>소진</span>
                          : c.is_active ? <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: '#D1FAE5', color: '#065F46' }}>활성</span>
                          : <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: '#F3F4F6', color: '#9CA3AF' }}>비활성</span>}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{c.creator?.nickname}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => toggleActive(c)} style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 5, border: 'none', background: '#F3F4F6', color: '#374151', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                            {c.is_active ? '비활성화' : '활성화'}
                          </button>
                          <button onClick={() => deleteCoupon(c.id)} style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 5, border: 'none', background: '#FEE2E2', color: '#991B1B', cursor: 'pointer', fontFamily: 'inherit' }}>삭제</button>
                        </div>
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
  )
}

// ── 신고 관리 ─────────────────────────────────────────────────
function ReportsTab({ token }: { token: string | null }) {
  const [statusFilter, setStatusFilter] = useState('pending')
  const [page, setPage] = useState(1)
  const { show, Toast } = useToast()
  const { data, loading, reload } = useAdminFetch<any>(
    `/api/admin/reports?status=${statusFilter}&page=${page}`, token, [statusFilter, page]
  )
  const [modal, setModal] = useState<{ report: any } | null>(null)
  const [note, setNote] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const REASON_LABEL: Record<string, string> = {
    inappropriate_content: '부적절한 콘텐츠',
    spam: '스팸/광고',
    copyright: '저작권 침해',
    fake: '허위 정보',
    other: '기타',
  }

  const doAction = async (reportId: string, action: string) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, adminNote: note || undefined }),
      })
      if (res.ok) { setModal(null); setNote(''); show(action === 'review' ? '신고 처리 완료' : '신고 기각 처리'); reload() }
    } finally { setActionLoading(false) }
  }

  const reports = data?.reports ?? []
  const total = data?.total ?? 0

  return (
    <>
      {Toast}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['pending', '미처리'], ['reviewed', '처리완료'], ['dismissed', '기각'], ['all', '전체']].map(([v, l]) => (
          <button key={v} onClick={() => { setStatusFilter(v); setPage(1) }}
            style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: statusFilter === v ? '#111827' : '#F3F4F6', color: statusFilter === v ? '#fff' : '#6B7280', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {l}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#6B7280', alignSelf: 'center' }}>총 {total}건</span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>불러오는 중...</div>
      ) : reports.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div style={{ fontWeight: 700 }}>신고 없음</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reports.map((r: any) => (
            <div key={r.id} style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', border: `1px solid ${r.status === 'pending' ? '#FCD34D' : '#F0EDE8'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 2 }}>
                    {r.program?.title ?? '삭제된 프로그램'}
                    <span style={{ fontSize: 11, marginLeft: 8, background: r.status === 'pending' ? '#FEF3C7' : r.status === 'reviewed' ? '#D1FAE5' : '#F3F4F6', color: r.status === 'pending' ? '#92400E' : r.status === 'reviewed' ? '#065F46' : '#6B7280', padding: '2px 8px', borderRadius: 5, fontWeight: 700 }}>
                      {r.status === 'pending' ? '미처리' : r.status === 'reviewed' ? '처리완료' : '기각'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>
                    판매자: {r.program?.seller?.nickname ?? '-'} · 신고자: {r.reporter?.nickname}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>
                  {new Date(r.created_at).toLocaleDateString('ko-KR')}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, background: '#EDE9FE', color: '#5B21B6', padding: '3px 10px', borderRadius: 6, fontWeight: 700 }}>
                  {REASON_LABEL[r.reason] ?? r.reason}
                </span>
                {r.detail && <span style={{ fontSize: 12, color: '#6B7280', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.detail}</span>}
                {r.status === 'pending' && (
                  <button onClick={() => { setModal({ report: r }); setNote('') }}
                    style={{ marginLeft: 'auto', padding: '6px 14px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                    처리하기
                  </button>
                )}
              </div>
              {r.admin_note && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#6B7280', background: '#F9FAFB', borderRadius: 8, padding: '8px 12px' }}>
                  관리자 메모: {r.admin_note}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={Math.ceil(total / 20)} onChange={setPage} />

      {modal && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300 }} onClick={() => setModal(null)} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 20, padding: 28, width: 440, maxWidth: '90vw', zIndex: 301 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#111827', marginBottom: 4 }}>신고 처리</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>{modal.report.program?.title} · {REASON_LABEL[modal.report.reason]}</div>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="관리자 메모 (선택 · '[pause]' 포함 시 프로그램 일시중지)"
              rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '2px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 14 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => doAction(modal.report.id, 'review')} disabled={actionLoading}
                style={{ flex: 1, padding: '11px', background: '#111827', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                처리 완료
              </button>
              <button onClick={() => doAction(modal.report.id, 'dismiss')} disabled={actionLoading}
                style={{ flex: 1, padding: '11px', background: '#F3F4F6', color: '#6B7280', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                기각
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

// ── 설정 탭 ──────────────────────────────────────────────────
function SettingsTab({ token }: { token: string | null }) {
  const [rate, setRate] = useState('')
  const [saved, setSaved] = useState('')
  const [loading, setLoading] = useState(false)
  const { show, Toast } = useToast()

  useEffect(() => {
    if (!token) return
    fetch('/api/admin/settings', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const v = d.settings?.point_reward_rate ?? ''
        setRate(v)
        setSaved(v)
      })
  }, [token])

  const handleSave = async () => {
    if (!token) return
    setLoading(true)
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'point_reward_rate', value: rate }),
    })
    setLoading(false)
    if (res.ok) { setSaved(rate); show('저장되었습니다') }
    else { const d = await res.json(); show(d.error ?? '저장 실패') }
  }

  return (
    <div>
      {Toast}
      <h2 style={{ fontSize: 17, fontWeight: 900, color: '#111827', marginBottom: 20 }}>플랫폼 설정</h2>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', maxWidth: 480 }}>
        <div style={{ marginBottom: 6, fontWeight: 800, fontSize: 14, color: '#111827' }}>구매 포인트 적립률 (%)</div>
        <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
          결제 완료 금액의 입력한 % 만큼 구매자에게 포인트를 자동 지급합니다. (0 입력 시 미지급)
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={rate}
            onChange={e => setRate(e.target.value)}
            placeholder="예: 5"
            style={{
              width: 120, padding: '10px 14px', border: '1.5px solid #E5E7EB', borderRadius: 10,
              fontSize: 15, fontWeight: 700, fontFamily: 'inherit', outline: 'none',
            }}
          />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#374151' }}>%</span>
          <button
            onClick={handleSave}
            disabled={loading || rate === saved}
            style={{
              padding: '10px 22px', background: rate === saved ? '#E5E7EB' : '#111827',
              color: rate === saved ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 800, cursor: rate === saved ? 'default' : 'pointer', fontFamily: 'inherit',
            }}
          >
            {loading ? '저장 중...' : '저장'}
          </button>
        </div>
        {saved && (
          <div style={{ marginTop: 14, fontSize: 13, color: '#059669', fontWeight: 700 }}>
            현재 적립률: {saved}%
          </div>
        )}
      </div>
    </div>
  )
}

// ── 메인 ─────────────────────────────────────────────────────
export default function AdminPage() {
  const { user, accessToken } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('dash')

  useEffect(() => {
    if (!user) router.replace('/login')
    else if (user.role !== 'admin' && user.role !== 'manager') router.replace('/')
  }, [user, router])

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) return null

  const TABS: [Tab, string][] = [
    ['dash',        '대시보드'],
    ['users',       '회원 관리'],
    ['programs',    '프로그램'],
    ['orders',      '주문 관리'],
    ['settlements', '정산'],
    ['downloads',   '다운로드 권한'],
    ['withdrawals', '환전 관리'],
    ['coupons',     '쿠폰 관리'],
    ['reports',     '신고 관리'],
    ['settings',    '설정'],
  ]

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <style>{`
        @media(max-width:640px){
          .admin-main{padding:20px 16px 60px!important;}
          .admin-tab-bar{overflow-x:auto;-webkit-overflow-scrolling:touch;}
          .admin-tab-bar::-webkit-scrollbar{display:none;}
          .admin-tab-btn{white-space:nowrap;padding:10px 12px!important;font-size:12px!important;}
        }
      `}</style>
      <Header />
      <main className="admin-main" style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 60px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111827', marginBottom: 2 }}>관리자 콘솔</h1>
            <div style={{ fontSize: 13, color: '#9CA3AF' }}>{user.nickname} · 링커스 운영 관리</div>
          </div>
          <span style={{ background: user.role === 'admin' ? '#7C3AED' : '#1D4ED8', color: '#fff', fontSize: 11, fontWeight: 800, padding: '5px 14px', borderRadius: 8 }}>
            {user.role === 'admin' ? 'ADMIN' : 'MANAGER'}
          </span>
        </div>
        <div className="admin-tab-bar" style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: '1px solid #F0EDE8' }}>
          {TABS.map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)} className="admin-tab-btn" style={{
              padding: '10px 16px', border: 'none', background: 'none', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
              color: tab === v ? '#111827' : '#9CA3AF',
              borderBottom: `2px solid ${tab === v ? '#111827' : 'transparent'}`,
              marginBottom: -1,
            }}>{l}</button>
          ))}
        </div>
        {tab === 'dash'        && <DashTab token={accessToken} onTabChange={setTab} />}
        {tab === 'users'       && <UsersTab token={accessToken} />}
        {tab === 'programs'    && <ProgramsTab token={accessToken} />}
        {tab === 'orders'      && <OrdersTab token={accessToken} />}
        {tab === 'settlements' && <SettlementsTab token={accessToken} />}
        {tab === 'downloads'   && <DownloadsTab token={accessToken} />}
        {tab === 'withdrawals' && <WithdrawalsTab token={accessToken} />}
        {tab === 'coupons'     && <CouponsTab token={accessToken} />}
        {tab === 'reports'     && <ReportsTab token={accessToken} />}
        {tab === 'settings'    && <SettingsTab token={accessToken} />}
      </main>
    </div>
  )
}
