'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/store/auth'

export default function AdminInitPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [nickname, setNickname] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    if (!nickname.trim() || !secretKey.trim()) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/admin/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname.trim(), secretKey }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg: Record<string, string> = {
          ADMIN_ALREADY_EXISTS: '관리자 계정이 이미 존재합니다.',
          INVALID_SECRET_KEY: '시크릿 키가 올바르지 않습니다.',
          NICKNAME_REQUIRED: '닉네임을 입력해주세요.',
        }
        setError(msg[data.error] ?? '오류가 발생했습니다.')
        return
      }
      login(data.accessToken, { id: data.admin.id, nickname: data.admin.nickname, role: 'admin' })
      setDone(true)
      setTimeout(() => router.replace('/admin'), 1500)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#111827,#1F2D45)', padding: 24,
      fontFamily: "'Pretendard Variable',Pretendard,-apple-system,sans-serif",
    }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '40px 36px', width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚙️</div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: '#111827', marginBottom: 4 }}>관리자 계정 생성</h1>
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>최초 1회만 실행 가능합니다</p>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>관리자 계정 생성 완료!</div>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 8 }}>관리자 콘솔로 이동 중...</div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>관리자 닉네임</label>
              <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="예) 링커스 운영팀"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>시크릿 키</label>
              <input type="password" value={secretKey} onChange={e => setSecretKey(e.target.value)} placeholder="ADMIN_INIT_SECRET 값 입력"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            {error && (
              <div style={{ background: '#FEF2F2', color: '#991B1B', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
                ✕ {error}
              </div>
            )}
            <button onClick={handleSubmit} disabled={!nickname.trim() || !secretKey.trim() || loading}
              style={{ width: '100%', padding: '14px', background: '#111827', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}>
              {loading ? '생성 중...' : '관리자 계정 생성'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
