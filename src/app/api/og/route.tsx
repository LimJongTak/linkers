import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #111827 0%, #1F2D45 50%, #111827 100%)',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* 배경 장식 원 */}
        <div style={{
          position: 'absolute',
          top: '-80px',
          right: '-80px',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(79, 195, 247, 0.06)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-100px',
          left: '-100px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'rgba(79, 195, 247, 0.04)',
          display: 'flex',
        }} />

        {/* 로고 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '24px',
        }}>
          <span style={{
            fontSize: '80px',
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '-2px',
          }}>링커스</span>
          <span style={{
            fontSize: '80px',
            fontWeight: 900,
            color: '#4FC3F7',
          }}>.</span>
        </div>

        {/* 구분선 */}
        <div style={{
          width: '60px',
          height: '4px',
          background: '#4FC3F7',
          borderRadius: '2px',
          marginBottom: '28px',
          display: 'flex',
        }} />

        {/* 설명 */}
        <div style={{
          fontSize: '28px',
          color: '#94A3B8',
          textAlign: 'center',
          lineHeight: 1.5,
          maxWidth: '700px',
        }}>
          학교 교육 프로그램 중개 플랫폼
        </div>

        <div style={{
          fontSize: '20px',
          color: '#64748B',
          textAlign: 'center',
          marginTop: '16px',
          maxWidth: '680px',
        }}>
          대학생이 만들고 학교가 활용하는 교육 마켓플레이스
        </div>

        {/* 하단 URL */}
        <div style={{
          position: 'absolute',
          bottom: '40px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#4FC3F7',
            display: 'flex',
          }} />
          <span style={{
            fontSize: '18px',
            color: '#4FC3F7',
            letterSpacing: '0.5px',
          }}>linkers-seven.vercel.app</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
