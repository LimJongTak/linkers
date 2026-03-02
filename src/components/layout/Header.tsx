'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/store/auth'

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const nav = [
    { href: '/', label: '프로그램 찾기' },
    { href: '/sellers', label: '인기 판매자' },
    { href: '/notices', label: '공지사항' },
  ]

  const handleLogout = () => {
    logout()
    setUserMenuOpen(false)
    router.push('/')
  }

  return (
    <>
      <style>{`
        .hdr-nav-btn { background: none; border: none; font-size: 14px; color: #6B7280; cursor: pointer; padding: 6px 12px; border-radius: 8px; font-family: inherit; font-weight: 600; transition: all 0.15s; text-decoration: none; display: inline-block; }
        .hdr-nav-btn:hover, .hdr-nav-btn.active { color: #111827; background: #F3F4F6; }
        .hdr-kakao-btn { background: #FEE500; color: #1A1A1A; border: none; border-radius: 10px; padding: 9px 18px; font-size: 13px; font-weight: 800; cursor: pointer; font-family: inherit; display: flex; align-items: center; gap: 6px; text-decoration: none; white-space: nowrap; }
        .hdr-sell-btn { background: #111827; color: #fff; border: none; border-radius: 10px; padding: 9px 18px; font-size: 13px; font-weight: 800; cursor: pointer; font-family: inherit; text-decoration: none; white-space: nowrap; }
        .hdr-sell-btn:hover { background: #374151; }
        .hdr-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #4FC3F7, #667EEA); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 900; font-size: 14px; cursor: pointer; border: none; flex-shrink: 0; }
        .user-menu { position: absolute; top: calc(100% + 8px); right: 0; background: #fff; border: 1px solid #F0EDE8; border-radius: 14px; padding: 8px; min-width: 180px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); z-index: 200; }
        .user-menu a, .user-menu button { display: block; width: 100%; text-align: left; padding: 9px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; color: #374151; font-family: inherit; background: none; border: none; cursor: pointer; text-decoration: none; transition: background 0.1s; }
        .user-menu a:hover, .user-menu button:hover { background: #F9FAFB; }
        .mobile-menu { position: fixed; inset: 0; background: #fff; z-index: 150; padding: 20px 24px; display: flex; flex-direction: column; gap: 4px; }
        .mobile-nav-link { display: block; padding: 14px 16px; font-size: 16px; font-weight: 700; color: #111827; text-decoration: none; border-radius: 12px; }
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
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {user ? (
            <>
              {/* 판매자/관리자 전용 버튼 */}
              {(user.role === 'seller') && (
                <Link href="/seller/dashboard" className="hdr-sell-btn desktop-only">
                  대시보드
                </Link>
              )}
              {user.role === 'admin' && (
                <Link href="/admin" className="hdr-sell-btn desktop-only" style={{ background: '#7C3AED' }}>
                  관리자
                </Link>
              )}
              {user.role === 'buyer' && (
                <Link href="/seller/programs/new" className="hdr-sell-btn desktop-only">
                  프로그램 등록 →
                </Link>
              )}

              {/* 유저 아바타 + 드롭다운 */}
              <div style={{ position: 'relative' }}>
                <button className="hdr-avatar" onClick={() => setUserMenuOpen(v => !v)}>
                  {user.nickname[0]}
                </button>
                {userMenuOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setUserMenuOpen(false)} />
                    <div className="user-menu">
                      <div style={{ padding: '8px 14px 10px', borderBottom: '1px solid #F3F4F6', marginBottom: 4 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{user.nickname}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                          {user.role === 'buyer' ? '구매자' : user.role === 'seller' ? '판매자' : '관리자'}
                        </div>
                      </div>
                      <Link href="/my" onClick={() => setUserMenuOpen(false)}>마이페이지</Link>
                      <Link href="/my/orders" onClick={() => setUserMenuOpen(false)}>구매 내역</Link>
                      <Link href="/my/downloads" onClick={() => setUserMenuOpen(false)}>다운로드</Link>
                      {user.role === 'seller' && <Link href="/seller/dashboard" onClick={() => setUserMenuOpen(false)}>판매자 대시보드</Link>}
                      {user.role === 'admin' && <Link href="/admin" onClick={() => setUserMenuOpen(false)}>관리자 콘솔</Link>}
                      <div style={{ borderTop: '1px solid #F3F4F6', marginTop: 4, paddingTop: 4 }}>
                        <button onClick={handleLogout} style={{ color: '#EF4444 !important' }}>로그아웃</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="hdr-kakao-btn">
                <span style={{ fontSize: 16 }}>💬</span> 카카오 로그인
              </Link>
              <Link href="/seller/programs/new" className="hdr-sell-btn desktop-only">
                프로그램 등록 →
              </Link>
            </>
          )}

          {/* 모바일 햄버거 */}
          <button
            className="mobile-only"
            onClick={() => setMobileOpen(true)}
            style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', padding: 4 }}
          >
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
                <Link href="/my" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>마이페이지</Link>
                <Link href="/seller/programs/new" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>프로그램 등록</Link>
                <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="mobile-nav-link" style={{ width: '100%', textAlign: 'left', color: '#EF4444', fontFamily: 'inherit' }}>로그아웃</button>
              </>
            ) : (
              <Link href="/login" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>💬 카카오 로그인</Link>
            )}
          </div>
        </div>
      )}
    </>
  )
}
