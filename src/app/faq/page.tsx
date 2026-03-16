'use client'

import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'

const FAQS = [
  {
    category: '결제 · 환불',
    items: [
      {
        q: '결제는 어떻게 하나요?',
        a: '포인트 결제 및 카드(카카오페이·토스페이·신용카드)를 지원합니다. 프로그램 상세 페이지에서 구매하기 버튼을 눌러 진행하세요.',
      },
      {
        q: '환불은 어떻게 신청하나요?',
        a: '구매 후 7일 이내, 다운로드 이력이 없는 경우 환불 신청이 가능합니다. 마이페이지 → 구매 내역에서 환불 신청을 진행하거나 1:1 문의로 요청해 주세요.',
      },
      {
        q: '포인트는 어디서 충전하나요?',
        a: '마이페이지 → 포인트 → 충전하기에서 카드 결제 또는 기프트카드로 충전할 수 있습니다.',
      },
    ],
  },
  {
    category: '파일 다운로드',
    items: [
      {
        q: '구매 후 파일은 어디서 받나요?',
        a: '마이페이지 → 다운로드 또는 구매 내역에서 다운로드할 수 있습니다. 파일당 최대 5회 다운로드가 가능합니다.',
      },
      {
        q: '다운로드 횟수를 초과했을 때는?',
        a: '1:1 문의를 통해 관리자에게 문의해 주시면 개별 검토 후 횟수를 추가해 드립니다.',
      },
      {
        q: '어떤 파일 형식을 지원하나요?',
        a: 'PDF, PPT, PPTX, HWP, HWPX, DOCX, ZIP 등 대부분의 문서 형식을 지원합니다.',
      },
    ],
  },
  {
    category: '프로그램 등록 (판매자)',
    items: [
      {
        q: '프로그램은 누구나 등록할 수 있나요?',
        a: '네, 회원 가입 후 바로 프로그램 등록이 가능합니다. 메뉴의 "프로그램 등록" 버튼을 클릭하세요.',
      },
      {
        q: '수익금은 어떻게 정산되나요?',
        a: '판매 금액의 90%가 수익금으로 적립됩니다. 마이페이지 → 판매 내역·수익금에서 환전 신청을 할 수 있으며, 영업일 기준 3~5일 내 처리됩니다.',
      },
      {
        q: '무료 샘플 파일은 어떻게 제공하나요?',
        a: '파일 관리 페이지에서 파일 업로드 시 "미리보기" 옵션을 활성화하면 해당 파일이 무료 샘플로 제공됩니다. 프로그램당 1개만 지정 가능합니다.',
      },
    ],
  },
  {
    category: '계정 · 기타',
    items: [
      {
        q: '비밀번호를 잊어버렸어요.',
        a: '링커스는 카카오 소셜 로그인을 사용합니다. 카카오 계정 비밀번호는 카카오 계정 관리 페이지에서 재설정해 주세요.',
      },
      {
        q: '쿠폰은 어떻게 사용하나요?',
        a: '마이페이지 → 내 쿠폰에서 쿠폰 코드를 등록하고, 결제 시 적용할 수 있습니다.',
      },
      {
        q: '찜 목록은 어디서 볼 수 있나요?',
        a: '마이페이지 → 찜 목록에서 관심 프로그램을 모아볼 수 있습니다. 프로그램 카드의 ♡ 버튼으로 찜하기/취소가 가능합니다.',
      },
    ],
  },
]

export default function FaqPage() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  const toggle = (key: string) => {
    setOpenItems(prev => {
      const s = new Set(prev)
      s.has(key) ? s.delete(key) : s.add(key)
      return s
    })
  }

  return (
    <div style={{ fontFamily: "'Pretendard Variable', sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <Header />
      <main style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Link href="/" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: 22 }}>←</Link>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: '#111827', margin: 0 }}>자주 묻는 질문</h1>
        </div>
        <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 28, paddingLeft: 34 }}>
          찾으시는 답변이 없으면 <Link href="/my/inquiries" style={{ color: '#4F46E5', fontWeight: 700, textDecoration: 'none' }}>1:1 문의</Link>를 이용해 주세요.
        </p>

        {FAQS.map(section => (
          <div key={section.category} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#374151', marginBottom: 10, padding: '6px 12px', background: '#F3F4F6', borderRadius: 8, display: 'inline-block' }}>
              {section.category}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {section.items.map((item, i) => {
                const key = `${section.category}-${i}`
                const open = openItems.has(key)
                return (
                  <div key={key} style={{ background: '#fff', borderRadius: 14, border: `1.5px solid ${open ? '#4F46E5' : '#F0EDE8'}`, overflow: 'hidden', transition: 'border-color 0.15s' }}>
                    <button onClick={() => toggle(key)}
                      style={{ width: '100%', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#4F46E5', flexShrink: 0 }}>Q.</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{item.q}</span>
                      </div>
                      <span style={{ fontSize: 16, color: '#9CA3AF', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                    </button>
                    {open && (
                      <div style={{ padding: '0 20px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#10B981', flexShrink: 0, marginTop: 1 }}>A.</span>
                        <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>{item.a}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* 하단 문의 유도 */}
        <div style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', borderRadius: 16, padding: '24px 28px', textAlign: 'center', marginTop: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 6 }}>원하는 답변을 찾지 못하셨나요?</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 16 }}>관리자에게 직접 1:1로 문의해 주세요</div>
          <Link href="/my/inquiries" style={{ display: 'inline-block', background: '#fff', color: '#4F46E5', fontWeight: 800, fontSize: 14, padding: '11px 24px', borderRadius: 10, textDecoration: 'none' }}>
            1:1 문의하기 →
          </Link>
        </div>
      </main>
    </div>
  )
}
