# 링커스 (Linkers)

<img src="./logo.svg" alt="링커스 로고" />

> 대학생이 만들고 학교가 활용하는 **교육 프로그램 중개 플랫폼**

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router, Turbopack) |
| 언어 | TypeScript |
| DB | PostgreSQL + Prisma ORM 5 |
| 인증 | 카카오 OAuth 2.0 + JWT |
| 결제 | 포트원 v2 (`@portone/server-sdk`) |
| 파일 | AWS S3 + CloudFront Presigned URL |
| 알림 | 카카오 알림톡 |
| 배포 | Vercel |
| 앱 | Capacitor (iOS / Android) |

---

## 로컬 개발 시작

### 1. 레포 클론

```bash
git clone https://github.com/LimJongTak/linkers.git
cd linkers
npm install
```

### 2. 환경변수 설정

```bash
cp .env.example .env.local
# .env.local 을 열어 실제 값 입력
```

### 3. DB 실행 (Docker)

```bash
docker-compose up -d
# PostgreSQL이 localhost:5432 에 뜹니다
```

### 4. DB 마이그레이션 + 시드

```bash
npm run db:migrate   # 테이블 생성
npm run db:seed      # 샘플 데이터 삽입
npm run db:studio    # Prisma Studio (GUI)
```

### 5. 개발 서버 실행

```bash
npm run dev
# http://localhost:3000
```

---

## 주요 스크립트

```bash
npm run dev              # 개발 서버
npm run build            # prisma generate + 프로덕션 빌드
npm run typecheck        # TypeScript 타입 검사
npm run test             # 전체 테스트
npm run test:coverage    # 커버리지 포함
npm run db:migrate       # DB 마이그레이션 (개발)
npm run db:migrate:prod  # DB 마이그레이션 (프로덕션)
npm run db:generate      # Prisma Client 재생성
npm run db:seed          # 샘플 데이터 삽입
npm run build:app        # Capacitor 앱 빌드
npm run open:ios         # Xcode 열기
npm run open:android     # Android Studio 열기
```

---

## API 엔드포인트

### 인증
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/auth/kakao/callback` | 카카오 OAuth 콜백 |
| POST | `/api/auth/refresh` | 토큰 갱신 |

### 프로그램
| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/programs` | 목록 조회 (필터/정렬) | - |
| POST | `/api/programs` | 등록 | seller |
| GET | `/api/programs/:id` | 상세 | - |

### 주문·결제
| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| POST | `/api/orders` | 주문 생성 | buyer |
| GET | `/api/orders` | 내 주문 목록 | buyer |
| POST | `/api/payments/verify` | 결제 검증 (금액 위변조 방지) | buyer |
| POST | `/api/payments/webhook` | 포트원 Webhook | - |

### 다운로드
| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| POST | `/api/downloads/:fileId/url` | Signed URL 발급 (최대 5회) | buyer |

### 리뷰
| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| POST | `/api/reviews` | 리뷰 작성 (실구매자 검증) | buyer |
| GET | `/api/reviews?programId=` | 리뷰 목록 | - |

### 관리자
| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| PUT | `/api/admin/programs/:id/approve` | 프로그램 승인 | admin |
| DELETE | `/api/admin/programs/:id/approve` | 프로그램 반려 | admin |

---

## 환경변수

```env
# DB
DATABASE_URL=

# JWT
JWT_SECRET=

# 카카오 OAuth
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
KAKAO_REDIRECT_URI=

# 포트원 v2
PORTONE_API_SECRET=
NEXT_PUBLIC_PORTONE_STORE_ID=
NEXT_PUBLIC_PORTONE_KAKAO_KEY=
NEXT_PUBLIC_PORTONE_CARD_KEY=

# AWS S3 / CloudFront
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=
AWS_CLOUDFRONT_DOMAIN=

# 카카오 알림톡
KAKAO_ALIMTALK_KEY=
KAKAO_ALIMTALK_SENDER=

# 앱
NEXT_PUBLIC_API_BASE=
NEXT_PUBLIC_KAKAO_CLIENT_ID=
```

---

## 디렉토리 구조

```
linkers/
├── src/
│   ├── app/
│   │   ├── api/               # API Routes (백엔드)
│   │   │   ├── auth/
│   │   │   ├── programs/
│   │   │   ├── orders/
│   │   │   ├── payments/
│   │   │   ├── downloads/
│   │   │   ├── reviews/
│   │   │   ├── admin/
│   │   │   └── health/
│   │   ├── programs/          # 프로그램 상세 페이지
│   │   ├── seller/            # 판매자 대시보드
│   │   ├── admin/             # 관리자 페이지
│   │   ├── my/                # 마이페이지 (주문·다운로드·리뷰)
│   │   ├── login/             # 로그인
│   │   └── page.tsx           # 홈
│   ├── lib/                   # 공통 유틸
│   │   ├── db.ts              # Prisma 클라이언트
│   │   ├── auth.ts            # JWT 헬퍼
│   │   ├── s3.ts              # AWS S3
│   │   ├── kakao.ts           # 알림톡
│   │   ├── permissions.ts     # 다운로드 권한
│   │   └── settlements.ts     # 정산
│   └── middleware.ts          # CORS + 보안 헤더
├── prisma/
│   ├── schema.prisma          # DB 스키마
│   └── seed.ts                # 샘플 데이터
├── __tests__/
│   ├── unit/                  # 단위 테스트
│   ├── integration/           # 통합 테스트
│   └── helpers/               # 테스트 데이터 팩토리
├── docker-compose.yml         # 로컬 DB (PostgreSQL)
├── jest.config.ts             # Jest 설정
├── next.config.js             # Next.js 설정
├── vercel.json                # Vercel 배포 설정
└── tailwind.config.ts         # Tailwind CSS 설정
```
