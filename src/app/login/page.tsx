'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/store/auth'

// ── 카카오 가입 모달 (실제 카카오 UX 재현) ───────────────────────
type ModalStep = 'consent' | 'profile' | 'done'

interface KakaoModalProps {
  onClose: () => void
  onComplete: (nickname: string, role: 'buyer' | 'seller') => void
  isNewUser: boolean
}

function KakaoModal({ onClose, onComplete, isNewUser }: KakaoModalProps) {
  const [step, setStep] = useState<ModalStep>(isNewUser ? 'consent' : 'profile')
  const [agreed, setAgreed] = useState({ service: false, privacy: false, marketing: false })
  const [nickname, setNickname] = useState('김지수')
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer')
  const [loading, setLoading] = useState(false)

  const allRequired = agreed.service && agreed.privacy

  const handleAllAgree = () => {
    const all = !(agreed.service && agreed.privacy && agreed.marketing)
    setAgreed({ service: all, privacy: all, marketing: all })
  }

  const handleNext = () => {
    if (step === 'consent') setStep('profile')
    else if (step === 'profile') {
      setLoading(true)
      setTimeout(() => { setStep('done') }, 900)
    }
  }

  const handleDone = () => {
    onComplete(nickname, role)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      {/* 오버레이 */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
        onClick={step === 'done' ? undefined : onClose}
      />

      {/* 모달 */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: 380,
        background: '#fff', borderRadius: 24, overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
        fontFamily: "'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
      }}>

        {/* ── 카카오 헤더 ─────────────────────────────── */}
        <div style={{ background: '#FEE500', padding: '20px 24px 16px', position: 'relative' }}>
          {step !== 'done' && (
            <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 18, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#1A1A1A', opacity: 0.5, lineHeight: 1 }}>✕</button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: '#1A1A1A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 20 }}>💬</span>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#1A1A1A' }}>카카오</div>
              <div style={{ fontSize: 11, color: '#3A3A3A', opacity: 0.7 }}>
                {step === 'consent' ? '서비스 이용 동의' : step === 'profile' ? '프로필 설정' : '가입 완료'}
              </div>
            </div>
          </div>
        </div>

        {/* ── 진행 표시줄 ─────────────────────────────── */}
        {isNewUser && (
          <div style={{ display: 'flex', height: 3 }}>
            {(['consent', 'profile', 'done'] as ModalStep[]).map((s, i) => (
              <div key={s} style={{
                flex: 1,
                background: ['consent','profile','done'].indexOf(step) >= i ? '#FEE500' : '#F0F0F0',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
        )}

        <div style={{ padding: '24px 24px 28px' }}>

          {/* ── STEP 1: 약관 동의 ──────────────────────── */}
          {step === 'consent' && (
            <>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#1A1A1A', marginBottom: 4 }}>링커스 서비스 이용 동의</div>
                <div style={{ fontSize: 13, color: '#888' }}>서비스 이용을 위해 아래 항목에 동의해주세요</div>
              </div>

              {/* 전체 동의 */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#FFFDE7', border: '1.5px solid #FEE500', borderRadius: 12, cursor: 'pointer', marginBottom: 12 }}>
                <div onClick={handleAllAgree} style={{
                  width: 22, height: 22, borderRadius: '50%', border: `2px solid ${agreed.service && agreed.privacy && agreed.marketing ? '#3E2A1E' : '#CCBBAA'}`,
                  background: agreed.service && agreed.privacy && agreed.marketing ? '#3E2A1E' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer',
                }}>
                  {agreed.service && agreed.privacy && agreed.marketing && <span style={{ color: '#FEE500', fontSize: 13, fontWeight: 900 }}>✓</span>}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1A1A1A' }}>전체 동의하기</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>선택 항목 포함 모두 동의합니다</div>
                </div>
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { key: 'service' as const, label: '(필수) 서비스 이용약관', required: true },
                  { key: 'privacy' as const, label: '(필수) 개인정보 수집·이용 동의', required: true },
                  { key: 'marketing' as const, label: '(선택) 마케팅 정보 수신 동의', required: false },
                ].map(({ key, label, required }) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: '#FAFAFA', borderRadius: 10, border: '1px solid #F0F0F0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1 }}>
                      <div
                        onClick={() => setAgreed(a => ({ ...a, [key]: !a[key] }))}
                        style={{
                          width: 20, height: 20, borderRadius: '50%', border: `2px solid ${agreed[key] ? '#3E2A1E' : '#CCC'}`,
                          background: agreed[key] ? '#3E2A1E' : '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                        {agreed[key] && <span style={{ color: '#FEE500', fontSize: 11, fontWeight: 900 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 13, color: required ? '#1A1A1A' : '#555', fontWeight: required ? 600 : 400 }}>{label}</span>
                    </label>
                    <span style={{ fontSize: 11, color: '#BBB', cursor: 'pointer', flexShrink: 0 }}>보기 〉</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 6, padding: '10px 14px', background: '#F8F8F8', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#999', lineHeight: 1.6 }}>
                  카카오 계정의 닉네임, 프로필 사진이 링커스에 제공됩니다.<br />
                  만 14세 미만 아동은 가입할 수 없습니다.
                </div>
              </div>

              <button
                onClick={handleNext}
                disabled={!allRequired}
                style={{
                  width: '100%', marginTop: 20, padding: '15px',
                  background: allRequired ? '#FEE500' : '#F0F0F0',
                  color: allRequired ? '#1A1A1A' : '#BBB',
                  border: 'none', borderRadius: 12,
                  fontSize: 15, fontWeight: 800, cursor: allRequired ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s',
                }}>
                동의하고 계속하기
              </button>
            </>
          )}

          {/* ── STEP 2: 프로필 확인 ────────────────────── */}
          {step === 'profile' && (
            <>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#1A1A1A', marginBottom: 4 }}>
                  {isNewUser ? '프로필을 확인해주세요' : '카카오 계정으로 로그인'}
                </div>
                <div style={{ fontSize: 13, color: '#888' }}>
                  {isNewUser ? '닉네임은 나중에 마이페이지에서 수정 가능합니다' : '아래 계정으로 로그인합니다'}
                </div>
              </div>

              {/* 카카오 프로필 카드 */}
              <div style={{ background: '#FAFAFA', border: '1px solid #F0F0F0', borderRadius: 16, padding: '18px 20px', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#FEE500,#F6CC00)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0, border: '2px solid #FEE500' }}>
                    😊
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>카카오 계정 닉네임</div>
                    <input
                      value={nickname}
                      onChange={e => setNickname(e.target.value)}
                      style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', border: 'none', background: 'none', outline: 'none', width: '100%', fontFamily: 'inherit' }}
                      placeholder="닉네임 입력"
                    />
                  </div>
                  <span style={{ fontSize: 11, color: '#CCC' }}>수정 〉</span>
                </div>
              </div>

              {/* 역할 선택 (링커스 전용) */}
              {isNewUser && (
                <>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 10 }}>
                    링커스를 어떻게 사용하실 건가요?
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    {[
                      { v: 'buyer' as const, label: '프로그램 구매', icon: '🏫', desc: '학교 담당자·교사' },
                      { v: 'seller' as const, label: '프로그램 판매', icon: '🎓', desc: '대학생·강사' },
                    ].map(({ v, label, icon, desc }) => (
                      <button
                        key={v}
                        onClick={() => setRole(v)}
                        style={{
                          flex: 1, padding: '14px 10px',
                          background: role === v ? '#FFFDE7' : '#FAFAFA',
                          border: `2px solid ${role === v ? '#FEE500' : '#E8E8E8'}`,
                          borderRadius: 12, cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}>
                        <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#1A1A1A' }}>{label}</div>
                        <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{desc}</div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              <button
                onClick={handleNext}
                disabled={!nickname.trim() || loading}
                style={{
                  width: '100%', padding: '15px',
                  background: nickname.trim() ? '#FEE500' : '#F0F0F0',
                  color: nickname.trim() ? '#1A1A1A' : '#BBB',
                  border: 'none', borderRadius: 12,
                  fontSize: 15, fontWeight: 800,
                  cursor: nickname.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                {loading
                  ? <><span style={{ fontSize: 16 }}>⏳</span> 가입 처리 중...</>
                  : isNewUser ? '가입 완료하기' : '로그인하기'
                }
              </button>
            </>
          )}

          {/* ── STEP 3: 완료 ───────────────────────────── */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
              <div style={{ fontSize: 19, fontWeight: 900, color: '#1A1A1A', marginBottom: 8 }}>
                {isNewUser ? '가입이 완료되었어요!' : '로그인 성공!'}
              </div>
              <div style={{ fontSize: 14, color: '#888', marginBottom: 6 }}>
                <span style={{ fontWeight: 700, color: '#1A1A1A' }}>{nickname}</span>님, 환영합니다 👋
              </div>
              <div style={{ fontSize: 13, color: '#AAA', marginBottom: 28 }}>
                {isNewUser
                  ? (role === 'seller' ? '판매자 대시보드로 이동합니다' : '링커스에서 최고의 교육 프로그램을 찾아보세요')
                  : '링커스로 이동합니다'}
              </div>

              {isNewUser && role === 'buyer' && (
                <div style={{ background: '#FFFDE7', border: '1.5px solid #FEE500', borderRadius: 12, padding: '12px 16px', marginBottom: 20, textAlign: 'left' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#856600', marginBottom: 4 }}>🎁  가입 축하 혜택</div>
                  <div style={{ fontSize: 12, color: '#856600' }}>첫 구매 10% 할인 쿠폰이 지급되었습니다!</div>
                </div>
              )}

              <button
                onClick={handleDone}
                style={{ width: '100%', padding: '15px', background: '#FEE500', color: '#1A1A1A', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
                {role === 'seller' && isNewUser ? '대시보드로 이동 →' : '링커스 시작하기 →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── 로그인 페이지 본문 ────────────────────────────────────────────
function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, user } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)

  // OAuth 콜백 처리
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

  // 실제 카카오 OAuth (키 있을 때)
  const handleKakaoLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID
    const redirectUri = `${window.location.origin}/api/auth/kakao/callback`
    if (clientId) {
      window.location.href = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`
      return
    }

    // 개발 환경: 카카오 모달 UI 시뮬레이션
    // sessionStorage로 최초 가입 여부 확인
    const visited = sessionStorage.getItem('linkers_kakao_visited')
    setIsNewUser(!visited)
    setShowModal(true)
  }

  const handleModalComplete = (nickname: string, role: 'buyer' | 'seller') => {
    sessionStorage.setItem('linkers_kakao_visited', '1')
    login('demo-token-kakao', { id: 'kakao-' + Date.now(), nickname, role })
    setShowModal(false)
    if (role === 'seller') router.push('/seller/dashboard')
    else router.push('/')
  }

  // 데모 로그인 (역할별 직접 선택)
  const handleDemoLogin = (role: 'buyer' | 'seller' | 'admin', name: string) => {
    setLoading(role)
    setTimeout(() => {
      login('demo-token-' + role, { id: 'demo-' + role, nickname: name, role })
      if (role === 'seller') router.push('/seller/dashboard')
      else if (role === 'admin') router.push('/admin')
      else router.push('/')
    }, 700)
  }

  const isDev = !process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID

  return (
    <>
      {showModal && (
        <KakaoModal
          isNewUser={isNewUser}
          onClose={() => setShowModal(false)}
          onComplete={handleModalComplete}
        />
      )}

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg,#111827 0%,#1F2D45 50%,#111827 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        fontFamily: "'Pretendard Variable',Pretendard,-apple-system,sans-serif",
      }}>
        <style>{`
          .kakao-btn { width:100%; background:#FEE500; color:#1A1A1A; border:none; border-radius:14px; padding:16px; font-size:16px; font-weight:900; cursor:pointer; font-family:inherit; display:flex; align-items:center; justify-content:center; gap:10px; transition:all 0.15s; }
          .kakao-btn:hover:not(:disabled) { background:#FFD700; transform:translateY(-1px); box-shadow:0 8px 24px rgba(254,229,0,0.35); }
          .kakao-btn:disabled { opacity:0.7; cursor:not-allowed; }
          .demo-btn { width:100%; background:rgba(255,255,255,0.07); color:#fff; border:1.5px solid rgba(255,255,255,0.13); border-radius:12px; padding:12px 16px; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; display:flex; align-items:center; gap:10px; transition:all 0.15s; text-align:left; }
          .demo-btn:hover:not(:disabled) { background:rgba(255,255,255,0.13); border-color:rgba(255,255,255,0.28); }
          .demo-btn:disabled { opacity:0.45; cursor:not-allowed; }
        `}</style>

        <Link href="/" style={{ fontSize:28, fontWeight:900, color:'#fff', letterSpacing:'-0.5px', textDecoration:'none', marginBottom:32 }}>
          링커스<span style={{ color:'#4FC3F7' }}>.</span>
        </Link>

        <div style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:24, padding:'36px 32px', width:'100%', maxWidth:400, backdropFilter:'blur(12px)' }}>
          <div style={{ textAlign:'center', marginBottom:28 }}>
            <h1 style={{ fontSize:22, fontWeight:900, color:'#fff', marginBottom:6 }}>시작하기</h1>
            <p style={{ fontSize:14, color:'rgba(255,255,255,0.4)' }}>
              카카오 계정으로 간편 로그인·가입
            </p>
          </div>

          {/* 카카오 로그인 버튼 */}
          <button className="kakao-btn" onClick={handleKakaoLogin} disabled={loading !== null}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2C5.58 2 2 4.91 2 8.5c0 2.3 1.48 4.33 3.72 5.5L4.8 17.1c-.08.22.15.41.35.29L8.9 14.9c.36.04.73.06 1.1.06 4.42 0 8-2.91 8-6.5S14.42 2 10 2z" fill="#1A1A1A"/>
            </svg>
            카카오로 로그인 · 가입
          </button>
          <p style={{ fontSize:11, color:'rgba(255,255,255,0.25)', textAlign:'center', marginTop:8 }}>
            계정이 없으면 간편가입으로 연결됩니다
          </p>

          {/* 데모 로그인 (개발 환경) */}
          {isDev && (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:10, margin:'20px 0 14px' }}>
                <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.1)' }} />
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontWeight:600, whiteSpace:'nowrap' }}>개발 환경 · 역할별 바로 접속</span>
                <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.1)' }} />
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                {[
                  { role:'buyer' as const,  name:'김지수', icon:'🏫', desc:'구매자 — 프로그램 탐색·구매' },
                  { role:'seller' as const, name:'이민준', icon:'🎓', desc:'판매자 — 대시보드·프로그램 등록' },
                  { role:'admin' as const,  name:'관리자', icon:'⚙️', desc:'관리자 — 검수·회원·정산 관리' },
                ].map(({ role, name, icon, desc }) => (
                  <button key={role} className="demo-btn" onClick={() => handleDemoLogin(role, name)} disabled={loading !== null}>
                    <span style={{ fontSize:18, flexShrink:0 }}>{icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13 }}>{desc}</div>
                    </div>
                    {loading === role && <span style={{ fontSize:13 }}>⏳</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <p style={{ marginTop:20, fontSize:11, color:'rgba(255,255,255,0.25)', textAlign:'center' }}>
          로그인 시 링커스 이용약관 및 개인정보처리방침에 동의하게 됩니다
        </p>
      </div>
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh', background:'#111827' }} />}>
      <LoginContent />
    </Suspense>
  )
}
