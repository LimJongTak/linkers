'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/store/auth'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, user } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const at = searchParams.get('at')
    if (at) {
      login(at, { id: 'kakao-user', nickname: '카카오 사용자', role: 'buyer' })
      router.replace('/')
    }
  }, [searchParams, login, router])

  useEffect(() => {
    if (user) router.replace('/')
  }, [user, router])

  const handleKakaoLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID
    const redirectUri = `${window.location.origin}/api/auth/kakao/callback`
    if (!clientId) { handleDemoLogin('buyer', '김지수', '구매자'); return }
    window.location.href = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`
  }

  const handleDemoLogin = (role: 'buyer' | 'seller' | 'admin', name: string, label: string) => {
    setLoading(role)
    setNotice(`${label} 계정으로 로그인 중...`)
    setTimeout(() => {
      login('demo-token-' + role, { id: 'demo-' + role, nickname: name, role })
      if (role === 'seller') router.push('/seller/dashboard')
      else if (role === 'admin') router.push('/admin')
      else router.push('/')
    }, 800)
  }

  const isDev = !process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#111827 0%,#1F2D45 50%,#111827 100%)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:"'Pretendard Variable',Pretendard,-apple-system,sans-serif" }}>
      <style>{`
        .kakao-btn{width:100%;background:#FEE500;color:#1A1A1A;border:none;border-radius:14px;padding:16px;font-size:16px;font-weight:900;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:10px;transition:all 0.15s;}
        .kakao-btn:hover:not(:disabled){background:#FFD700;transform:translateY(-1px);box-shadow:0 8px 24px rgba(254,229,0,0.35);}
        .kakao-btn:disabled{opacity:0.7;cursor:not-allowed;}
        .demo-btn{width:100%;background:rgba(255,255,255,0.08);color:#fff;border:1.5px solid rgba(255,255,255,0.15);border-radius:12px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:10px;transition:all 0.15s;text-align:left;}
        .demo-btn:hover:not(:disabled){background:rgba(255,255,255,0.14);border-color:rgba(255,255,255,0.3);}
        .demo-btn:disabled{opacity:0.5;cursor:not-allowed;}
      `}</style>

      <Link href="/" style={{ fontSize:28,fontWeight:900,color:'#fff',letterSpacing:'-0.5px',textDecoration:'none',marginBottom:32 }}>
        링커스<span style={{ color:'#4FC3F7' }}>.</span>
      </Link>

      <div style={{ background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:24,padding:'36px 32px',width:'100%',maxWidth:420,backdropFilter:'blur(12px)' }}>
        <div style={{ textAlign:'center',marginBottom:28 }}>
          <h1 style={{ fontSize:22,fontWeight:900,color:'#fff',marginBottom:6 }}>로그인 / 회원가입</h1>
          <p style={{ fontSize:14,color:'rgba(255,255,255,0.45)' }}>카카오 계정으로 간편하게 시작하세요</p>
        </div>

        <button className="kakao-btn" onClick={handleKakaoLogin} disabled={loading !== null}>
          <span style={{ fontSize:22 }}>💬</span>
          {loading ? '로그인 중...' : '카카오로 시작하기'}
        </button>
        <p style={{ fontSize:11,color:'rgba(255,255,255,0.3)',textAlign:'center',marginTop:10 }}>카카오 계정이 없으면 자동으로 가입됩니다</p>

        {isDev && (
          <>
            <div style={{ display:'flex',alignItems:'center',gap:12,margin:'20px 0' }}>
              <div style={{ flex:1,height:1,background:'rgba(255,255,255,0.12)' }} />
              <span style={{ fontSize:11,color:'rgba(255,255,255,0.35)',fontWeight:600,whiteSpace:'nowrap' }}>개발 환경 — 데모 로그인</span>
              <div style={{ flex:1,height:1,background:'rgba(255,255,255,0.12)' }} />
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
              {([
                { role:'buyer' as const, name:'김지수', label:'구매자', icon:'🏫', desc:'프로그램 검색·구매·다운로드' },
                { role:'seller' as const, name:'이민준', label:'판매자', icon:'🎓', desc:'대시보드·프로그램 등록·정산' },
                { role:'admin' as const, name:'관리자', label:'관리자', icon:'⚙️', desc:'검수·회원·신고 전체 관리' },
              ]).map(({ role, name, label, icon, desc }) => (
                <button key={role} className="demo-btn" onClick={() => handleDemoLogin(role, name, label)} disabled={loading !== null}>
                  <span style={{ fontSize:20 }}>{icon}</span>
                  <div style={{ flex:1 }}>
                    <div>{label}로 체험하기</div>
                    <div style={{ fontSize:11,opacity:0.55,marginTop:1 }}>{desc}</div>
                  </div>
                  {loading === role && <span>⏳</span>}
                </button>
              ))}
            </div>
          </>
        )}

        {notice && <div style={{ marginTop:16,textAlign:'center',fontSize:13,color:'#4FC3F7',fontWeight:700 }}>{notice}</div>}
      </div>

      <p style={{ marginTop:20,fontSize:12,color:'rgba(255,255,255,0.3)',textAlign:'center' }}>
        로그인 시 이용약관 및 개인정보처리방침에 동의하게 됩니다
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh',background:'#111827' }} />}>
      <LoginContent />
    </Suspense>
  )
}
