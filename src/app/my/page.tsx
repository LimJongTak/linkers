'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { useAuth } from '@/store/auth'

export default function MyPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) router.replace('/login')
  }, [user, router])

  if (!user) return null

  const menus = [
    { href: '/my/orders',    icon: '📋', label: '구매 내역',     desc: '신청한 프로그램 확인' },
    { href: '/my/downloads', icon: '⬇️', label: '다운로드',      desc: '자료 다운로드 (최대 5회)' },
    { href: '/my/reviews',   icon: '⭐', label: '내 리뷰',       desc: '작성한 리뷰 관리' },
    ...(user.role === 'seller' ? [
      { href: '/seller/dashboard',     icon: '📊', label: '판매자 대시보드', desc: '수익·주문·프로그램 관리' },
      { href: '/seller/programs/new',  icon: '➕', label: '프로그램 등록',   desc: '새 프로그램 등록하기' },
    ] : [
      { href: '/seller/programs/new', icon: '🚀', label: '판매자 시작하기', desc: '내 프로그램 등록하고 수익 내기' },
    ]),
    ...(user.role === 'admin' ? [{ href: '/admin', icon: '⚙️', label: '관리자 콘솔', desc: '시스템 전체 관리' }] : []),
  ]

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <Header />

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px 60px' }}>
        {/* 프로필 카드 */}
        <div style={{ background: 'linear-gradient(135deg, #111827, #1F2D45)', borderRadius: 24, padding: 28, marginBottom: 24, display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #4FC3F7, #667EEA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{user.nickname[0]}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 2 }}>{user.nickname}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              {user.role === 'buyer' ? '구매자 계정' : user.role === 'seller' ? '판매자 계정' : '관리자 계정'}
            </div>
          </div>
          <div style={{ background: 'rgba(79,195,247,0.2)', color: '#4FC3F7', fontSize: 12, fontWeight: 800, padding: '5px 12px', borderRadius: 8 }}>
            {user.role === 'buyer' ? '구매자' : user.role === 'seller' ? '판매자' : 'ADMIN'}
          </div>
        </div>

        {/* 메뉴 그리드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
          {menus.map(m => (
            <Link key={m.href} href={m.href} style={{
              background: '#fff', borderRadius: 16, padding: '20px', textDecoration: 'none',
              border: '1px solid #F0EDE8', transition: 'all 0.2s', display: 'block',
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{m.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 3 }}>{m.label}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>{m.desc}</div>
            </Link>
          ))}
        </div>

        {/* 로그아웃 */}
        <button onClick={() => { logout(); router.push('/') }}
          style={{ width: '100%', background: '#fff', border: '1.5px solid #F0EDE8', borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 700, color: '#9CA3AF', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#F0EDE8'; e.currentTarget.style.color = '#9CA3AF' }}>
          로그아웃
        </button>
      </main>
    </div>
  )
}
