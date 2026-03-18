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
  bio: string | null
  oauth_provider: string
  role: string
}

export default function ProfilePage() {
  const { user, accessToken, updateUser, logout } = useAuth()
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [nickname, setNickname] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const [curPw, setCurPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [newPw2, setNewPw2] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const [imgUploading, setImgUploading] = useState(false)
  const [imgErr, setImgErr] = useState('')

  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawPw, setWithdrawPw] = useState('')
  const [withdrawConfirm, setWithdrawConfirm] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawErr, setWithdrawErr] = useState('')

  useEffect(() => {
    if (!user) { router.replace('/login'); return }
    fetch('/api/my/profile', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => {
        setProfile(d.user)
        setNickname(d.user.nickname ?? '')
        setPhone(d.user.phone ?? '')
        setBio(d.user.bio ?? '')
      })
  }, [user, accessToken, router])

  const handleSave = async () => {
    setSaving(true); setMsg(null)
    const res = await fetch('/api/my/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, phone, bio }),
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImgUploading(true); setImgErr('')
    try {
      const form = new FormData()
      form.append('image', file)
      const res = await fetch('/api/my/profile/image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      })
      const d = await res.json()
      if (!res.ok) { setImgErr(d.error ?? '업로드 실패'); return }
      setProfile(prev => prev ? { ...prev, profile_image: d.profileImageUrl } : prev)
      updateUser({ profileImage: d.profileImageUrl })
    } catch {
      setImgErr('네트워크 오류가 발생했습니다')
    } finally {
      setImgUploading(false)
      e.target.value = ''
    }
  }

  const handleWithdraw = async () => {
    setWithdrawing(true); setWithdrawErr('')
    const isEmail = profile?.oauth_provider === 'email' || profile?.oauth_provider === 'internal'
    const body = isEmail ? { password: withdrawPw } : { confirm: withdrawConfirm }
    try {
      const res = await fetch('/api/my/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(body),
      })
      const d = await res.json()
      if (!res.ok) { setWithdrawErr(d.error ?? '탈퇴 처리 중 오류가 발생했습니다'); return }
      logout()
      router.replace('/')
    } catch {
      setWithdrawErr('네트워크 오류가 발생했습니다')
    } finally {
      setWithdrawing(false)
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
          <label style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: profile.profile_image ? 'transparent' : 'linear-gradient(135deg,#4FC3F7,#667EEA)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 900, color: '#fff', overflow: 'hidden',
              border: '3px solid #E5E7EB',
            }}>
              {profile.profile_image
                ? <img src={profile.profile_image} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                : profile.nickname[0]}
            </div>
            {/* 카메라 오버레이 */}
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 24, height: 24, borderRadius: '50%',
              background: '#111827', border: '2px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12,
            }}>📷</div>
            <input type="file" accept="image/*" onChange={handleImageUpload}
              style={{ display: 'none' }} disabled={imgUploading} />
          </label>
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#111827' }}>{profile.nickname}</div>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>
              {providerLabel[profile.oauth_provider] ?? profile.oauth_provider} 로그인
              {profile.email && ` · ${profile.email}`}
            </div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
              {imgUploading ? '업로드 중...' : '사진을 클릭해 변경'}
            </div>
            {imgErr && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 2 }}>{imgErr}</div>}
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

          <div style={{ marginBottom: 14 }}>
            <label style={LABEL}>전화번호</label>
            <input
              style={INPUT}
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="010-0000-0000"
              maxLength={13}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={LABEL}>
              소개 메시지
              <span style={{ fontWeight: 400, color: '#9CA3AF', marginLeft: 6 }}>({bio.length}/200)</span>
            </label>
            <textarea
              style={{ ...INPUT, resize: 'none', height: 88, lineHeight: 1.6 }}
              value={bio}
              onChange={e => setBio(e.target.value.slice(0, 200))}
              placeholder="자신을 간단히 소개해주세요. 다른 사용자의 프로필에서 표시됩니다."
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

        {/* 회원 탈퇴 */}
        <div style={{ ...SECTION, border: '1px solid #FEE2E2' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#991B1B', marginBottom: 6 }}>회원 탈퇴</div>
          <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16, lineHeight: 1.6 }}>
            탈퇴 시 보유 포인트는 소멸되며, 개인정보는 즉시 삭제됩니다.<br />
            구매 내역 등 거래 기록은 관계 법령에 따라 보관됩니다.
          </div>

          {!showWithdraw ? (
            <button
              onClick={() => setShowWithdraw(true)}
              style={{ padding: '10px 20px', background: 'none', border: '1.5px solid #FCA5A5', borderRadius: 10, color: '#DC2626', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              회원 탈퇴 신청
            </button>
          ) : (
            <div style={{ background: '#FEF2F2', borderRadius: 12, padding: 18 }}>
              {profile.oauth_provider === 'email' || profile.oauth_provider === 'internal' ? (
                <>
                  <label style={{ ...LABEL, color: '#991B1B' }}>비밀번호 확인</label>
                  <input
                    type="password"
                    value={withdrawPw}
                    onChange={e => setWithdrawPw(e.target.value)}
                    placeholder="현재 비밀번호 입력"
                    style={{ ...INPUT, marginBottom: 12, borderColor: '#FCA5A5' }}
                  />
                </>
              ) : (
                <>
                  <label style={{ ...LABEL, color: '#991B1B' }}>
                    아래에 <strong>탈퇴합니다</strong>를 입력하세요
                  </label>
                  <input
                    value={withdrawConfirm}
                    onChange={e => setWithdrawConfirm(e.target.value)}
                    placeholder="탈퇴합니다"
                    style={{ ...INPUT, marginBottom: 12, borderColor: '#FCA5A5' }}
                  />
                </>
              )}

              {withdrawErr && (
                <div style={{ background: '#FEE2E2', color: '#991B1B', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
                  {withdrawErr}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { setShowWithdraw(false); setWithdrawPw(''); setWithdrawConfirm(''); setWithdrawErr('') }}
                  style={{ flex: 1, padding: '11px', background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#374151' }}
                >
                  취소
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing || (
                    (profile.oauth_provider === 'email' || profile.oauth_provider === 'internal')
                      ? !withdrawPw
                      : withdrawConfirm !== '탈퇴합니다'
                  )}
                  style={{
                    flex: 1, padding: '11px', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 800,
                    cursor: 'pointer', fontFamily: 'inherit',
                    background: '#DC2626', color: '#fff', opacity: withdrawing ? 0.7 : 1,
                  }}
                >
                  {withdrawing ? '처리 중...' : '탈퇴 확인'}
                </button>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
