'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAuth } from '@/store/auth'

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, accessToken } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)      // 알림 미읽음 총계
  const [inquiryDot, setInquiryDot] = useState(false)   // 문의 빨간 점

  const nav = [
    { href: '/', label: '프로그램 찾기' },
    { href: '/sellers', label: '인기 판매자' },
    { href: '/notices', label: '공지사항' },
    { href: '/faq', label: 'FAQ' },
  ]

  useEffect(() => {
    if (!user || !accessToken) {
      setCartCount(0); setUnreadCount(0); setInquiryDot(false)
      return
    }
    const h = { Authorization: `Bearer ${accessToken}` }
    fetch('/api/cart', { headers: h })
      .then(r => r.ok ? r.json() : { items: [] })
      .then(d => setCartCount((d.items ?? []).length))
      .catch(() => {})
    fetch('/api/notifications', { headers: h })
      .then(r => r.ok ? r.json() : { unreadCount: 0 })
      .then(d => setUnreadCount(d.unreadCount ?? 0))
      .catch(() => {})
    fetch('/api/inquiries/count', { headers: h })
      .then(r => r.ok ? r.json() : { total: 0 })
      .then(d => setInquiryDot((d.total ?? 0) > 0))
      .catch(() => {})
  }, [user, accessToken])

  // 해당 페이지 방문 시 해당 빨간 점 제거
  useEffect(() => {
    if (pathname === '/my/notifications') setUnreadCount(0)
    if (pathname?.startsWith('/my/inquiries')) setInquiryDot(false)
  }, [pathname])

  const handleLogout = () => {
    logout()
    setUserMenuOpen(false)
    router.push('/')
  }

  const Dot = () => (
    <span style={{
      display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
      background: '#EF4444', marginLeft: 5, verticalAlign: 'middle', flexShrink: 0,
    }} />
  )

  return (
    <>
      <style>{`
        .hdr-nav-btn { background: none; border: none; font-size: 14px; color: #6B7280; cursor: pointer; padding: 6px 12px; border-radius: 8px; font-family: inherit; font-weight: 600; transition: all 0.15s; text-decoration: none; display: inline-block; }
        .hdr-nav-btn:hover, .hdr-nav-btn.active { color: #111827; background: #F3F4F6; }
        .hdr-kakao-btn { background: #FEE500; color: #1A1A1A; border: none; border-radius: 10px; padding: 9px 18px; font-size: 13px; font-weight: 800; cursor: pointer; font-family: inherit; display: flex; align-items: center; gap: 6px; text-decoration: none; white-space: nowrap; }
        .hdr-sell-btn { background: #111827; color: #fff; border: none; border-radius: 10px; padding: 9px 18px; font-size: 13px; font-weight: 800; cursor: pointer; font-family: inherit; text-decoration: none; white-space: nowrap; }
        .hdr-sell-btn:hover { background: #374151; }
        .hdr-icon-btn { position: relative; background: none; border: none; cursor: pointer; padding: 6px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px; transition: background 0.15s; text-decoration: none; color: #374151; }
        .hdr-icon-btn:hover { background: #F3F4F6; }
        .hdr-badge { position: absolute; top: 0; right: 0; background: #EF4444; color: #fff; font-size: 10px; font-weight: 900; min-width: 16px; height: 16px; border-radius: 8px; display: flex; align-items: center; justify-content: center; padding: 0 3px; line-height: 1; }
        .hdr-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #4FC3F7, #667EEA); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 900; font-size: 14px; cursor: pointer; border: none; flex-shrink: 0; }
        .user-menu { position: absolute; top: calc(100% + 8px); right: 0; background: #fff; border: 1px solid #F0EDE8; border-radius: 14px; padding: 8px; min-width: 200px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); z-index: 200; }
        .user-menu a, .user-menu button { display: flex; align-items: center; width: 100%; text-align: left; padding: 9px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; color: #374151; font-family: inherit; background: none; border: none; cursor: pointer; text-decoration: none; transition: background 0.1s; gap: 6px; }
        .user-menu a:hover, .user-menu button:hover { background: #F9FAFB; }
        .mobile-menu { position: fixed; inset: 0; background: #fff; z-index: 150; padding: 20px 24px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; }
        .mobile-nav-link { display: flex; align-items: center; gap: 6px; padding: 14px 16px; font-size: 16px; font-weight: 700; color: #111827; text-decoration: none; border-radius: 12px; }
        .mobile-nav-link:hover { background: #F3F4F6; }
        @media (min-width: 641px) { .mobile-only { display: none !important; } }
        @media (max-width: 640px) { .desktop-only { display: none !important; } }
      `}</style>

      <header style={{ background: '#fff', borderBottom: '1px solid #F0EDE8', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* 로고 + 네비 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <Link href="/" style={{ fontSize: 20, fontWeight: 900, color: '#111827', letterSpacing: '-0.5px', textDecoration: 'none' }}>
            링커스<span style={{ color: '#4FC3F7' }}>.</span>
          </Link>
          <nav className="desktop-only" style={{ display: 'flex', gap: 2 }}>
            {nav.map(({ href, label }) => (
              <Link key={href} href={href} className={`hdr-nav-btn ${pathname === href ? 'active' : ''}`}>
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* 우측 액션 */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {user ? (
            <>
              {(user.role === 'admin' || user.role === 'manager') && (
                <Link href="/admin" className="hdr-sell-btn desktop-only" style={{ background: user.role === 'admin' ? '#7C3AED' : '#1D4ED8' }}>
                  {user.role === 'admin' ? '관리자' : '매니저'}
                </Link>
              )}
              {(user.role === 'buyer' || user.role === 'seller') && (
                <Link href="/seller/programs/new" className="hdr-sell-btn desktop-only">
                  프로그램 등록 →
                </Link>
              )}

              {/* 장바구니 */}
              <Link href="/my/cart" className="hdr-icon-btn" title="장바구니">
                🛒
                {cartCount > 0 && <span className="hdr-badge">{cartCount > 9 ? '9+' : cartCount}</span>}
              </Link>

              {/* 알림 */}
              <Link href="/my/notifications" className="hdr-icon-btn" title="알림"
                onClick={() => setUnreadCount(0)}>
                🔔
                {unreadCount > 0 && <span className="hdr-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </Link>

              {/* 유저 아바타 + 드롭다운 */}
              <div style={{ position: 'relative' }}>
                <button className="hdr-avatar" onClick={() => setUserMenuOpen(v => !v)}
                  style={{ padding: 0, overflow: 'hidden' }}>
                  {user.profileImage
                    ? <img src={user.profileImage} alt={user.nickname} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} referrerPolicy="no-referrer" />
                    : user.nickname[0]}
                  {(unreadCount > 0 || inquiryDot) && (
                    <span style={{ position: 'absolute', top: 1, right: 1, width: 9, height: 9, borderRadius: '50%', background: '#EF4444', border: '2px solid #fff' }} />
                  )}
                </button>

                {userMenuOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setUserMenuOpen(false)} />
                    <div className="user-menu">
                      {/* 프로필 요약 */}
                      <div style={{ padding: '8px 14px 10px', borderBottom: '1px solid #F3F4F6', marginBottom: 4 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{user.nickname}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                          {user.role === 'admin' ? '관리자' : user.role === 'manager' ? '매니저' : '구매·판매 계정'}
                        </div>
                      </div>

                      <Link href="/my" onClick={() => setUserMenuOpen(false)}>🏠 마이페이지</Link>
                      <Link href="/my/cart" onClick={() => setUserMenuOpen(false)}>
                        🛒 장바구니{cartCount > 0 ? ` (${cartCount})` : ''}
                      </Link>
                      <Link href="/my/orders" onClick={() => setUserMenuOpen(false)}>📋 구매 내역</Link>
                      <Link href="/my/downloads" onClick={() => setUserMenuOpen(false)}>⬇️ 다운로드</Link>

                      {/* 1:1 문의 — 빨간 점 */}
                      <Link href="/my/inquiries" onClick={() => { setUserMenuOpen(false); setInquiryDot(false) }}>
                        💬 1:1 문의
                        {inquiryDot && <Dot />}
                      </Link>

                      {/* 알림 — 빨간 점 */}
                      <Link href="/my/notifications" onClick={() => { setUserMenuOpen(false); setUnreadCount(0) }}>
                        🔔 알림
                        {unreadCount > 0 && <Dot />}
                      </Link>

                      {(user.role === 'admin' || user.role === 'manager') && (
                        <Link href="/admin" onClick={() => setUserMenuOpen(false)}>
                          ⚙️ {user.role === 'admin' ? '관리자 콘솔' : '매니저 콘솔'}
                          {inquiryDot && <Dot />}
                        </Link>
                      )}

                      <div style={{ borderTop: '1px solid #F3F4F6', marginTop: 4, paddingTop: 4 }}>
                        <button onClick={handleLogout} style={{ color: '#EF4444' }}>🚪 로그아웃</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="hdr-sell-btn">
                로그인
              </Link>
              <Link href="/seller/programs/new" className="hdr-sell-btn desktop-only">
                프로그램 등록 →
              </Link>
            </>
          )}

          <button className="mobile-only" onClick={() => setMobileOpen(true)}
            style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', padding: 4 }}>
            ☰
          </button>
        </div>
      </header>

      {/* 모바일 메뉴 */}
      {mobileOpen && (
        <div className="mobile-menu">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#111827' }}>링커스<span style={{ color: '#4FC3F7' }}>.</span></span>
            <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>✕</button>
          </div>
          {nav.map(({ href, label }) => (
            <Link key={href} href={href} className="mobile-nav-link" onClick={() => setMobileOpen(false)}>{label}</Link>
          ))}
          <div style={{ borderTop: '1px solid #F0EDE8', marginTop: 12, paddingTop: 12 }}>
            {user ? (
              <>
                <Link href="/my" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>🏠 마이페이지</Link>
                <Link href="/my/cart" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
                  🛒 장바구니{cartCount > 0 ? ` (${cartCount})` : ''}
                </Link>
                <Link href="/my/notifications" className="mobile-nav-link" onClick={() => { setMobileOpen(false); setUnreadCount(0) }}>
                  🔔 알림{unreadCount > 0 ? ` (${unreadCount})` : ''}
                  {unreadCount > 0 && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#EF4444' }} />}
                </Link>
                <Link href="/my/inquiries" className="mobile-nav-link" onClick={() => { setMobileOpen(false); setInquiryDot(false) }}>
                  💬 1:1 문의
                  {inquiryDot && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#EF4444' }} />}
                </Link>
                {(user.role === 'admin' || user.role === 'manager') && (
                  <Link href="/admin" className="mobile-nav-link" onClick={() => setMobileOpen(false)}
                    style={{ color: user.role === 'admin' ? '#7C3AED' : '#1D4ED8', fontWeight: 800 }}>
                    ⚙️ {user.role === 'admin' ? '관리자 콘솔' : '매니저 콘솔'}
                  </Link>
                )}
                <Link href="/seller/programs/new" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>➕ 프로그램 등록</Link>
                <button onClick={() => { handleLogout(); setMobileOpen(false) }}
                  className="mobile-nav-link" style={{ width: '100%', textAlign: 'left', color: '#EF4444', fontFamily: 'inherit' }}>
                  🚪 로그아웃
                </button>
              </>
            ) : (
              <Link href="/login" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>🔑 로그인</Link>
            )}
          </div>
        </div>
      )}
    </>
  )
}
