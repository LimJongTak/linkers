import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{
      background: '#111827', color: '#9CA3AF', padding: '28px 24px',
      fontFamily: "'Pretendard Variable', sans-serif",
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginRight: 8 }}>
            링커스<span style={{ color: '#4FC3F7' }}>.</span>
          </span>
          {[
            { href: '/terms', label: '서비스 이용약관' },
            { href: '/privacy', label: '개인정보처리방침' },
            { href: '/faq', label: 'FAQ' },
            { href: '/my/inquiries', label: '1:1 문의' },
          ].map(({ href, label }) => (
            <Link key={href} href={href}
              style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'none', padding: '2px 0' }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.color = '#fff' }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.color = '#9CA3AF' }}>
              {label}
            </Link>
          ))}
        </div>
        <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.7 }}>
          링커스는 통신판매중개업자로서 거래 당사자가 아니며, 판매자가 등록한 콘텐츠에 대한 책임은 판매자에게 있습니다.<br />
          © 2025 링커스. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
