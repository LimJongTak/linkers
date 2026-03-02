'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { useAuth } from '@/store/auth'

const CATEGORIES = ['레크리에이션', '교육', '진로', '예체능', '재능봉사']
const TARGETS    = ['초등', '중등', '고등', '대학']
const REGIONS    = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '전국']

export default function ProgramRegisterPage() {
  const { user } = useAuth()
  const router   = useRouter()

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', subtitle: '', category: '', description: '',
    targets: [] as string[], regions: [] as string[],
    price: '', duration: '', maxParticipants: '',
    tags: '',
  })

  const set = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }))
  const toggle = (k: 'targets' | 'regions', v: string) =>
    set(k, form[k].includes(v) ? form[k].filter(x => x !== v) : [...form[k], v])

  const canNext1 = form.title && form.category && form.description
  const canNext2 = form.targets.length > 0 && form.regions.length > 0 && form.price && form.duration

  const handleSubmit = () => {
    if (!user) { router.push('/login'); return }
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setStep(4) // 완료
    }, 1800)
  }

  const INPUT = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid #E5E7EB', fontSize: 14, fontFamily: 'inherit', outline: 'none', color: '#111827', background: '#fff', boxSizing: 'border-box' as const }
  const CHIP_BASE = { padding: '7px 16px', borderRadius: 20, border: '1.5px solid #E5E7EB', background: '#fff', fontSize: 13, fontWeight: 700 as const, cursor: 'pointer' as const, fontFamily: 'inherit', transition: 'all 0.15s' }
  const CHIP_ON   = { ...CHIP_BASE, background: '#111827', color: '#fff', border: '1.5px solid #111827' }

  // 비로그인 상태
  if (!user) return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <Header />
      <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🔐</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111827', marginBottom: 10 }}>로그인이 필요합니다</h2>
        <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 28 }}>프로그램을 등록하려면 먼저 로그인해주세요</p>
        <Link href="/login" style={{ display: 'inline-block', background: '#111827', color: '#fff', padding: '13px 32px', borderRadius: 12, fontWeight: 800, fontSize: 15, textDecoration: 'none' }}>
          로그인하러 가기
        </Link>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <Header />
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '32px 24px 80px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <Link href="/my" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: 22 }}>←</Link>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111827' }}>프로그램 등록</h1>
        </div>

        {/* 스텝 인디케이터 */}
        {step < 4 && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 28 }}>
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
        )}

        {/* STEP 1: 기본 정보 */}
        {step === 1 && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, border: '1px solid #F0EDE8' }}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>프로그램 이름 *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="예) 마음을 잇는 레크리에이션" style={INPUT} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>부제목</label>
              <input value={form.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="예) 아이스브레이킹 & 팀빌딩 워크샵" style={INPUT} />
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
              <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>프로그램 설명 *</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="프로그램 소개, 특징, 진행 방식을 상세히 입력해주세요" style={{ ...INPUT, height: 120, resize: 'none' }} />
            </div>
            <button onClick={() => setStep(2)} disabled={!canNext1} style={{ width: '100%', background: canNext1 ? '#111827' : '#E5E7EB', color: canNext1 ? '#fff' : '#9CA3AF', border: 'none', borderRadius: 14, padding: '16px', fontSize: 15, fontWeight: 900, cursor: canNext1 ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
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
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>가능 지역 * (복수 선택)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {REGIONS.map(r => (
                  <button key={r} onClick={() => toggle('regions', r)} style={form.regions.includes(r) ? CHIP_ON : CHIP_BASE}>{r}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>가격 (원) *</label>
                <input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0 = 무료" style={INPUT} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>진행 시간 *</label>
                <input value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="예) 2시간" style={INPUT} />
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>최대 참여 인원</label>
              <input type="number" value={form.maxParticipants} onChange={e => set('maxParticipants', e.target.value)} placeholder="예) 40" style={INPUT} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>태그 (쉼표 구분)</label>
              <input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="예) 팀빌딩, 소통, 활동" style={INPUT} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 14, padding: '16px', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>← 이전</button>
              <button onClick={() => setStep(3)} disabled={!canNext2} style={{ flex: 2, background: canNext2 ? '#111827' : '#E5E7EB', color: canNext2 ? '#fff' : '#9CA3AF', border: 'none', borderRadius: 14, padding: '16px', fontSize: 15, fontWeight: 900, cursor: canNext2 ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                다음 단계 →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: 최종 확인 */}
        {step === 3 && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, border: '1px solid #F0EDE8' }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#111827', marginBottom: 20 }}>등록 내용 확인</h2>
            {[
              ['프로그램명', form.title],
              ['카테고리', form.category],
              ['대상', form.targets.join(', ')],
              ['지역', form.regions.join(', ')],
              ['가격', form.price === '0' || form.price === '' ? '무료' : Number(form.price).toLocaleString() + '원'],
              ['진행시간', form.duration],
              ['최대 인원', form.maxParticipants ? form.maxParticipants + '명' : '미정'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
                <span style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 600 }}>{k}</span>
                <span style={{ fontSize: 13, color: '#111827', fontWeight: 700 }}>{v}</span>
              </div>
            ))}
            <div style={{ background: '#FEF3C7', borderRadius: 10, padding: '12px 14px', marginTop: 20, marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: '#92400E', fontWeight: 700 }}>⚠️ 등록 후 관리자 검수 (영업일 2-3일) 후 판매 시작됩니다</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(2)} style={{ flex: 1, background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 14, padding: '16px', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>← 이전</button>
              <button onClick={handleSubmit} disabled={saving} style={{ flex: 2, background: saving ? '#9CA3AF' : '#111827', color: '#fff', border: 'none', borderRadius: 14, padding: '16px', fontSize: 15, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {saving ? '등록 중...' : '프로그램 등록하기 ✓'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: 완료 */}
        {step === 4 && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 40, border: '1px solid #F0EDE8', textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111827', marginBottom: 10 }}>등록 완료!</h2>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 8 }}>프로그램이 등록되었습니다.</p>
            <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 32 }}>관리자 검수 후 영업일 2-3일 내 승인됩니다.<br />승인 시 카카오 알림톡이 발송됩니다.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setStep(1); setForm({ title:'', subtitle:'', category:'', description:'', targets:[], regions:[], price:'', duration:'', maxParticipants:'', tags:'' }) }} style={{ flex: 1, background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                추가 등록
              </button>
              <Link href="/seller/dashboard" style={{ flex: 1, background: '#111827', color: '#fff', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 800, textDecoration: 'none', textAlign: 'center' as const, display: 'block' }}>
                대시보드 →
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
