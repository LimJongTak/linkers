'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { useAuth } from '@/store/auth'

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  active:  { label: '판매중',   bg: '#D1FAE5', color: '#065F46' },
  draft:   { label: '검수중',   bg: '#FEF3C7', color: '#92400E' },
  paused:  { label: '일시중지', bg: '#F3F4F6', color: '#6B7280' },
  deleted: { label: '삭제됨',   bg: '#FEE2E2', color: '#991B1B' },
}

const CATEGORY_ICON: Record<string, string> = {
  '레크리에이션': '🎯', '교육': '📚', '진로': '🔭', '예체능': '🎨', '재능봉사': '🤝',
}

interface Program {
  id: string
  title: string
  category: string
  price: number
  status: string
  ratingAvg: number
  reviewCount: number
  orderCount: number
  revenue: number
  thumbnailUrl: string | null
}

export default function MyProgramsPage() {
  const { user, accessToken } = useAuth()
  const router = useRouter()
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!user) router.replace('/login')
  }, [user, router])

  useEffect(() => {
    if (!accessToken) return
    fetch('/api/seller/stats', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => setPrograms(d.programs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [accessToken])

  const refresh = async () => {
    if (!accessToken) return
    const d = await fetch('/api/seller/stats', { headers: { Authorization: `Bearer ${accessToken}` } }).then(r => r.json())
    setPrograms(d.programs ?? [])
  }

  const programAction = async (id: string, method: string, body?: object) => {
    if (!accessToken) return
    setActionLoading(id)
    try {
      await fetch(`/api/seller/programs/${id}`, {
        method,
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        ...(body ? { body: JSON.stringify(body) } : {}),
      })
      await refresh()
    } finally {
      setActionLoading(null)
    }
  }

  if (!user) return null

  const activePrograms = programs.filter(p => p.status !== 'deleted')

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <style>{`
        @media(max-width:640px){
          .prog-main{padding:20px 16px 60px!important;}
        }
      `}</style>
      <Header />
      <main className="prog-main" style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 60px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/my" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: 22 }}>←</Link>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111827' }}>내 프로그램</h1>
            {!loading && <span style={{ fontSize: 13, color: '#9CA3AF' }}>{activePrograms.length}개</span>}
          </div>
          <Link href="/seller/programs/new"
            style={{ background: '#111827', color: '#fff', borderRadius: 12, padding: '10px 16px', fontSize: 13, fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            + 등록하기
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <div>불러오는 중...</div>
          </div>
        ) : activePrograms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9CA3AF' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#374151', marginBottom: 8 }}>등록한 프로그램이 없어요</div>
            <div style={{ fontSize: 14, marginBottom: 24 }}>나만의 자료나 강의를 등록하고 수익을 내보세요</div>
            <Link href="/seller/programs/new"
              style={{ background: '#111827', color: '#fff', borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>
              첫 프로그램 등록하기
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activePrograms.map(p => {
              const s = STATUS_STYLE[p.status] ?? STATUS_STYLE['draft']
              const icon = CATEGORY_ICON[p.category] ?? '📦'
              const isLoading = actionLoading === p.id
              return (
                <div key={p.id} style={{ background: '#fff', borderRadius: 18, border: '1px solid #F0EDE8', overflow: 'hidden', display: 'flex' }}>
                  {/* 썸네일 */}
                  <div style={{ width: 90, flexShrink: 0, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {p.thumbnailUrl ? (
                      <img src={p.thumbnailUrl} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: 32 }}>{icon}</span>
                    )}
                  </div>

                  {/* 본문 */}
                  <div style={{ flex: 1, padding: '16px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                      <Link href={`/programs/${p.id}`}
                        style={{ fontSize: 15, fontWeight: 800, color: '#111827', textDecoration: 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.title}
                      </Link>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 5, background: s.bg, color: s.color, flexShrink: 0 }}>
                        {s.label}
                      </span>
                    </div>

                    {/* 통계 */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>💰 {p.price.toLocaleString()}원</span>
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>📋 주문 {p.orderCount}건</span>
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>💵 수익 {p.revenue.toLocaleString()}원</span>
                      {p.reviewCount > 0 && (
                        <span style={{ fontSize: 12, color: '#F59E0B' }}>★ {parseFloat(String(p.ratingAvg)).toFixed(1)} ({p.reviewCount})</span>
                      )}
                    </div>

                    {/* 액션 버튼 */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <Link href={`/seller/programs/${p.id}/files`}
                        style={{ fontSize: 11, fontWeight: 700, background: '#F0F9FF', color: '#0369A1', borderRadius: 6, padding: '5px 10px', textDecoration: 'none' }}>
                        📁 파일 관리
                      </Link>
                      {p.status === 'active' && (
                        <button onClick={() => programAction(p.id, 'PATCH', { status: 'paused' })} disabled={isLoading}
                          style={{ fontSize: 11, fontWeight: 700, background: '#FEF3C7', color: '#92400E', borderRadius: 6, padding: '5px 10px', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                          ⏸ 일시중지
                        </button>
                      )}
                      {p.status === 'paused' && (
                        <button onClick={() => programAction(p.id, 'PATCH', { status: 'active' })} disabled={isLoading}
                          style={{ fontSize: 11, fontWeight: 700, background: '#D1FAE5', color: '#065F46', borderRadius: 6, padding: '5px 10px', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                          ▶ 재개
                        </button>
                      )}
                      <button onClick={() => { if (confirm('정말 삭제하시겠습니까?')) programAction(p.id, 'DELETE') }} disabled={isLoading}
                        style={{ fontSize: 11, fontWeight: 700, background: '#FEE2E2', color: '#991B1B', borderRadius: 6, padding: '5px 10px', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                        🗑 삭제
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
