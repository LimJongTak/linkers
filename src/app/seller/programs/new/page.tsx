'use client'

import { useState, useRef, useCallback } from 'react'
import type { CSSProperties, DragEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { useAuth } from '@/store/auth'
import type { ProductType } from '@/store/data'

const CATEGORIES   = ['레크리에이션', '교육', '진로', '예체능', '재능봉사']
const TARGETS      = ['초등', '중등', '고등', '대학']
const REGIONS      = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '전국']
const FILE_FORMATS = ['PDF', 'PPT/PPTX', 'HWP', 'ZIP', 'Excel', '기타']

const fmtSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const fileIcon = (type: string) => {
  if (type.includes('pdf')) return '📄'
  if (type.includes('zip') || type.includes('compressed')) return '🗜️'
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('xlsx')) return '📊'
  if (type.includes('presentation') || type.includes('powerpoint')) return '📊'
  if (type.includes('image')) return '🖼️'
  return '📎'
}

interface AttachedFile {
  file: File
  isPreview: boolean
}

export default function ProgramRegisterPage() {
  const { user, accessToken } = useAuth()
  const router = useRouter()

  const [step, setStep]     = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveProgress, setSaveProgress] = useState('')
  const [saveError, setSaveError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    productType: '' as ProductType | '',
    title: '', subtitle: '', category: '', description: '',
    targets: [] as string[], regions: [] as string[],
    price: '',
    fileFormat: '', pageCount: '', fileSize: '',
    duration: '', maxParticipants: '', isOnline: 'online',
    tags: '',
  })
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)

  const onThumbnailChange = (file: File | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return
    setThumbnailFile(file)
    const url = URL.createObjectURL(file)
    setThumbnailPreview(url)
  }

  const set = (k: keyof typeof form, v: unknown) => setForm(f => ({ ...f, [k]: v }))
  const toggle = (k: 'targets' | 'regions', v: string) =>
    set(k, form[k].includes(v) ? form[k].filter(x => x !== v) : [...form[k], v])

  const selectType = (t: ProductType) => { set('productType', t); setStep(1) }
  const isFile = form.productType === 'file_product'

  const canNext1 = form.title && form.category && form.description
  const canNext2 = form.targets.length > 0 && form.price && (
    isFile ? form.fileFormat : form.duration
  )

  // 파일 추가
  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files)
    setAttachedFiles(prev => {
      const existing = prev.map(f => f.file.name)
      const newOnes = arr.filter(f => !existing.includes(f.name))
      return [...prev, ...newOnes.map(f => ({ file: f, isPreview: false }))]
    })
  }, [])

  const removeFile = (i: number) => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))

  const togglePreview = (i: number) =>
    setAttachedFiles(prev => prev.map((f, idx) => ({ ...f, isPreview: idx === i ? !f.isPreview : false })))

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragOver(false)
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  }

  // 실제 등록 처리
  const handleSubmit = async () => {
    if (!user || !accessToken) { router.push('/login'); return }
    setSaving(true)
    setSaveError('')
    setSaveProgress('프로그램 정보 등록 중...')

    try {
      // 1. 프로그램 생성
      const res = await fetch('/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          productType: form.productType,
          title: form.title, subtitle: form.subtitle || undefined,
          category: form.category, description: form.description,
          targetLevels: form.targets,
          regions: isFile ? ['전국'] : form.regions,
          price: Number(form.price),
          fileFormat: form.fileFormat || undefined,
          pageCount: form.pageCount ? Number(form.pageCount) : undefined,
          duration: form.duration || undefined,
          maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : undefined,
          isOnline: !isFile ? form.isOnline === 'online' : undefined,
          tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail ?? err.error ?? '등록 실패')
      }
      const { program } = await res.json()

      // 2. 썸네일 업로드
      if (thumbnailFile) {
        setSaveProgress('썸네일 이미지 업로드 중...')
        try {
          const fd = new FormData()
          fd.append('thumbnail', thumbnailFile)
          await fetch(`/api/programs/${program.id}/thumbnail`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
            body: fd,
          })
        } catch {
          console.warn('썸네일 업로드 실패')
        }
      }

      // 3. 파일 업로드 (파일 자료인 경우) - FormData로 서버 직접 전송
      if (isFile && attachedFiles.length > 0) {
        for (let i = 0; i < attachedFiles.length; i++) {
          const { file, isPreview } = attachedFiles[i]
          setSaveProgress(`파일 업로드 중... (${i + 1}/${attachedFiles.length}) ${file.name}`)

          try {
            const fd = new FormData()
            fd.append('file', file)
            fd.append('isPreview', String(isPreview))
            fd.append('sortOrder', String(i))

            const fileRes = await fetch(`/api/programs/${program.id}/files`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${accessToken}` },
              body: fd,
            })

            if (!fileRes.ok) {
              const errData = await fileRes.json().catch(() => ({}))
              console.warn(`파일 업로드 실패: ${file.name}`, errData)
            }
          } catch {
            console.warn(`파일 업로드 실패: ${file.name}`)
          }
        }
      }

      setSaveProgress('')
      setStep(4)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : '오류가 발생했습니다')
    } finally {
      setSaving(false)
    }
  }

  const INPUT: CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid #E5E7EB', fontSize: 14, fontFamily: 'inherit', outline: 'none', color: '#111827', background: '#fff', boxSizing: 'border-box' }
  const CHIP_BASE: CSSProperties = { padding: '7px 16px', borderRadius: 20, border: '1.5px solid #E5E7EB', background: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }
  const CHIP_ON:   CSSProperties = { ...CHIP_BASE, background: '#111827', color: '#fff', border: '1.5px solid #111827' }

  if (!user) return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <Header />
      <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🔐</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111827', marginBottom: 10 }}>로그인이 필요합니다</h2>
        <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 28 }}>자료를 등록하려면 먼저 로그인해주세요</p>
        <Link href="/login" style={{ display: 'inline-block', background: '#111827', color: '#fff', padding: '13px 32px', borderRadius: 12, fontWeight: 800, fontSize: 15, textDecoration: 'none' }}>
          로그인하러 가기
        </Link>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <style>{`
        @media(max-width:640px){
          .new-prog-main{padding:20px 16px 80px!important;}
          .price-fmt-grid{grid-template-columns:1fr!important;}
        }
        .file-row:hover .file-remove{opacity:1!important;}
      `}</style>
      <Header />
      <main className="new-prog-main" style={{ maxWidth: 640, margin: '0 auto', padding: '32px 24px 80px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <Link href="/my" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: 22 }}>←</Link>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111827' }}>자료 등록</h1>
        </div>

        {/* 스텝 인디케이터 */}
        {step >= 1 && step <= 3 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'inline-flex', gap: 6, background: '#F3F4F6', borderRadius: 8, padding: '4px 10px', marginBottom: 16, fontSize: 12, fontWeight: 700, color: '#6B7280' }}>
              {isFile ? '📄 파일 자료 등록' : '🎓 강의 등록'}
              <button onClick={() => { setStep(0); set('productType', ''); setAttachedFiles([]) }} style={{ background: 'none', border: 'none', fontSize: 11, color: '#4FC3F7', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, padding: 0, marginLeft: 4 }}>변경</button>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['기본 정보', '세부 설정', '최종 확인'].map((label, i) => {
                const s = i + 1
                return (
                  <div key={s} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ height: 4, borderRadius: 4, background: step >= s ? '#111827' : '#E5E7EB', marginBottom: 6 }} />
                    <div style={{ fontSize: 11, fontWeight: 700, color: step >= s ? '#111827' : '#9CA3AF' }}>Step {s}. {label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 0: 타입 선택 */}
        {step === 0 && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 6 }}>어떤 종류를 등록할까요?</div>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 24 }}>등록 유형을 선택하면 맞춤 폼이 나타납니다</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <button onClick={() => selectType('file_product')}
                style={{ background: '#fff', border: '2px solid #E5E7EB', borderRadius: 20, padding: 24, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#111827')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E7EB')}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📄</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#111827', marginBottom: 6 }}>파일 자료 등록</div>
                <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.7 }}>
                  수업자료, 활동지, PPT, 워크시트 등 디지털 파일을 판매합니다.<br />
                  구매자는 결제 즉시 파일을 다운로드할 수 있어요.
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
                  {['PDF', 'PPT', 'HWP', 'ZIP', 'Excel'].map(f => (
                    <span key={f} style={{ fontSize: 11, background: '#F3F4F6', color: '#6B7280', padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>{f}</span>
                  ))}
                </div>
              </button>

              <button onClick={() => selectType('class')}
                style={{ background: '#fff', border: '2px solid #E5E7EB', borderRadius: 20, padding: 24, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#111827')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E7EB')}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🎓</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#111827', marginBottom: 6 }}>강의 등록</div>
                <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.7 }}>
                  Zoom 온라인 강의 또는 직접 방문하는 오프라인 수업을 등록합니다.<br />
                  일정·장소를 조율하고 진행합니다.
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
                  {['온라인 Zoom', '오프라인 방문', '일정 협의'].map(f => (
                    <span key={f} style={{ fontSize: 11, background: '#EDE9FE', color: '#5B21B6', padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>{f}</span>
                  ))}
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: 기본 정보 */}
        {step === 1 && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, border: '1px solid #F0EDE8' }}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
                {isFile ? '자료 이름' : '강의 이름'} *
              </label>
              <input value={form.title} onChange={e => set('title', e.target.value)}
                placeholder={isFile ? '예) 학기 초 팀빌딩 활동지 패키지 20종' : '예) 진로탐색 Zoom 특강'}
                style={INPUT} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>부제목</label>
              <input value={form.subtitle} onChange={e => set('subtitle', e.target.value)}
                placeholder={isFile ? '예) 인쇄 즉시 사용 가능 · PDF+PPT 포함' : '예) 고등학생 대상 · 2시간 진행'}
                style={INPUT} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>카테고리 *</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => set('category', c)} style={form.category === c ? CHIP_ON : CHIP_BASE}>{c}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
                {isFile ? '자료 설명' : '강의 소개'} *
              </label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                placeholder={isFile
                  ? '자료의 구성, 활용 방법, 대상, 특징을 상세히 입력해주세요'
                  : '강의 목표, 진행 방식, 특징, 커리큘럼을 상세히 입력해주세요'}
                style={{ ...INPUT, height: 120, resize: 'none' }} />
            </div>

            {/* 썸네일 이미지 */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
                미리보기 이미지
                <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500, marginLeft: 6 }}>프로그램 목록에 표시됩니다 (선택)</span>
              </label>
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => onThumbnailChange(e.target.files?.[0] ?? null)}
              />
              {thumbnailPreview ? (
                <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: '2px solid #E5E7EB' }}>
                  <img src={thumbnailPreview} alt="썸네일 미리보기" style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)' }} />
                  <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#fff', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                      {thumbnailFile?.name}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" onClick={() => thumbnailInputRef.current?.click()}
                        style={{ fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.9)', color: '#374151', borderRadius: 6, padding: '4px 10px', border: 'none', cursor: 'pointer' }}>
                        변경
                      </button>
                      <button type="button" onClick={() => { setThumbnailFile(null); setThumbnailPreview(null) }}
                        style={{ fontSize: 11, fontWeight: 700, background: 'rgba(239,68,68,0.85)', color: '#fff', borderRadius: 6, padding: '4px 10px', border: 'none', cursor: 'pointer' }}>
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => thumbnailInputRef.current?.click()}
                  style={{ width: '100%', height: 120, borderRadius: 14, border: '2px dashed #D1D5DB', background: '#FAFAFA', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#111827'; e.currentTarget.style.background = '#F9FAFB' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.background = '#FAFAFA' }}>
                  <span style={{ fontSize: 28 }}>🖼️</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#6B7280' }}>클릭해서 이미지 선택</span>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>JPG, PNG, WEBP · 권장 16:9 비율</span>
                </button>
              )}
            </div>

            <button onClick={() => setStep(2)} disabled={!canNext1}
              style={{ width: '100%', background: canNext1 ? '#111827' : '#E5E7EB', color: canNext1 ? '#fff' : '#9CA3AF', border: 'none', borderRadius: 14, padding: '16px', fontSize: 15, fontWeight: 900, cursor: canNext1 ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
              다음 단계 →
            </button>
          </div>
        )}

        {/* STEP 2: 세부 설정 */}
        {step === 2 && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, border: '1px solid #F0EDE8' }}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>대상 학교급 * (복수 선택)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {TARGETS.map(t => (
                  <button key={t} onClick={() => toggle('targets', t)} style={form.targets.includes(t) ? CHIP_ON : CHIP_BASE}>{t}</button>
                ))}
              </div>
            </div>

            {!isFile && (
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>가능 지역 * (복수 선택)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {REGIONS.map(r => (
                    <button key={r} onClick={() => toggle('regions', r)} style={form.regions.includes(r) ? CHIP_ON : CHIP_BASE}>{r}</button>
                  ))}
                </div>
              </div>
            )}

            {isFile && (
              <div style={{ marginBottom: 18, background: '#F0F9FF', borderRadius: 10, padding: 12, fontSize: 12, color: '#0369A1', fontWeight: 700 }}>
                📦 파일 자료는 자동으로 전국 판매됩니다
              </div>
            )}

            <div className="price-fmt-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>가격 (원) *</label>
                <input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0 = 무료" style={INPUT} />
              </div>
              {isFile ? (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>파일 형식 *</label>
                  <select value={form.fileFormat} onChange={e => set('fileFormat', e.target.value)}
                    style={{ ...INPUT, appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: 16, paddingRight: 36 }}>
                    <option value="">선택</option>
                    {FILE_FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>진행 시간 *</label>
                  <input value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="예) 2시간" style={INPUT} />
                </div>
              )}
            </div>

            {isFile && (
              <div className="price-fmt-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>페이지 수</label>
                  <input type="number" value={form.pageCount} onChange={e => set('pageCount', e.target.value)} placeholder="예) 42" style={INPUT} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>파일 용량</label>
                  <input value={form.fileSize} onChange={e => set('fileSize', e.target.value)} placeholder="예) 12.4 MB" style={INPUT} />
                </div>
              </div>
            )}

            {!isFile && (
              <>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>강의 형태 *</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[['online', '🖥 온라인 (Zoom)'], ['offline', '🏫 오프라인 (방문)']].map(([v, l]) => (
                      <button key={v} onClick={() => set('isOnline', v)} style={form.isOnline === v ? CHIP_ON : CHIP_BASE}>{l}</button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>최대 참여 인원</label>
                  <input type="number" value={form.maxParticipants} onChange={e => set('maxParticipants', e.target.value)} placeholder="예) 40" style={INPUT} />
                </div>
              </>
            )}

            {/* 파일 첨부 (파일 자료 전용) */}
            {isFile && (
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
                  판매 파일 첨부
                  <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500, marginLeft: 6 }}>구매자에게 제공될 파일을 업로드하세요</span>
                </label>

                {/* 드롭존 */}
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragOver ? '#111827' : '#D1D5DB'}`,
                    borderRadius: 12,
                    padding: '28px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: dragOver ? '#F9FAFB' : '#FAFAFA',
                    transition: 'all 0.15s',
                    marginBottom: 12,
                  }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 4 }}>파일을 드래그하거나 클릭해서 선택</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>PDF, PPT, HWP, ZIP, Excel 등 모든 형식 · 최대 500MB</div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    style={{ display: 'none' }}
                    onChange={e => e.target.files && addFiles(e.target.files)}
                  />
                </div>

                {/* 첨부된 파일 목록 */}
                {attachedFiles.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {attachedFiles.map((af, i) => (
                      <div key={i} className="file-row"
                        style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F9FAFB', borderRadius: 10, padding: '10px 12px', border: af.isPreview ? '2px solid #4F46E5' : '1px solid #E5E7EB', position: 'relative' }}>
                        <span style={{ fontSize: 22, flexShrink: 0 }}>{fileIcon(af.file.type)}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{af.file.name}</div>
                          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{fmtSize(af.file.size)}</div>
                        </div>
                        {/* 미리보기 파일로 지정 */}
                        <button onClick={() => togglePreview(i)}
                          title="미리보기 파일로 지정하면 구매 전에도 열람 가능"
                          style={{
                            fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 6, cursor: 'pointer', border: 'none', fontFamily: 'inherit',
                            background: af.isPreview ? '#EDE9FE' : '#F3F4F6',
                            color: af.isPreview ? '#5B21B6' : '#6B7280',
                          }}>
                          {af.isPreview ? '👁 미리보기' : '미리보기'}
                        </button>
                        {/* 삭제 */}
                        <button className="file-remove" onClick={() => removeFile(i)}
                          style={{ fontSize: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', opacity: 0, transition: 'opacity 0.15s', padding: '0 4px', lineHeight: 1 }}>
                          ✕
                        </button>
                      </div>
                    ))}
                    <div style={{ fontSize: 11, color: '#9CA3AF', padding: '4px 2px' }}>
                      💡 &ldquo;미리보기&rdquo;로 지정한 파일은 구매 전 일부 열람이 가능합니다
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>태그 (쉼표 구분)</label>
              <input value={form.tags} onChange={e => set('tags', e.target.value)}
                placeholder={isFile ? '예) 활동지, 팀빌딩, 인쇄용' : '예) Zoom, 진로, 특강'}
                style={INPUT} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 14, padding: '16px', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>← 이전</button>
              <button onClick={() => setStep(3)} disabled={!canNext2}
                style={{ flex: 2, background: canNext2 ? '#111827' : '#E5E7EB', color: canNext2 ? '#fff' : '#9CA3AF', border: 'none', borderRadius: 14, padding: '16px', fontSize: 15, fontWeight: 900, cursor: canNext2 ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                다음 단계 →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: 최종 확인 */}
        {step === 3 && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, border: '1px solid #F0EDE8' }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#111827', marginBottom: 20 }}>등록 내용 확인</h2>
            <div style={{ background: isFile ? '#F0F9FF' : '#EDE9FE', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13, fontWeight: 700, color: isFile ? '#0369A1' : '#5B21B6' }}>
              {isFile ? '📄 파일 자료' : '🎓 강의'}
            </div>
            {([
              [isFile ? '자료명' : '강의명', form.title],
              ['카테고리', form.category],
              ['대상', form.targets.join(', ')],
              !isFile ? ['지역', form.regions.join(', ')] : null,
              ['가격', form.price === '0' || form.price === '' ? '무료' : Number(form.price).toLocaleString() + '원'],
              isFile ? ['파일 형식', form.fileFormat] : ['진행 시간', form.duration],
              isFile && form.pageCount ? ['페이지 수', form.pageCount + 'p'] : null,
              !isFile ? ['강의 형태', form.isOnline === 'online' ? '온라인 (Zoom)' : '오프라인 (방문)'] : null,
              !isFile && form.maxParticipants ? ['최대 인원', form.maxParticipants + '명'] : null,
            ] as ([string, string] | null)[]).filter(Boolean).map((item) => {
              const [k, v] = item!
              return (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <span style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 600 }}>{k}</span>
                  <span style={{ fontSize: 13, color: '#111827', fontWeight: 700 }}>{v}</span>
                </div>
              )
            })}

            {/* 첨부 파일 미리보기 */}
            {isFile && attachedFiles.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>첨부 파일 ({attachedFiles.length}개)</div>
                {attachedFiles.map((af, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid #F9FAFB' }}>
                    <span style={{ fontSize: 16 }}>{fileIcon(af.file.type)}</span>
                    <span style={{ fontSize: 13, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{af.file.name}</span>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>{fmtSize(af.file.size)}</span>
                    {af.isPreview && <span style={{ fontSize: 10, background: '#EDE9FE', color: '#5B21B6', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>미리보기</span>}
                  </div>
                ))}
              </div>
            )}
            {isFile && attachedFiles.length === 0 && (
              <div style={{ marginTop: 16, background: '#FFFBEB', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#92400E', fontWeight: 600 }}>
                ⚠️ 첨부 파일이 없습니다. 이전 단계에서 판매 파일을 업로드해주세요.
              </div>
            )}

            <div style={{ background: '#FEF3C7', borderRadius: 10, padding: '12px 14px', marginTop: 20, marginBottom: saveError ? 10 : 24 }}>
              <div style={{ fontSize: 12, color: '#92400E', fontWeight: 700 }}>⚠️ 등록 후 관리자 검수 (영업일 1-2일) 후 판매 시작됩니다</div>
            </div>

            {saveError && (
              <div style={{ background: '#FEF2F2', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#991B1B', fontWeight: 700 }}>
                ✕ {saveError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(2)} disabled={saving} style={{ flex: 1, background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 14, padding: '16px', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>← 이전</button>
              <button onClick={handleSubmit} disabled={saving}
                style={{ flex: 2, background: saving ? '#9CA3AF' : '#111827', color: '#fff', border: 'none', borderRadius: 14, padding: '16px', fontSize: 15, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {saving ? (saveProgress || '처리 중...') : (isFile ? '파일 자료 등록하기 ✓' : '강의 등록하기 ✓')}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: 완료 */}
        {step === 4 && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 40, border: '1px solid #F0EDE8', textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>{isFile ? '📦' : '🎓'}</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111827', marginBottom: 10 }}>등록 완료!</h2>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 8 }}>
              {isFile ? `파일 자료가 등록되었습니다.${attachedFiles.length > 0 ? ` (${attachedFiles.length}개 파일 포함)` : ''}` : '강의가 등록되었습니다.'}
            </p>
            <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 32 }}>관리자 검수 후 영업일 1-2일 내 승인됩니다.<br />승인 시 카카오 알림톡이 발송됩니다.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => {
                setStep(0)
                setAttachedFiles([])
                setThumbnailFile(null)
                setThumbnailPreview(null)
                setForm({ productType: '', title: '', subtitle: '', category: '', description: '', targets: [], regions: [], price: '', fileFormat: '', pageCount: '', fileSize: '', duration: '', maxParticipants: '', isOnline: 'online', tags: '' })
                setSaveError('')
              }}
                style={{ flex: 1, background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                추가 등록
              </button>
              <Link href="/seller/dashboard" style={{ flex: 1, background: '#111827', color: '#fff', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 800, textDecoration: 'none', textAlign: 'center', display: 'block' }}>
                대시보드 →
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
