/** @type {import('next').NextConfig} */
const nextConfig = {
  // 웹 모드 기본값. Capacitor 앱 빌드 시 'export'로 변경:
  //   NEXT_OUTPUT=export npm run build
  output: process.env.NEXT_OUTPUT === 'export' ? 'export' : undefined,
  trailingSlash: process.env.NEXT_OUTPUT === 'export',
  images: {
    unoptimized: process.env.NEXT_OUTPUT === 'export',
    remotePatterns: [
      { protocol: 'https', hostname: '*.kakaocdn.net' },
      { protocol: 'https', hostname: 'k.kakaocdn.net' },
      { protocol: 'https', hostname: `${process.env.AWS_CLOUDFRONT_DOMAIN}` },
    ],
  },
  env: {
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE,
    NEXT_PUBLIC_PORTONE_STORE_ID: process.env.NEXT_PUBLIC_PORTONE_STORE_ID,
    NEXT_PUBLIC_PORTONE_KAKAO_KEY: process.env.NEXT_PUBLIC_PORTONE_KAKAO_KEY,
    NEXT_PUBLIC_PORTONE_CARD_KEY: process.env.NEXT_PUBLIC_PORTONE_CARD_KEY,
    NEXT_PUBLIC_KAKAO_CLIENT_ID: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  serverExternalPackages: ['@prisma/client', 'prisma'],
};

module.exports = nextConfig;
