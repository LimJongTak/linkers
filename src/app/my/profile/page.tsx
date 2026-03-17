'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { useAuth } from '@/store/auth'

interface Profile {
  id: string
  nickname: string
  email: string | null
  phone: string | null
  profile_image: string | null
  oauth_provider: string
  role: string
}

export default function ProfilePage() {
  const { user, accessToken, updateUser } = useAuth()
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [nickname, setNickname] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const [curPw, setCurPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [newPw2, setNewPw2] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    if (!user) { router.replace('/login'); return }
    fetch('/api/my/profile', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => {
        setProfile(d.user)
        setNickname(d.user.nickname ?? '')
        setPhone(d.user.phone ?? '')
      })
  }, [user, accessToken, router])

  const handleSave = async () => {
    setSaving(true); setMsg(null)
    const res = await fetch('/api/my/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, phone }),
    })
    const d = await res.json()
    setSaving(false)
    if (res.ok) {
      setProfile(prev => prev ? { ...prev, ...d.user } : d.user)
      updateUser({ nickname: d.user.nickname, profileImage: d.user.profile_image ?? undefined })
      setMsg({ type: 'ok', text: '프로필이 저장되었습니다' })
    } else {
      setMsg({ type: 'err', text: d.error ?? '저장 실패' })
    }
  }

  const handlePwChange = async () => {
    if (newPw !== newPw2) { setPwMsg({ type: 'err', text: '새 비밀번호가 일치하지 않습니다' }); return }
    setPwSaving(true); setPwMsg(null)
    const res = await fetch('/api/my/profile/password', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: curPw, newPassword: newPw }),
    })
    const d = await res.json()
    setPwSaving(false)
    if (res.ok) {
      setCurPw(''); setNewPw(''); setNewPw2('')
      setPwMsg({ type: 'ok', text: '비밀번호가 변경되었습니다' })
    } else {
      setPwMsg({ type: 'err', text: d.error ?? '변경 실패' })
    }
  }

  if (!user || !profile) return null

  const INPUT: React.CSSProperties = {
    width: '100%', padding: '11px 14px', border: '1.5px solid #E5E7EB', borderRadius: 10,
    fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
    background: '#fff', color: '#111827',
  }
  const LABEL: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block' }
  const SECTION: React.CSSProperties = { background: '#fff', borderRadius: 16, padding: 24, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F0EDE8' }

  const providerLabel: Record<string, string> = { kakao: '카카오', google: '구글', email: '이메일', internal: '내부' }

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <Header />
      <main style={{ maxWidth: 520, margin: '0 auto', padding: '32px 20px 60px' }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Link href="/my" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: 14 }}>← 마이페이지</Link>
          <span style={{ color: '#D1D5DB' }}>|</span>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: '#111827', margin: 0 }}>프로필 수정</h1>
        </div>

        {/* 프로필 아바타 */}
        <div style={{ ...SECTION, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
            background: profile.profile_image ? 'transparent' : 'linear-gradient(135deg,#4FC3F7,#667EEA)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 900, color: '#fff', overflow: 'hidden',
          }}>
            {profile.profile_image
              ? <img src={profile.profile_image} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : profile.nickname[0]}
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#111827' }}>{profile.nickname}</div>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>
              {providerLabel[profile.oauth_provider] ?? profile.oauth_provider} 로그인
              {profile.email && ` · ${profile.email}`}
            </div>
          </div>
        </div>

        {/* 기본 정보 */}
        <div style={SECTION}>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#111827', marginBottom: 18 }}>기본 정보</div>

          <div style={{ marginBottom: 14 }}>
            <label style={LABEL}>닉네임 *</label>
            <input
              style={INPUT}
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="닉네임 (2자 이상)"
              maxLength={20}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={LABEL}>이메일</label>
            <input
              style={{ ...INPUT, background: '#F9FAFB', color: '#9CA3AF', cursor: 'not-allowed' }}
              value={profile.email ?? '연동된 이메일 없음'}
              readOnly
            />
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>이메일은 변경할 수 없습니다</div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={LABEL}>전화번호</label>
            <input
              style={INPUT}
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="010-0000-0000"
              maxLength={13}
            />
          </div>

          {msg && (
            <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13, fontWeight: 700,
              background: msg.type === 'ok' ? '#D1FAE5' : '#FEE2E2',
              color: msg.type === 'ok' ? '#065F46' : '#991B1B',
            }}>{msg.text}</div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%', padding: '13px', background: '#111827', color: '#fff',
              border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800,
              cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </div>

        {/* 비밀번호 변경 (이메일 계정만) */}
        {profile.oauth_provider === 'email' && (
          <div style={SECTION}>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#111827', marginBottom: 18 }}>비밀번호 변경</div>

            <div style={{ marginBottom: 14 }}>
              <label style={LABEL}>현재 비밀번호</label>
              <input type="password" style={INPUT} value={curPw} onChange={e => setCurPw(e.target.value)} placeholder="현재 비밀번호" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={LABEL}>새 비밀번호</label>
              <input type="password" style={INPUT} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="새 비밀번호 (8자 이상)" />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={LABEL}>새 비밀번호 확인</label>
              <input type="password" style={INPUT} value={newPw2} onChange={e => setNewPw2(e.target.value)} placeholder="새 비밀번호 다시 입력" />
            </div>

            {pwMsg && (
              <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13, fontWeight: 700,
                background: pwMsg.type === 'ok' ? '#D1FAE5' : '#FEE2E2',
                color: pwMsg.type === 'ok' ? '#065F46' : '#991B1B',
              }}>{pwMsg.text}</div>
            )}

            <button
              onClick={handlePwChange}
              disabled={pwSaving || !curPw || !newPw || !newPw2}
              style={{
                width: '100%', padding: '13px', background: '#4F46E5', color: '#fff',
                border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800,
                cursor: (pwSaving || !curPw || !newPw || !newPw2) ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', opacity: (pwSaving || !curPw || !newPw || !newPw2) ? 0.6 : 1,
              }}
            >
              {pwSaving ? '변경 중...' : '비밀번호 변경'}
            </button>
          </div>
        )}

      </main>
    </div>
  )
}
