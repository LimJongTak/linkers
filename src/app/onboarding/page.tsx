'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/store/auth'

export default function OnboardingPage() {
  const router = useRouter()
  const { user, accessToken, updateUser } = useAuth()

  const [nickname, setNickname] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) { router.replace('/login'); return }
    setNickname(user.nickname ?? '')
    setRole((user.role === 'seller' ? 'seller' : 'buyer') as 'buyer' | 'seller')
  }, [user, router])

  const handlePhone = (val: string) => {
    const digits = val.replace(/[^0-9]/g, '')
    if (digits.length <= 11) {
      const formatted = digits.length <= 3 ? digits
        : digits.length <= 7 ? `${digits.slice(0,3)}-${digits.slice(3)}`
        : `${digits.slice(0,3)}-${digits.slice(3,7)}-${digits.slice(7)}`
      setPhone(formatted)
    }
  }

  const handleSubmit = async () => {
    if (!nickname.trim() || nickname.trim().length < 2) {
      setError('닉네임은 2자 이상 입력해주세요'); return
    }
    setSubmitting(true); setError('')
    try {
      const res = await fetch('/api/my/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ nickname: nickname.trim(), phone: phone || null, role }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '저장 실패'); return }
      updateUser({ nickname: nickname.trim(), role: role as any })
      router.replace('/')
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setSubmitting(false) }
  }

  if (!user) return null

  const INPUT: React.CSSProperties = {
    width: '100%', padding: '14px 16px', borderRadius: 12, border: '2px solid #E5E7EB',
    fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
    background: '#fff', transition: 'border-color 0.15s',
  }

  return (
    <div style={{ fontFamily: "'Pretendard Variable', sans-serif", minHeight: '100vh', background: 'linear-gradient(135deg,#111827,#1F2D45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 28, padding: '40px 36px', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>

        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👋</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#111827', marginBottom: 6 }}>
            링커스에 오신 걸 환영해요!
          </div>
          <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>
            서비스 이용을 위해<br />기본 정보를 입력해주세요
          </div>
        </div>

        {/* 닉네임 */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
            닉네임 <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <input
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="사용할 닉네임을 입력하세요"
            maxLength={20}
            style={INPUT}
            onFocus={e => (e.target.style.borderColor = '#111827')}
            onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
          />
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>2자 이상 20자 이하</div>
        </div>

        {/* 전화번호 */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
            전화번호 <span style={{ color: '#9CA3AF', fontSize: 12, fontWeight: 500 }}>(선택)</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={e => handlePhone(e.target.value)}
            placeholder="010-0000-0000"
            style={INPUT}
            onFocus={e => (e.target.style.borderColor = '#111827')}
            onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
          />
        </div>

        {/* 역할 선택 */}
        <div style={{ marginBottom: 28 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 10 }}>
            이용 목적
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {([
              ['buyer', '🛍️', '구매자', '강의·파일 구매'],
              ['seller', '📦', '판매자', '프로그램 등록·판매'],
            ] as const).map(([val, icon, label, desc]) => (
              <button
                key={val}
                onClick={() => setRole(val)}
                style={{
                  padding: '16px 12px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  border: `2px solid ${role === val ? '#111827' : '#E5E7EB'}`,
                  background: role === val ? '#111827' : '#fff',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: role === val ? '#fff' : '#111827', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 11, color: role === val ? 'rgba(255,255,255,0.6)' : '#9CA3AF' }}>{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', color: '#991B1B', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting || !nickname.trim() || nickname.trim().length < 2}
          style={{
            width: '100%', padding: '16px', borderRadius: 14, border: 'none', fontSize: 16, fontWeight: 900,
            fontFamily: 'inherit', cursor: submitting ? 'not-allowed' : 'pointer',
            background: !nickname.trim() || nickname.trim().length < 2 ? '#E5E7EB' : '#111827',
            color: !nickname.trim() || nickname.trim().length < 2 ? '#9CA3AF' : '#fff',
            opacity: submitting ? 0.7 : 1, transition: 'all 0.15s',
          }}
        >
          {submitting ? '저장 중...' : '시작하기 →'}
        </button>

        <button
          onClick={() => router.replace('/')}
          style={{ width: '100%', marginTop: 10, padding: '12px', background: 'none', border: 'none', fontSize: 13, color: '#9CA3AF', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          나중에 입력할게요
        </button>
      </div>
    </div>
  )
}
