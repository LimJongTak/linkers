'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { useAuth } from '@/store/auth'

const DEMO_FILES = [
  { id: 'f1', programTitle: '마음을 잇는 레크리에이션', fileName: '레크리에이션_진행가이드.pdf', size: '3.2MB', type: 'pdf', remaining: 4, icon: '🎯' },
  { id: 'f2', programTitle: '마음을 잇는 레크리에이션', fileName: '활동자료_인쇄용.pptx', size: '8.7MB', type: 'pptx', remaining: 5, icon: '🎯' },
  { id: 'f3', programTitle: '수학으로 만나는 AI 세계', fileName: 'AI수업_학생워크북.pdf', size: '2.1MB', type: 'pdf', remaining: 3, icon: '🧮' },
]

export default function MyDownloadsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => { if (!user) router.replace('/login') }, [user, router])
  if (!user) return null

  const handleDownload = (id: string, name: string) => {
    setDownloading(id)
    setTimeout(() => {
      setDownloading(null)
      alert(`"${name}" 다운로드가 시작됩니다.\n(실제 환경에서는 S3 Presigned URL로 연결됩니다)`)
    }, 1200)
  }

  const TYPE_ICON: Record<string, string> = { pdf: '📄', pptx: '📊', docx: '📝', xlsx: '📈' }

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <style>{`
        @media(max-width:640px){
          .downloads-main{padding:20px 16px 60px!important;}
          .file-row{padding:14px 16px!important;gap:10px!important;}
          .file-icon{width:38px!important;height:38px!important;font-size:18px!important;}
          .dl-btn{padding:9px 12px!important;font-size:12px!important;}
        }
      `}</style>
      <Header />
      <main className="downloads-main" style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Link href="/my" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: 22 }}>←</Link>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111827' }}>다운로드</h1>
        </div>
        <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 24 }}>파일당 최대 5회 다운로드 가능 · 15분 유효 링크 발급</p>

        {DEMO_FILES.map(f => (
          <div key={f.id} className="file-row" style={{ background: '#fff', borderRadius: 18, padding: '18px 20px', border: '1px solid #F0EDE8', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="file-icon" style={{ width: 44, height: 44, borderRadius: 12, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{TYPE_ICON[f.type] ?? '📁'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.fileName}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{f.programTitle} · {f.size}</div>
            </div>
            <div style={{ textAlign: 'center', marginRight: 4, flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: f.remaining <= 1 ? '#EF4444' : '#374151' }}>{f.remaining}/5</div>
              <div style={{ fontSize: 10, color: '#9CA3AF' }}>남은 횟수</div>
            </div>
            <button
              onClick={() => handleDownload(f.id, f.fileName)}
              disabled={downloading !== null || f.remaining === 0}
              className="dl-btn"
              style={{ background: f.remaining === 0 ? '#F3F4F6' : '#111827', color: f.remaining === 0 ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 800, cursor: f.remaining === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
              {downloading === f.id ? '⏳' : f.remaining === 0 ? '소진' : '⬇ 다운'}
            </button>
          </div>
        ))}

        {DEMO_FILES.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>다운로드 가능한 파일이 없습니다</div>
          </div>
        )}
      </main>
    </div>
  )
}
