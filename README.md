# 링커스 (Linkers)

> 대학생이 만들고 학교가 활용하는 **교육 프로그램 중개 플랫폼**

[![CI](https://github.com/your-org/linkers/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/linkers/actions)

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| 언어 | TypeScript |
| DB | PostgreSQL + Prisma ORM |
| 인증 | 카카오/구글 OAuth 2.0 + JWT |
| 결제 | 포트원 v2 (카카오페이·카드·토스) |
| 파일 | AWS S3 Presigned URL |
| 알림 | 카카오 알림톡 + SMS 폴백 |
| 배포 | Vercel (서울 리전) |
| 앱 | Capacitor (iOS / Android) |

---

## 로컬 개발 시작

### 1. 레포 클론

```bash
git clone https://github.com/your-org/linkers.git
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
npm run build            # 프로덕션 빌드
npm run typecheck        # TypeScript 타입 검사
npm run test             # 전체 테스트
npm run test:coverage    # 커버리지 포함
npm run db:migrate       # DB 마이그레이션 (개발)
npm run db:migrate:prod  # DB 마이그레이션 (프로덕션)
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
| POST | `/api/downloads/:fileId/url` | Signed URL 발급 (5회 제한) | buyer |

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

## GitHub Secrets 설정

Vercel 자동 배포를 위해 아래 Secrets를 설정하세요:

```
VERCEL_TOKEN        — Vercel 계정 토큰
VERCEL_ORG_ID       — Vercel 조직 ID
VERCEL_PROJECT_ID   — Vercel 프로젝트 ID
DATABASE_URL        — 프로덕션 RDS 연결 문자열
SLACK_WEBHOOK_URL   — 배포 알림 (선택)
CODECOV_TOKEN       — 커버리지 리포트 (선택)
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
│   │   │   └── cron/
│   │   └── (page routes)      # 프론트엔드 페이지
│   ├── lib/                   # 공통 유틸
│   │   ├── db.ts              # Prisma 클라이언트
│   │   ├── auth.ts            # JWT 헬퍼
│   │   ├── s3.ts              # AWS S3
│   │   ├── kakao.ts           # 알림톡
│   │   ├── permissions.ts     # 다운로드 권한
│   │   └── settlements.ts     # 정산
│   └── middleware.ts          # CORS + 보안 헤더
├── prisma/
│   ├── schema.prisma          # DB 스키마 (9개 테이블)
│   └── seed.ts                # 샘플 데이터
├── __tests__/
│   ├── unit/                  # 단위 테스트
│   ├── integration/           # 통합 테스트
│   └── helpers/factories.ts   # 테스트 데이터 팩토리
├── .github/workflows/ci.yml   # CI/CD 파이프라인
├── docker-compose.yml         # 로컬 DB
├── vercel.json                # Vercel 배포 설정
└── .env.example               # 환경변수 템플릿
```
