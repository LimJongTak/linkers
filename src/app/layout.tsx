import type { Metadata } from 'next'
import './globals.css'
import ClientProviders from './ClientProviders'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://linkers.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: '링커스 — 학교 교육 프로그램 중개 플랫폼',
    template: '%s | 링커스',
  },
  description: '대학생이 만들고 학교가 활용하는 교육 프로그램 마켓플레이스. 파일 구매, 강의 신청, 안전한 결제까지.',
  keywords: ['링커스', '교육 프로그램', '학교', '대학생', '강의', '파일 판매', '교육 마켓'],
  authors: [{ name: '링커스' }],
  openGraph: {
    type: 'website',
    siteName: '링커스',
    title: '링커스 — 학교 교육 프로그램 중개 플랫폼',
    description: '대학생이 만들고 학교가 활용하는 교육 프로그램 마켓플레이스. 파일 구매, 강의 신청, 안전한 결제까지.',
    url: siteUrl,
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: '링커스 — 학교 교육 프로그램 중개 플랫폼',
    description: '대학생이 만들고 학교가 활용하는 교육 프로그램 마켓플레이스.',
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable.css"
        />
      </head>
      <body style={{ fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif", background: '#F7F6F3', margin: 0 }}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}
