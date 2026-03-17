'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/store/auth'

// ── 이메일 탭 ──────────────────────────────────────────────────
function EmailTab() {
  const router = useRouter()
  const { login } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [form, setForm] = useState({ email: '', password: '', passwordConfirm: '', nickname: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setError('')
    if (mode === 'register') {
      if (form.password !== form.passwordConfirm) { setError('비밀번호가 일치하지 않습니다'); return }
    }
    setLoading(true)
    try {
      const endpoint = mode === 'login' ? '/api/auth/email/login' : '/api/auth/email/register'
      const body = mode === 'login'
        ? { email: form.email, password: form.password }
        : { email: form.email, password: form.password, nickname: form.nickname }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail ?? data.error ?? '오류가 발생했습니다')

      login(data.accessToken, data.user)
      router.push('/')
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const INPUT: React.CSSProperties = {
    width: '100%', padding: '13px 14px', borderRadius: 12,
    border: '1.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)',
    color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  }

  const canSubmit = mode === 'login'
    ? form.email && form.password
    : form.email && form.password.length >= 8 && form.nickname.length >= 2 && form.password === form.passwordConfirm

  return (
    <div>
      {/* 로그인 / 회원가입 토글 */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: 4, marginBottom: 20 }}>
        {(['login', 'register'] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); setError('') }}
            style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', background: mode === m ? '#fff' : 'transparent', color: mode === m ? '#111827' : 'rgba(255,255,255,0.5)' }}>
            {m === 'login' ? '로그인' : '회원가입'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {mode === 'register' && (
          <input value={form.nickname} onChange={e => set('nickname', e.target.value)}
            placeholder="닉네임 (2자 이상)"
            style={INPUT}
            onFocus={e => (e.target.style.borderColor = '#4FC3F7')}
            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')} />
        )}
        <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
          placeholder="이메일"
          style={INPUT}
          onFocus={e => (e.target.style.borderColor = '#4FC3F7')}
          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')} />
        <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
          placeholder={mode === 'register' ? '비밀번호 (8자 이상)' : '비밀번호'}
          style={INPUT}
          onFocus={e => (e.target.style.borderColor = '#4FC3F7')}
          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')} />
        {mode === 'register' && (
          <input type="password" value={form.passwordConfirm} onChange={e => set('passwordConfirm', e.target.value)}
            placeholder="비밀번호 확인"
            style={{ ...INPUT, borderColor: form.passwordConfirm && form.password !== form.passwordConfirm ? '#EF4444' : 'rgba(255,255,255,0.15)' }}
            onFocus={e => (e.target.style.borderColor = '#4FC3F7')}
            onBlur={e => (e.target.style.borderColor = form.passwordConfirm && form.password !== form.passwordConfirm ? '#EF4444' : 'rgba(255,255,255,0.15)')} />
        )}
      </div>

      {error && (
        <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(239,68,68,0.15)', borderRadius: 10, fontSize: 13, color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.3)' }}>
          {error}
        </div>
      )}

      <button onClick={handleSubmit} disabled={loading || !canSubmit}
        style={{ width: '100%', marginTop: 14, padding: '14px', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 900, cursor: canSubmit && !loading ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'all 0.15s', background: canSubmit ? '#4FC3F7' : 'rgba(255,255,255,0.1)', color: canSubmit ? '#111827' : 'rgba(255,255,255,0.3)' }}>
        {loading ? '처리 중...' : mode === 'login' ? '로그인' : '가입하기'}
      </button>
    </div>
  )
}

