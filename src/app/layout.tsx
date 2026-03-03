import type { Metadata } from 'next'
import './globals.css'
import ClientProviders from './ClientProviders'

export const metadata: Metadata = {
  title: '링커스 — 학교 교육 프로그램 중개 플랫폼',
  description: '대학생이 만들고 학교가 활용하는 교육 프로그램 마켓플레이스',
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
