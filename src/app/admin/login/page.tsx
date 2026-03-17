'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/store/auth'

export default function AdminLoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [secretKey, setSecretKey] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!secretKey.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secretKey,
          identifier: identifier.trim() || undefined,
          password: password || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg: Record<string, string> = {
          INVALID_SECRET_KEY: '시크릿 키가 올바르지 않습니다.',
          NO_ADMIN_ACCOUNT: '관리자 계정이 없습니다. /admin/init 에서 먼저 생성해주세요.',
        }
        setError(msg[data.error] ?? data.detail ?? data.message ?? '오류가 발생했습니다.')
        return
      }
      login(data.accessToken, {
        id: data.admin.id,
        nickname: data.admin.nickname,
        role: data.admin.role,
      })
      router.replace('/admin')
    } catch {
      setError('네트워크 오류가 발생했습니다.')
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
      <div style={{ background: '#fff', borderRadius: 24, padding: '40px 36px', width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🔐</div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: '#111827', marginBottom: 4 }}>관리자 로그인</h1>
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>링커스 운영 콘솔</p>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
            시크릿 키
          </label>
          <input
            type="password"
            value={secretKey}
            onChange={e => setSecretKey(e.target.value)}
            placeholder="ADMIN_INIT_SECRET 값 입력"
            autoFocus
            style={{ width: '100%', padding: '13px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
            이메일 또는 닉네임 <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(관리자가 여러 명인 경우 필수)</span>
          </label>
          <input
            type="text"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            placeholder="예: admin@linkers.kr 또는 홍길동"
            style={{ width: '100%', padding: '13px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
            비밀번호 <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(이메일 가입 계정인 경우)</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="이메일로 가입한 계정의 비밀번호"
            style={{ width: '100%', padding: '13px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const }}
          />
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', color: '#991B1B', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
            ✕ {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!secretKey.trim() || loading}
          style={{ width: '100%', padding: '14px', background: '#111827', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', opacity: !secretKey.trim() || loading ? 0.6 : 1 }}>
          {loading ? '로그인 중...' : '관리자 로그인'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#9CA3AF' }}>
          관리자 계정이 없으신가요?{' '}
          <a href="/admin/init" style={{ color: '#4FC3F7', fontWeight: 700, textDecoration: 'none' }}>계정 생성</a>
        </div>
      </div>
    </div>
  )
}