// ── 로그인 페이지 본문 ─────────────────────────────────────────
function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, user } = useAuth()
  const [tab, setTab] = useState<'email' | 'social'>('email')
  const [demoLoading, setDemoLoading] = useState<string | null>(null)

  // OAuth 콜백 처리 (카카오 / 구글 공통)
  useEffect(() => {
    const at   = searchParams.get('at')
    const uid  = searchParams.get('uid')
    const nick = searchParams.get('nick')
    const role = searchParams.get('role') as 'buyer' | 'seller' | 'admin' | null
    const isNew = searchParams.get('new') === '1'
    if (at && uid && nick && role) {
      login(at, { id: uid, nickname: nick, role })
      router.replace(isNew ? '/onboarding' : '/')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    if (user) router.replace('/')
  }, [user, router])

  // 카카오 로그인
  const handleKakaoLogin = () => {
    const clientId    = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID
    if (!clientId) { alert('카카오 로그인 설정이 필요합니다. 관리자에게 문의하세요.'); return }
    const base = process.env.NEXT_PUBLIC_API_BASE ?? window.location.origin
    const redirectUri = `${base}/api/auth/kakao/callback`
    window.location.href = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`
  }

  // 구글 로그인
  const handleGoogleLogin = () => {
    const clientId    = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_API_BASE ?? window.location.origin}/api/auth/google/callback`
    if (!clientId) { alert('구글 로그인 설정이 필요합니다. .env.local에 NEXT_PUBLIC_GOOGLE_CLIENT_ID를 추가해주세요.'); return }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
    })
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  }

  // 데모 로그인 (개발 환경)
  const handleDemoLogin = (role: 'buyer' | 'seller' | 'admin', name: string) => {
    setDemoLoading(role)
    setTimeout(() => {
      login('demo-token-' + role, { id: 'demo-' + role, nickname: name, role })
      router.push('/')
    }, 500)
  }

  const isDev = !process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID

  const SOCIAL_BTN: React.CSSProperties = {
    width: '100%', padding: '14px 16px', border: 'none', borderRadius: 12,
    fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    transition: 'all 0.15s',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg,#111827 0%,#1F2D45 50%,#111827 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Pretendard Variable',Pretendard,-apple-system,sans-serif",
    }}>
      <Link href="/" style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', textDecoration: 'none', marginBottom: 28 }}>
        링커스<span style={{ color: '#4FC3F7' }}>.</span>
      </Link>

      <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: '32px 28px', width: '100%', maxWidth: 400, backdropFilter: 'blur(12px)' }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: '#fff', textAlign: 'center', marginBottom: 6 }}>시작하기</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 24 }}>
          링커스에 오신 걸 환영합니다
        </p>

        {/* 탭 전환 */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {([['email', '📧 이메일'], ['social', '소셜 로그인']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)}
              style={{ flex: 1, padding: '9px', border: `1.5px solid ${tab === v ? 'rgba(79,195,247,0.6)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 10, background: tab === v ? 'rgba(79,195,247,0.12)' : 'transparent', color: tab === v ? '#4FC3F7' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
              {l}
            </button>
          ))}
        </div>

        {/* 이메일 탭 */}
        {tab === 'email' && <EmailTab />}

        {/* 소셜 탭 */}
        {tab === 'social' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* 카카오 */}
            <button onClick={handleKakaoLogin} style={{ ...SOCIAL_BTN, background: '#FEE500', color: '#1A1A1A' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(254,229,0,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2C5.58 2 2 4.91 2 8.5c0 2.3 1.48 4.33 3.72 5.5L4.8 17.1c-.08.22.15.41.35.29L8.9 14.9c.36.04.73.06 1.1.06 4.42 0 8-2.91 8-6.5S14.42 2 10 2z" fill="#1A1A1A"/>
              </svg>
              카카오로 계속하기
            </button>

            {/* 구글 */}
            <button onClick={handleGoogleLogin} style={{ ...SOCIAL_BTN, background: '#fff', color: '#374151' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              구글로 계속하기
            </button>

            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: 4 }}>
              계정이 없으면 자동으로 가입됩니다
            </p>
          </div>
        )}

        {/* 개발 환경 데모 로그인 */}
        {isDev && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 12px' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 600, whiteSpace: 'nowrap' }}>개발 환경 빠른 접속</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { role: 'buyer' as const,  name: '김지수', label: '👤 일반 유저' },
                { role: 'seller' as const, name: '이민준', label: '🎓 판매자' },
                { role: 'admin' as const,  name: '관리자', label: '⚙️ 관리자' },
              ].map(({ role, name, label }) => (
                <button key={role} onClick={() => handleDemoLogin(role, name)} disabled={demoLoading !== null}
                  style={{ flex: 1, padding: '9px 6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}>
                  {demoLoading === role ? '⏳' : label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <p style={{ marginTop: 16, fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
        로그인 시 링커스 이용약관 및 개인정보처리방침에 동의하게 됩니다
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#111827' }} />}>
      <LoginContent />
    </Suspense>
  )
}
