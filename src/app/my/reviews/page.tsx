'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { useAuth } from '@/store/auth'
import { PROGRAMS } from '@/store/data'

const DEMO_REVIEWS = [
  {
    id: 'r1',
    program: PROGRAMS[0],
    rating: 5,
    content: '아이들이 정말 즐거워했어요! 첫 수업인데도 금방 친해지더라고요. 진행자분도 에너지가 넘치고 전문적이었습니다.',
    date: '2025.03.02',
    helpful: 12,
  },
  {
    id: 'r2',
    program: PROGRAMS[4],
    rating: 4,
    content: '수학과 AI를 연결하는 수업이 신선했어요. 학생들이 평소 수학을 어려워하는데 이 수업 후에 흥미를 갖게 됐습니다.',
    date: '2025.02.25',
    helpful: 7,
  },
]

export default function MyReviewsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [helpedIds, setHelpedIds] = useState<string[]>([])

  useEffect(() => { if (!user) router.replace('/login') }, [user, router])
  if (!user) return null

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <Header />
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Link href="/my" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: 22 }}>←</Link>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111827' }}>내 리뷰</h1>
          <span style={{ fontSize: 13, color: '#9CA3AF', marginLeft: 4 }}>{DEMO_REVIEWS.length}개</span>
        </div>

        {DEMO_REVIEWS.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9CA3AF' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#374151', marginBottom: 8 }}>아직 작성한 리뷰가 없어요</div>
            <div style={{ fontSize: 14, marginBottom: 24 }}>프로그램 진행 후 리뷰를 남겨보세요</div>
            <Link href="/my/orders" style={{ background: '#111827', color: '#fff', padding: '12px 24px', borderRadius: 12, textDecoration: 'none', fontWeight: 800, fontSize: 14 }}>
              구매 내역 보기
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {DEMO_REVIEWS.map(r => (
              <div key={r.id} style={{ background: '#fff', borderRadius: 18, padding: 22, border: '1px solid #F0EDE8' }}>
                {/* 프로그램 정보 */}
                <Link href={`/programs/${r.program.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #F3F4F6' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{r.program.icon}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{r.program.title}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>{r.program.seller} · {r.date}</div>
                  </div>
                </Link>

                {/* 별점 */}
                <div style={{ display: 'flex', gap: 3, marginBottom: 10 }}>
                  {[1,2,3,4,5].map(i => (
                    <span key={i} style={{ color: i <= r.rating ? '#F59E0B' : '#E5E7EB', fontSize: 18 }}>★</span>
                  ))}
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#111827', marginLeft: 4 }}>{r.rating}.0</span>
                </div>

                {/* 내용 */}
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, marginBottom: 14 }}>{r.content}</p>

                {/* 하단 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    onClick={() => setHelpedIds(p => p.includes(r.id) ? p.filter(x => x !== r.id) : [...p, r.id])}
                    style={{ background: helpedIds.includes(r.id) ? '#F0FDF4' : '#F9FAFB', border: `1.5px solid ${helpedIds.includes(r.id) ? '#86EFAC' : '#E5E7EB'}`, borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: helpedIds.includes(r.id) ? '#15803D' : '#6B7280' }}>
                    👍 도움돼요 {r.helpful + (helpedIds.includes(r.id) ? 1 : 0)}
                  </button>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ background: 'none', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#6B7280' }}>수정</button>
                    <button style={{ background: 'none', border: '1.5px solid #FEE2E2', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#EF4444' }}>삭제</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
