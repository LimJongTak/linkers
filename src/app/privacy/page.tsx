'use client'

import Link from 'next/link'
import Header from '@/components/layout/Header'

const sections = [
  {
    title: '제1조 (개인정보의 수집 항목 및 수집 방법)',
    content: `링커스(이하 "회사")는 다음과 같은 개인정보를 수집합니다.\n\n■ 수집 항목\n- 필수: 닉네임, 카카오 계정 고유 ID, 이메일 주소(선택)\n- 서비스 이용 중 생성: 주문 내역, 결제 정보, 다운로드 이력, 문의 내역\n\n■ 수집 방법\n- 카카오 소셜 로그인을 통한 자동 수집\n- 서비스 이용 과정에서 자동 생성 및 수집`,
  },
  {
    title: '제2조 (개인정보의 이용 목적)',
    content: `수집한 개인정보는 다음 목적에 이용됩니다.\n\n- 서비스 회원 가입 및 관리\n- 프로그램 구매, 결제 및 환불 처리\n- 파일 다운로드 권한 관리\n- 1:1 문의 및 고객 지원\n- 서비스 이용 통계 및 분석`,
  },
  {
    title: '제3조 (개인정보의 보유 및 이용 기간)',
    content: `회사는 법령에 따른 개인정보 보유·이용 기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용 기간 내에서 개인정보를 처리·보유합니다.\n\n- 회원 정보: 회원 탈퇴 시까지\n- 거래(결제) 기록: 5년 (전자상거래법)\n- 소비자 불만 또는 분쟁처리 기록: 3년 (전자상거래법)`,
  },
  {
    title: '제4조 (개인정보의 제3자 제공)',
    content: `회사는 정보주체의 개인정보를 제1조에서 명시한 목적 범위 내에서만 처리하며, 정보주체의 동의 없이 제3자에게 제공하지 않습니다.\n단, 다음의 경우는 예외로 합니다.\n\n- 정보주체가 사전에 동의한 경우\n- 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우`,
  },
  {
    title: '제5조 (정보주체의 권리·의무 및 행사 방법)',
    content: `정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.\n\n- 개인정보 열람 요구\n- 오류 등이 있을 경우 정정 요구\n- 삭제 요구\n- 처리 정지 요구\n\n권리 행사는 1:1 문의를 통해 신청하실 수 있습니다.`,
  },
  {
    title: '제6조 (개인정보의 파기)',
    content: `회사는 개인정보 보유 기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.\n\n- 전자적 파일 형태: 복구 불가능한 방법으로 영구 삭제\n- 종이 문서: 분쇄기로 분쇄 또는 소각`,
  },
  {
    title: '제7조 (개인정보 보호 책임자)',
    content: `회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 정보주체의 개인정보 관련 불만처리 및 피해구제를 위해 아래와 같이 개인정보 보호 책임자를 지정하고 있습니다.\n\n▶ 개인정보 보호 책임자\n- 문의: 링커스 1:1 문의 채널`,
  },
]

export default function PrivacyPage() {
  return (
    <div style={{ fontFamily: "'Pretendard Variable', sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <Header />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Link href="/" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: 22 }}>←</Link>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111827', margin: 0 }}>개인정보처리방침</h1>
        </div>
        <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 32, paddingLeft: 34 }}>
          시행일: 2025년 1월 1일 · 최종 수정: 2026년 3월 1일
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sections.map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '22px 24px', border: '1px solid #F0EDE8' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 12 }}>{s.title}</div>
              <pre style={{ fontSize: 13, color: '#374151', lineHeight: 1.85, margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                {s.content}
              </pre>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
