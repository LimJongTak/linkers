'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { useAuth } from '@/store/auth'

interface ProgramFile {
  id: string
  file_name: string
  file_type: string
  file_size: string
  is_preview: boolean
  sort_order: number
}

const fmtSize = (bytes: string) => {
  const n = Number(bytes)
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
  if (n >= 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${n} B`
}

const fileIcon = (type: string) => {
  if (type.includes('pdf')) return '📄'
  if (type.includes('zip') || type.includes('compressed')) return '🗜️'
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('xlsx')) return '📊'
  if (type.includes('presentation') || type.includes('powerpoint') || type.includes('pptx')) return '📊'
  return '📎'
}

interface UploadItem {
  file: File
  isPreview: boolean
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

export default function ProgramFilesPage() {
  const { id } = useParams<{ id: string }>()
  const { user, accessToken } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [existingFiles, setExistingFiles] = useState<ProgramFile[]>([])
  const [queue, setQueue] = useState<UploadItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [programTitle, setProgramTitle] = useState('')

  useEffect(() => {
    if (!user) { router.replace('/login'); return }
    // 기존 파일 목록 로드
    fetch(`/api/programs/${id}/files`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.json())
      .then(d => setExistingFiles(d.files ?? []))
      .catch(() => {})
    // 프로그램 정보
    fetch(`/api/programs/${id}`)
      .then(r => r.json())
      .then(d => setProgramTitle(d.program?.title ?? ''))
      .catch(() => {})
  }, [id, user, accessToken, router])

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files)
    setQueue(prev => {
      const existing = prev.map(f => f.file.name)
      const newOnes = arr.filter(f => !existing.includes(f.name))
      return [...prev, ...newOnes.map(f => ({ file: f, isPreview: false, status: 'pending' as const }))]
    })
  }, [])

  const togglePreview = (i: number) =>
    setQueue(prev => prev.map((f, idx) => ({ ...f, isPreview: idx === i ? !f.isPreview : false })))

  const removeFromQueue = (i: number) =>
    setQueue(prev => prev.filter((_, idx) => idx !== i))

  const handleUpload = async () => {
    if (!accessToken || queue.filter(q => q.status === 'pending').length === 0) return
    setUploading(true)

    const startSortOrder = existingFiles.length

    for (let i = 0; i < queue.length; i++) {
      if (queue[i].status !== 'pending') continue

      setQueue(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'uploading' } : f))

      try {
        const fd = new FormData()
        fd.append('file', queue[i].file)
        fd.append('isPreview', String(queue[i].isPreview))
        fd.append('sortOrder', String(startSortOrder + i))

        const res = await fetch(`/api/programs/${id}/files`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: fd,
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.detail ?? err.error ?? '업로드 실패')
        }

        const { file: saved } = await res.json()
        setExistingFiles(prev => [...prev, saved])
        setQueue(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'done' } : f))
      } catch (e) {
        const msg = e instanceof Error ? e.message : '업로드 실패'
        setQueue(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'error', error: msg } : f))
      }
    }

    setUploading(false)
    // 완료된 항목 정리
    setQueue(prev => prev.filter(f => f.status !== 'done'))
  }

  if (!user) return null

  const pendingCount = queue.filter(q => q.status === 'pending').length

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <Header />
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '32px 24px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Link href="/seller/dashboard" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: 22 }}>←</Link>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: '#111827', margin: 0 }}>파일 관리</h1>
            {programTitle && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{programTitle}</div>}
          </div>
        </div>

        {/* 기존 파일 목록 */}
        {existingFiles.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #F0EDE8', marginBottom: 20, marginTop: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 12 }}>
              등록된 파일 ({existingFiles.length}개)
            </div>
            {existingFiles.map(f => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
                <span style={{ fontSize: 20 }}>{fileIcon(f.file_type)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.file_name}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{fmtSize(f.file_size)}</div>
                </div>
                {f.is_preview && (
                  <span style={{ fontSize: 10, background: '#EDE9FE', color: '#5B21B6', padding: '2px 7px', borderRadius: 5, fontWeight: 700, flexShrink: 0 }}>미리보기</span>
                )}
                <span style={{ fontSize: 11, background: '#D1FAE5', color: '#065F46', padding: '2px 7px', borderRadius: 5, fontWeight: 700, flexShrink: 0 }}>등록됨</span>
              </div>
            ))}
          </div>
        )}

        {/* 파일 추가 */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #F0EDE8' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 12 }}>파일 추가</div>

          {/* 권장 규격 안내 */}
          <div style={{ background: '#F0F9FF', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#0369A1', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 800, marginBottom: 4 }}>📐 권장 이미지 규격</div>
            <div>• 썸네일: <strong>800 × 450 px</strong> (16:9 비율) · JPG/PNG · 최대 2 MB</div>
            <div>• 미리보기 이미지: <strong>1200 × 800 px</strong> · JPG/PNG · 최대 5 MB</div>
            <div style={{ marginTop: 4, color: '#0284C7' }}>💡 미리보기로 지정된 파일 1개는 구매 전 무료 샘플로 제공됩니다</div>
          </div>

          {/* 드롭존 */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files) }}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? '#111827' : '#D1D5DB'}`,
              borderRadius: 12, padding: '24px 20px', textAlign: 'center',
              cursor: 'pointer', background: dragOver ? '#F9FAFB' : '#FAFAFA',
              marginBottom: 12, transition: 'all 0.15s',
            }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>📁</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 3 }}>파일을 드래그하거나 클릭해서 선택</div>
            <div style={{ fontSize: 11, color: '#9CA3AF' }}>PDF, PPT, HWP, ZIP 등 모든 형식</div>
            <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }}
              onChange={e => e.target.files && addFiles(e.target.files)} />
          </div>

          {/* 업로드 대기 목록 */}
          {queue.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {queue.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: '#F9FAFB', borderRadius: 10, padding: '10px 12px',
                  border: item.status === 'error' ? '1.5px solid #EF4444' : item.isPreview ? '2px solid #4F46E5' : '1px solid #E5E7EB',
                }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{fileIcon(item.file.type)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.file.name}</div>
                    <div style={{ fontSize: 11, color: item.status === 'error' ? '#EF4444' : '#9CA3AF' }}>
                      {item.status === 'uploading' ? '업로드 중...' :
                       item.status === 'done' ? '완료' :
                       item.status === 'error' ? (item.error ?? '실패') :
                       fmtSize(String(item.file.size))}
                    </div>
                  </div>
                  {item.status === 'pending' && (
                    <>
                      <button onClick={() => togglePreview(i)} style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 5, cursor: 'pointer', border: 'none',
                        background: item.isPreview ? '#EDE9FE' : '#F3F4F6',
                        color: item.isPreview ? '#5B21B6' : '#6B7280',
                      }}>
                        {item.isPreview ? '👁 미리보기' : '미리보기'}
                      </button>
                      <button onClick={() => removeFromQueue(i)} style={{ fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '0 2px' }}>✕</button>
                    </>
                  )}
                  {item.status === 'uploading' && <div style={{ fontSize: 16 }}>⏳</div>}
                  {item.status === 'done' && <div style={{ fontSize: 16 }}>✅</div>}
                  {item.status === 'error' && <div style={{ fontSize: 16 }}>❌</div>}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading || pendingCount === 0}
            style={{
              width: '100%', background: pendingCount === 0 || uploading ? '#E5E7EB' : '#111827',
              color: pendingCount === 0 || uploading ? '#9CA3AF' : '#fff',
              border: 'none', borderRadius: 12, padding: '14px',
              fontSize: 15, fontWeight: 900, cursor: pendingCount === 0 || uploading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}>
            {uploading ? '업로드 중...' : pendingCount > 0 ? `파일 ${pendingCount}개 업로드` : '파일을 선택하세요'}
          </button>
        </div>

        {existingFiles.length === 0 && queue.length === 0 && (
          <div style={{ marginTop: 16, background: '#FEF3C7', borderRadius: 10, padding: '12px 14px', fontSize: 12, color: '#92400E', fontWeight: 600 }}>
            ⚠️ 파일이 없으면 구매 후 다운로드가 불가능합니다. 판매 파일을 반드시 업로드해주세요.
          </div>
        )}
      </main>
    </div>
  )
}
