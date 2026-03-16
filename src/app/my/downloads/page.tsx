'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { useAuth } from '@/store/auth'

interface DownloadFile {
  permissionId: string
  fileId: string
  fileName: string
  fileType: string
  fileSize: string
  programTitle: string
  programId: string
  downloadCount: number
  maxDownloads: number
  remaining: number
}

const TYPE_ICON: Record<string, string> = { pdf: '📄', pptx: '📊', docx: '📝', xlsx: '📈', hwp: '📋' }

function formatSize(bytes: string) {
  const n = Number(bytes)
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)}MB`
  if (n >= 1024) return `${(n / 1024).toFixed(0)}KB`
  return `${n}B`
}

export default function MyDownloadsPage() {
  const { user, accessToken } = useAuth()
  const router = useRouter()
  const [files, setFiles] = useState<DownloadFile[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => { if (!user) router.replace('/login') }, [user, router])

  useEffect(() => {
    if (!accessToken) return
    fetch('/api/downloads', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => setFiles(d.files ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [accessToken])

  if (!user) return null

  const handleDownload = async (fileId: string, fileName: string) => {
    if (downloading) return
    setDownloading(fileId)
    try {
      const res = await fetch(`/api/downloads/${fileId}/url`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error ?? '다운로드 실패')
        return
      }
      // 새 탭으로 S3 presigned URL 열기
      const a = document.createElement('a')
      a.href = data.signedUrl
      a.download = fileName
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      // 남은 횟수 업데이트
      setFiles(prev => prev.map(f =>
        f.fileId === fileId
          ? { ...f, remaining: data.remainingDownloads, downloadCount: f.downloadCount + 1 }
          : f
      ))
    } catch {
      alert('네트워크 오류가 발생했습니다')
    } finally {
      setDownloading(null)
    }
  }

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

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <div>불러오는 중...</div>
          </div>
        )}

        {!loading && files.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>다운로드 가능한 파일이 없습니다</div>
            <Link href="/" style={{ display: 'inline-block', marginTop: 16, background: '#111827', color: '#fff', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
              프로그램 둘러보기
            </Link>
          </div>
        )}

        {files.map(f => (
          <div key={f.fileId} className="file-row" style={{ background: '#fff', borderRadius: 18, padding: '18px 20px', border: '1px solid #F0EDE8', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="file-icon" style={{ width: 44, height: 44, borderRadius: 12, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
              {TYPE_ICON[f.fileType?.toLowerCase()] ?? '📁'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.fileName}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{f.programTitle} · {formatSize(f.fileSize)}</div>
            </div>
            <div style={{ textAlign: 'center', marginRight: 4, flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: f.remaining <= 1 ? '#EF4444' : '#374151' }}>{f.remaining}/{f.maxDownloads}</div>
              <div style={{ fontSize: 10, color: '#9CA3AF' }}>남은 횟수</div>
            </div>
            <button
              onClick={() => handleDownload(f.fileId, f.fileName)}
              disabled={downloading !== null || f.remaining === 0}
              className="dl-btn"
              style={{ background: f.remaining === 0 ? '#F3F4F6' : '#111827', color: f.remaining === 0 ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 800, cursor: f.remaining === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
              {downloading === f.fileId ? '⏳' : f.remaining === 0 ? '소진' : '⬇ 다운'}
            </button>
          </div>
        ))}
      </main>
    </div>
  )
}
