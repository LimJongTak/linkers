'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import Header from '@/components/layout/Header'
import { PROGRAMS } from '@/store/data'
import { useAuth } from '@/store/auth'

const fmt = (n: number) => n === 0 ? '무료' : `${n.toLocaleString()}원`
const cardGrad = (c: string) => ({'레크리에이션':'#E0F2FE,#BAE6FD','교육':'#EDE9FE,#DDD6FE','진로':'#FEF3C7,#FDE68A','예체능':'#FCE7F3,#FBCFE8','재능봉사':'#D1FAE5,#A7F3D0'}[c]??'#F3F4F6,#E5E7EB')

export default function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const [tab, setTab] = useState<'intro'|'curriculum'|'reviews'>('intro')
  const [showModal, setShowModal] = useState(false)
  const [payStep, setPayStep] = useState<'form'|'paying'|'done'>('form')
  const [payMethod, setPayMethod] = useState('kakao')
  const [date, setDate] = useState('')
  const [msg, setMsg] = useState('')

  const p = PROGRAMS.find(x => x.id === id)
  if (!p) return (
    <div style={{ fontFamily: "'Pretendard Variable',sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <Header />
      <div style={{ textAlign: 'center', padding: '100px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😢</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 8 }}>프로그램을 찾을 수 없어요</div>
        <Link href="/" style={{ color: '#4FC3F7', fontWeight: 700 }}>← 목록으로 돌아가기</Link>
      </div>
    </div>
  )

  const handleBuy = () => {
    if (!user) { router.push('/login'); return }
    setShowModal(true)
    setPayStep('form')
  }

  const handlePay = () => {
    setPayStep('paying')
    setTimeout(() => setPayStep('done'), 2000)
  }

  const SAMPLE_REVIEWS = [
    { author: '서울 한강중 학생회장', role: '학생회', rating: 5, date: '2025.02.15', content: '아이들이 처음엔 긴장했는데 10분 만에 완전히 풀렸어요. 진행자분이 에너지도 넘치고 아이들 눈높이에 딱 맞게 진행해주셨어요. 활동 자료도 정말 잘 만들어져 있었습니다.' },
    { author: '경기 분당초 담임교사', role: '교사', rating: 5, date: '2025.02.01', content: '3학년 전체 대상으로 진행했는데 아이들 반응이 폭발적이었어요. 팀빌딩 효과가 확실하게 느껴졌고, 다음 학기에도 꼭 다시 신청할 예정입니다.' },
    { author: '인천 계양중 학생부장', role: '교사', rating: 4, date: '2025.01.20', content: '내용 구성 자체는 정말 탄탄했습니다. 다만 일정 조율 과정에서 소통이 조금 아쉬웠어요. 그래도 실제 프로그램 결과물은 만족스러웠습니다.' },
  ]

  return (
    <div style={{ fontFamily: "'Pretendard Variable',Pretendard,-apple-system,sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        .tab-btn{padding:12px 16px;border:none;background:none;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;color:#9CA3AF;border-bottom:2px solid transparent;transition:all 0.15s;white-space:nowrap;}
        .tab-btn.on{color:#111827;border-bottom-color:#111827;}
        .tab-bar{display:flex;overflow-x:auto;-webkit-overflow-scrolling:touch;}
        .tab-bar::-webkit-scrollbar{display:none;}
        .pay-method{padding:14px 16px;border-radius:12px;border:2px solid #E5E7EB;cursor:pointer;transition:all 0.15s;display:flex;align-items:center;gap:10px;background:#fff;}
        .pay-method.on{border-color:#111827;background:#F9FAFB;}
        .input-field{width:100%;padding:12px 14px;border-radius:10px;border:2px solid #E5E7EB;font-size:14px;font-family:inherit;outline:none;transition:border-color 0.15s;color:#111827;background:#fff;}
        .input-field:focus{border-color:#111827;}
        @media(max-width:768px){
          .detail-grid{display:block!important;}
          .sticky-box{display:none!important;}
          .mobile-buy-bar{display:flex!important;}
          .detail-padding{padding:16px 16px 80px!important;}
          .review-header{flex-wrap:wrap;gap:4px!important;}
          .meta-grid{grid-template-columns:1fr 1fr!important;}
        }
        @media(min-width:769px){.mobile-buy-bar{display:none!important;}}
      `}</style>

      <Header />

      <div className="detail-padding" style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 80px' }}>
        {/* 뒤로가기 */}
        <Link href="/" style={{ fontSize: 13, color: '#6B7280', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
          ← 목록으로
        </Link>

        <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' }}>
          {/* 왼쪽 */}
          <div>
            {/* 썸네일 */}
            <div style={{ height: 220, background: `linear-gradient(135deg,${cardGrad(p.category)})`, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, marginBottom: 24, position: 'relative' }}>
              {p.icon}
              <span style={{ position: 'absolute', top: 16, left: 16, background: '#111827', color: '#fff', fontSize: 12, fontWeight: 800, padding: '4px 12px', borderRadius: 8 }}>{p.category}</span>
            </div>

            {/* 기본 정보 */}
            <div style={{ background: '#fff', borderRadius: 20, padding: 28, marginBottom: 16, border: '1px solid #F0EDE8' }}>
              {p.badge && <span style={{ display: 'inline-block', background: p.badgeColor, color: '#fff', fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 6, marginBottom: 10 }}>{p.badge}</span>}
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#111827', marginBottom: 8, lineHeight: 1.3 }}>{p.title}</h1>
              <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}>{p.subtitle}</p>

              {/* 판매자 */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 16, background: '#F9FAFB', borderRadius: 12, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#667EEA,#764BA2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff', fontWeight: 900 }}>{p.seller[0]}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{p.seller}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>{p.university}</div>
                </div>
                <Link href="/sellers" style={{ marginLeft: 'auto', fontSize: 12, color: '#4FC3F7', fontWeight: 700, textDecoration: 'none' }}>프로필 보기 →</Link>
              </div>

              {/* 메타 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[['⏱ 진행시간', p.duration ?? '협의'],['👥 최대 인원', `${p.maxParticipants ?? '미정'}명`],['📍 가능 지역', p.region.join(', ')],['🎯 대상', p.target.join(', ')]].map(([k,v])=>(
                  <div key={k} style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 3 }}>{k}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 탭 */}
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #F0EDE8', overflow: 'hidden' }}>
              <div className="tab-bar" style={{ display: 'flex', borderBottom: '1px solid #F0EDE8' }}>
                {(['intro','curriculum','reviews'] as const).map(t => (
                  <button key={t} className={`tab-btn ${tab===t?'on':''}`} onClick={()=>setTab(t)}>
                    {t==='intro'?'소개':t==='curriculum'?'커리큘럼':`리뷰 (${p.reviewCount})`}
                  </button>
                ))}
              </div>
              <div style={{ padding: 24 }}>
                {tab === 'intro' && (
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.8 }}>{p.description ?? '상세 설명이 준비 중입니다.'}</p>
                )}
                {tab === 'curriculum' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(p.curriculum ?? []).map(c => (
                      <div key={c.step} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#111827', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, flexShrink: 0 }}>{c.step}</div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 2 }}>{c.title}</div>
                          <div style={{ fontSize: 13, color: '#6B7280' }}>{c.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {tab === 'reviews' && (
                  <div>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 20, background: '#F9FAFB', borderRadius: 14, marginBottom: 20 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 48, fontWeight: 900, color: '#111827', lineHeight: 1 }}>{p.rating}</div>
                        <div style={{ color: '#F59E0B', fontSize: 18, marginTop: 4 }}>{'★'.repeat(Math.round(p.rating))}</div>
                        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{p.reviewCount}개 리뷰</div>
                      </div>
                    </div>
                    {SAMPLE_REVIEWS.map((r, i) => (
                      <div key={i} style={{ borderBottom: '1px solid #F3F4F6', paddingBottom: 16, marginBottom: 16 }}>
                        <div className="review-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
                          <div style={{ minWidth: 0 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{r.author}</span>
                            <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 8 }}>{r.role} · {r.date}</span>
                          </div>
                          <div style={{ color: '#F59E0B', flexShrink: 0 }}>{'★'.repeat(r.rating)}</div>
                        </div>
                        <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7 }}>{r.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 오른쪽 구매 박스 (sticky) */}
          <div className="sticky-box" style={{ position: 'sticky', top: 80 }}>
            <div style={{ background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #F0EDE8', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: p.price === 0 ? '#10B981' : '#111827', marginBottom: 4 }}>{fmt(p.price)}</div>
              {p.price > 0 && <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>1회 진행 기준</div>}
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <div style={{ flex: 1, background: '#F9FAFB', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>별점</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#111827' }}>★ {p.rating}</div>
                </div>
                <div style={{ flex: 1, background: '#F9FAFB', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>리뷰</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#111827' }}>{p.reviewCount}개</div>
                </div>
                <div style={{ flex: 1, background: '#F9FAFB', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>진행</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#111827' }}>{p.duration ?? '협의'}</div>
                </div>
              </div>
              <button onClick={handleBuy} style={{ width: '100%', background: '#111827', color: '#fff', border: 'none', borderRadius: 14, padding: '16px', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 }}>
                지금 신청하기 →
              </button>
              <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center' }}>✅ 안전결제 · 환불정책 적용</div>
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 하단 구매 바 */}
      <div className="mobile-buy-bar" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #F0EDE8', padding: '12px 20px 20px', display: 'flex', gap: 12, alignItems: 'center', zIndex: 99 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#111827' }}>{fmt(p.price)}</div>
          <div style={{ fontSize: 11, color: '#9CA3AF' }}>★ {p.rating} ({p.reviewCount})</div>
        </div>
        <button onClick={handleBuy} style={{ flex: 1, background: '#111827', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
          지금 신청하기 →
        </button>
      </div>

      {/* 결제 모달 */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '28px 24px 40px', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            {payStep === 'form' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#111827' }}>신청 정보 입력</div>
                  <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>✕</button>
                </div>
                <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 14, marginBottom: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{p.title}</div>
                  <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>{fmt(p.price)}</div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>희망 일시</label>
                  <input type="datetime-local" value={date} onChange={e=>setDate(e.target.value)} className="input-field" />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>요청사항 (선택)</label>
                  <textarea value={msg} onChange={e=>setMsg(e.target.value)} placeholder="장소, 참여 인원, 특이사항 등을 자유롭게 입력해주세요" className="input-field" style={{ resize: 'none', height: 80 }} />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10 }}>결제 수단</div>
                  {[['kakao','💛 카카오페이'],['card','💳 신용카드'],['toss','💙 토스페이']].map(([v,l])=>(
                    <div key={v} className={`pay-method ${payMethod===v?'on':''}`} style={{ marginBottom: 8 }} onClick={()=>setPayMethod(v)}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${payMethod===v?'#111827':'#D1D5DB'}`, background: payMethod===v?'#111827':'transparent', flexShrink: 0 }} />
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{l}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 14, marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>총 결제 금액</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#111827' }}>{fmt(p.price)}</span>
                </div>
                <button onClick={handlePay} style={{ width: '100%', background: payMethod==='kakao'?'#FEE500':payMethod==='toss'?'#0064FF':'#111827', color: payMethod==='kakao'?'#1A1A1A':'#fff', border: 'none', borderRadius: 14, padding: '16px', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {fmt(p.price)} 결제하기
                </button>
              </>
            )}
            {payStep === 'paying' && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 16, animation: 'spin 1s linear infinite' }}>⏳</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>결제 처리 중...</div>
                <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
              </div>
            )}
            {payStep === 'done' && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#111827', marginBottom: 8 }}>신청이 완료되었습니다!</div>
                <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 28 }}>확인 알림톡이 발송되었습니다</div>
                <button onClick={() => { setShowModal(false); router.push('/my/orders') }} style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 28px', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                  구매 내역 확인 →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
