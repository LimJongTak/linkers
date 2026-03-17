'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { useAuth } from '@/store/auth'

export default function MyPage() {
  const { user, logout, accessToken } = useAuth()
  const router = useRouter()
  const [points, setPoints] = useState<number | null>(null)

  useEffect(() => {
    if (!user) { router.replace('/login'); return }
    fetch('/api/points', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => setPoints(d.points ?? 0))
      .catch(() => {})
  }, [user, accessToken, router])

  if (!user) return null

  const menus = [
    { href: '/my/points',            icon: '💰', label: '포인트',         desc: `보유 ${points !== null ? points.toLocaleString() + 'P' : '—'}` },
    { href: '/my/cart',              icon: '🛒', label: '장바구니',        desc: '담아둔 프로그램 한 번에 결제' },
    { href: '/my/orders',            icon: '📋', label: '구매 내역',      desc: '신청한 프로그램 확인' },
    { href: '/my/wishlist',          icon: '❤️', label: '찜 목록',         desc: '관심 프로그램 모아보기' },
    { href: '/my/coupons',           icon: '🎟', label: '내 쿠폰',           desc: user.role === 'admin' || user.role === 'manager' ? '쿠폰 발급 · 관리' : '쿠폰 등록 · 사용' },
    { href: '/my/inquiries',         icon: '💬', label: '1:1 문의',       desc: '판매자 · 관리자 문의 내역' },
    { href: '/my/notifications',     icon: '🔔', label: '알림 센터',      desc: '주문 · 환전 · 답변 알림' },
    { href: '/my/downloads',         icon: '⬇️', label: '다운로드',       desc: '자료 다운로드 (최대 5회)' },
    { href: '/my/reviews',           icon: '⭐', label: '내 리뷰',        desc: '작성한 리뷰 관리' },
    { href: '/my/programs',          icon: '📦', label: '내 프로그램',    desc: '등록한 프로그램 관리' },
    { href: '/my/sales',             icon: '💸', label: '판매 내역 · 수익금', desc: '판매 현황 및 환전 신청' },
    { href: '/seller/programs/new',  icon: '➕', label: '프로그램 등록',  desc: '새 프로그램 등록하기' },
    { href: '/seller/dashboard', icon: '🏪', label: '판매자 콘솔', desc: '매출·주문·리뷰·쿠폰 관리' },
    ...((user.role === 'admin' || user.role === 'manager') ? [{ href: '/admin', icon: '⚙️', label: user.role === 'admin' ? '관리자 콘솔' : '매니저 콘솔', desc: '시스템 전체 관리' }] : []),
  ]

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <style>{`
        @media(max-width:640px){
          .my-main{padding:20px 16px 60px!important;}
          .my-profile{padding:20px!important;gap:14px!important;}
          .my-menu-grid{grid-template-columns:1fr 1fr!important;}
        }
      `}</style>
      <Header />

      <main className="my-main" style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px 60px' }}>
        {/* 프로필 카드 */}
        <div className="my-profile" style={{ background: 'linear-gradient(135deg, #111827, #1F2D45)', borderRadius: 24, padding: 28, marginBottom: 16, display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #4FC3F7, #667EEA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
            {user.profileImage
              ? <img src={user.profileImage} alt={user.nickname} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
              : user.nickname[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.nickname}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              {user.role === 'admin' ? '관리자 계정' : user.role === 'manager' ? '매니저 계정' : '구매 · 판매 계정'}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
            <div style={{ background: 'rgba(79,195,247,0.2)', color: '#4FC3F7', fontSize: 12, fontWeight: 800, padding: '5px 12px', borderRadius: 8 }}>
              {user.role === 'admin' ? 'ADMIN' : user.role === 'manager' ? 'MANAGER' : '회원'}
            </div>
            <Link href="/my/profile" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, textDecoration: 'none' }}>
              프로필 수정
            </Link>
          </div>
        </div>

        {/* 포인트 배너 */}
        <Link href="/my/points" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(90deg,#4F46E5,#7C3AED)', borderRadius: 16,
          padding: '16px 20px', marginBottom: 24, textDecoration: 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>💰</span>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>보유 포인트</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>
                {points !== null ? points.toLocaleString() : '—'}<span style={{ fontSize: 13, marginLeft: 4, opacity: 0.8 }}>P</span>
              </div>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 12, fontWeight: 800, padding: '8px 14px', borderRadius: 8 }}>
            충전하기 →
          </div>
        </Link>

        {/* 메뉴 그리드 */}
        <div className="my-menu-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
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
