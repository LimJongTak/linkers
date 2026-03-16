import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = '링커스 — 학교 교육 프로그램 중개 플랫폼'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

async function loadKoreanFont() {
  const css = await fetch(
    'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@900&display=swap',
    { headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' } }
  ).then(r => r.text())
  const url = css.match(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/)?.[1]
  if (!url) return null
  return fetch(url).then(r => r.arrayBuffer())
}

export default async function Image() {
  const fontData = await loadKoreanFont().catch(() => null)

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0F172A 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
          fontFamily: fontData ? 'NotoKR' : 'sans-serif',
        }}
      >
        {/* 로고 영역 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px', gap: '0px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ fontSize: 96, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-3px', lineHeight: 1 }}>
              링커스
            </span>
            <span style={{ fontSize: 96, fontWeight: 900, color: '#4FC3F7', lineHeight: 1 }}>.</span>
          </div>
        </div>

        {/* 설명 */}
        <div style={{
          display: 'flex',
          fontSize: 30,
          color: '#94A3B8',
          marginBottom: '44px',
          letterSpacing: '-0.5px',
          textAlign: 'center',
        }}>
          대학생이 만들고 학교가 활용하는 교육 프로그램 마켓플레이스
        </div>

        {/* 태그 칩 */}
        <div style={{ display: 'flex', gap: '14px' }}>
          {['📁 파일 판매', '📅 강의 신청', '⭐ 리뷰 시스템', '🔒 안전 결제'].map((tag) => (
            <div
              key={tag}
              style={{
                display: 'flex',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '100px',
                padding: '10px 24px',
                fontSize: 20,
                color: '#CBD5E1',
              }}
            >
              {tag}
            </div>
          ))}
        </div>

        {/* 하단 URL */}
        <div style={{
          display: 'flex',
          position: 'absolute',
          bottom: '36px',
          right: '52px',
          fontSize: 18,
          color: '#475569',
        }}>
          linkers.vercel.app
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [{ name: 'NotoKR', data: fontData, weight: 900, style: 'normal' }]
        : [],
    }
  )
}
