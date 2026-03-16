'use client'

import Link from 'next/link'
import Header from '@/components/layout/Header'

const sections = [
  {
    title: '제1조 (목적)',
    content: `이 약관은 링커스(이하 "회사")가 제공하는 링커스 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.`,
  },
  {
    title: '제2조 (서비스 이용)',
    content: `① 서비스는 교육·레크리에이션 프로그램 파일 및 강의를 판매·구매할 수 있는 플랫폼입니다.\n② 회원은 카카오 소셜 로그인을 통해 가입하며, 구매자와 판매자 역할을 모두 수행할 수 있습니다.\n③ 만 14세 미만은 서비스를 이용할 수 없습니다.`,
  },
  {
    title: '제3조 (판매자 의무)',
    content: `① 판매자는 저작권 등 제3자의 권리를 침해하지 않는 콘텐츠만 등록해야 합니다.\n② 허위·과장 정보를 기재해서는 안 됩니다.\n③ 판매 수익금의 10%가 플랫폼 수수료로 공제됩니다.\n④ 등록된 프로그램은 관리자 검수 후 활성화됩니다.`,
  },
  {
    title: '제4조 (결제 및 환불)',
    content: `① 프로그램 구매 시 결제 수단은 포인트, 카드(카카오페이·토스페이·신용카드)를 지원합니다.\n② 환불은 구매 후 7일 이내, 파일 다운로드 이력이 없는 경우에만 가능합니다.\n③ 디지털 콘텐츠의 특성상 다운로드 후에는 환불이 불가합니다.\n④ 환불 신청은 마이페이지 → 구매 내역 또는 1:1 문의를 통해 진행합니다.`,
  },
  {
    title: '제5조 (파일 다운로드)',
    content: `① 구매한 파일은 파일당 최대 5회 다운로드 가능합니다.\n② 다운로드 횟수 초과 시 1:1 문의를 통해 관리자 검토 후 추가 제공할 수 있습니다.\n③ 구매한 파일을 무단으로 재배포하거나 상업적으로 이용하는 것은 금지됩니다.`,
  },
  {
    title: '제6조 (포인트)',
    content: `① 포인트는 카드 결제 또는 기프트카드를 통해 충전할 수 있습니다.\n② 포인트는 현금으로 환급되지 않습니다.\n③ 회원 탈퇴 시 잔여 포인트는 소멸됩니다.\n④ 포인트의 유효기간은 마지막 이용일로부터 1년입니다.`,
  },
  {
    title: '제7조 (금지 행위)',
    content: `다음 행위는 금지됩니다.\n\n- 타인의 계정 도용 또는 계정 정보 허위 기재\n- 서비스의 정상적인 운영을 방해하는 행위\n- 저작권 침해 콘텐츠 등록\n- 불법적인 거래 또는 결제 시도\n- 스팸·광고성 콘텐츠 게시\n\n위반 시 서비스 이용 제한 또는 회원 자격 박탈 조치가 취해질 수 있습니다.`,
  },
  {
    title: '제8조 (책임 제한)',
    content: `① 회사는 무료로 제공되는 서비스 이용과 관련하여 회원에게 발생한 손해에 대해 책임지지 않습니다.\n② 회원이 게시한 콘텐츠에 대한 법적 책임은 해당 회원에게 있습니다.\n③ 천재지변, 불가항력적 사유로 인한 서비스 중단에 대해 책임지지 않습니다.`,
  },
  {
    title: '제9조 (약관의 변경)',
    content: `① 회사는 약관을 변경할 경우 적용일 및 변경 사유를 명시하여 현행 약관과 함께 7일 이상 공지합니다.\n② 이용자가 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.`,
  },
]

export default function TermsPage() {
  return (
    <div style={{ fontFamily: "'Pretendard Variable', sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <Header />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Link href="/" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: 22 }}>←</Link>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111827', margin: 0 }}>서비스 이용약관</h1>
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

        <div style={{ background: 'linear-gradient(135deg, #111827, #374151)', borderRadius: 16, padding: '24px 28px', textAlign: 'center', marginTop: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 8 }}>약관에 대한 문의사항이 있으신가요?</div>
          <Link href="/my/inquiries" style={{ display: 'inline-block', background: '#fff', color: '#111827', fontWeight: 800, fontSize: 13, padding: '10px 22px', borderRadius: 10, textDecoration: 'none' }}>
            1:1 문의하기 →
          </Link>
        </div>
      </main>
    </div>
  )
}
