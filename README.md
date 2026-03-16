# 링커스 (Linkers)

<img src="./logo.svg" alt="링커스 로고" />

> 대학생이 만들고 학교가 활용하는 **교육 프로그램 중개 플랫폼**

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 15+ (App Router, Turbopack) |
| 언어 | TypeScript |
| DB | PostgreSQL + Prisma ORM 5 |
| 인증 | 카카오 OAuth 2.0 + JWT |
| 결제 | 포트원 v2 (`@portone/server-sdk`) |
| 파일 | AWS S3 + CloudFront Presigned URL |
| 이메일 | nodemailer (SMTP) |
| 차트 | recharts |
| 배포 | Vercel |
| 앱 | Capacitor (iOS / Android) |

---

## 주요 기능

### 사용자
- 카카오 OAuth 로그인 / JWT 토큰 인증
- 프로그램 목록 검색·필터·정렬 (카테고리, 가격, 평점 등)
- 프로그램 상세 조회 (리뷰, 문의, 샘플 다운로드)
- 장바구니 + 단건 결제 (포트원 v2, 포인트 사용, 쿠폰 적용)
- 파일 구매 즉시 다운로드 (Signed URL, 최대 5회)
- 리뷰 작성 (실구매자 검증)
- 1:1 문의 / 공지사항 / FAQ
- 마이페이지 (구매내역, 다운로드, 알림, 쿠폰)
- **프로그램 신고** (부적절한 콘텐츠·스팸·저작권 침해·허위정보·기타)

### 판매자
- 프로그램 등록·수정·삭제 (파일형 / 강의형)
- 판매 대시보드 — 매출 현황, 일별·월별 AreaChart
- 출금 신청 / 정산 내역
- 구매 확정·환불 처리

### 관리자 / 매니저
- 관리자 콘솔 (`/admin`)
- 프로그램 승인·반려·일시정지
- 회원 관리 (역할 변경, 계정 정지)
- **신고 관리** — 신고 목록 조회, 처리(프로그램 일시정지) / 기각
- 출금 처리 (승인·거절)
- 공지사항·FAQ 관리
- 쿠폰 관리
- **대시보드 차트** — 일별(30일) / 월별(12개월) 매출 + 주문 수 BarChart
- 모바일에서도 관리자·매니저 콘솔 접근 가능 (햄버거 메뉴)

### 이메일 알림 (SMTP 설정 시 활성화)
- 결제 완료 시 구매자에게 이메일 발송
- 출금 처리(완료·거절) 시 판매자에게 이메일 발송
- 1:1 문의 답변 등록 시 문의자에게 이메일 발송
- 신고 접수 시 관리자 이메일 발송

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
cp .env.example .env
# .env 를 열어 실제 값 입력
```

### 3. DB 실행 (PostgreSQL)

로컬에 PostgreSQL이 설치되어 있거나, Docker로 실행:

```bash
docker-compose up -d
# PostgreSQL이 localhost:5432 에 뜹니다
```

### 4. DB 마이그레이션

```bash
npx prisma db push        # 스키마 동기화 (개발)
npx prisma generate       # Prisma Client 재생성
npx prisma db seed        # 샘플 데이터 삽입 (선택)
npx prisma studio         # Prisma Studio GUI
```

### 5. 개발 서버 실행

```bash
npm run dev
# http://localhost:3000
```

---

## 주요 스크립트

```bash
npm run dev              # 개발 서버 (Turbopack)
npm run build            # prisma generate + 프로덕션 빌드
npm run typecheck        # TypeScript 타입 검사
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
| PATCH | `/api/programs/:id` | 수정 | seller |
| DELETE | `/api/programs/:id` | 삭제 | seller |
| GET | `/api/programs/:id/sample` | 샘플 파일 다운로드 | - |
| POST | `/api/programs/:id/report` | 신고 접수 | buyer |

### 주문·결제
| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| POST | `/api/orders` | 단건 주문 생성 | buyer |
| GET | `/api/orders` | 내 주문 목록 | buyer |
| POST | `/api/cart/checkout` | 장바구니 일괄 결제 | buyer |
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

### 문의
| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/inquiries` | 내 문의 목록 | buyer |
| POST | `/api/inquiries` | 문의 등록 | buyer |
| POST | `/api/inquiries/:id/reply` | 답변 등록 | admin/manager |

### 알림
| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/notifications` | 알림 목록 + 미읽음 수 | user |
| PATCH | `/api/notifications/:id/read` | 읽음 처리 | user |

### 장바구니
| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/cart` | 장바구니 조회 | buyer |
| POST | `/api/cart` | 항목 추가 | buyer |
| DELETE | `/api/cart/:id` | 항목 삭제 | buyer |

### 출금
| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/withdrawals` | 내 출금 목록 | seller |
| POST | `/api/withdrawals` | 출금 신청 | seller |

### 판매자
| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/seller/stats` | 판매 통계 | seller |
| GET | `/api/seller/stats/chart` | 일별/월별 차트 데이터 | seller |

### 관리자
| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/admin/users` | 회원 목록 | admin/manager |
| PATCH | `/api/admin/users/:id` | 역할·정지 변경 | admin |
| GET | `/api/admin/programs` | 프로그램 목록 | admin/manager |
| PATCH | `/api/admin/programs/:id/approve` | 승인·반려·일시정지 | admin/manager |
| GET | `/api/admin/withdrawals` | 출금 신청 목록 | admin/manager |
| PATCH | `/api/admin/withdrawals/:id` | 출금 처리 | admin/manager |
| GET | `/api/admin/reports` | 신고 목록 | admin/manager |
| PATCH | `/api/admin/reports/:id` | 신고 처리/기각 | admin/manager |
| GET | `/api/admin/stats/chart` | 전체 일별/월별 차트 데이터 | admin/manager |
| GET | `/api/admin/notices` | 공지사항 관리 | admin/manager |
| GET | `/api/admin/coupons` | 쿠폰 관리 | admin/manager |

---

## 환경변수

```env
# DB
DATABASE_URL=postgresql://user:password@localhost:5432/linkers_dev

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

# 이메일 (미설정 시 이메일 기능 비활성화)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
ADMIN_EMAIL=admin@linkers.kr

# 앱
NEXT_PUBLIC_API_BASE=
NEXT_PUBLIC_KAKAO_CLIENT_ID=
```

---

## DB 스키마 주요 모델

| 모델 | 설명 |
|------|------|
| `User` | 사용자 (buyer / seller / manager / admin) |
| `Program` | 교육 프로그램 (파일형 / 강의형) |
| `ProgramFile` | 프로그램 첨부 파일 |
| `Order` | 주문 (order_number: `LK-YYYYMMDD-XXXXXX`) |
| `OrderItem` | 주문 항목 |
| `CartItem` | 장바구니 항목 |
| `Download` | 파일 다운로드 이력 (최대 5회) |
| `Review` | 리뷰 (별점 1~5, 실구매자만 작성) |
| `Inquiry` | 1:1 문의 |
| `Notice` | 공지사항 |
| `Notification` | 사용자 알림 |
| `Withdrawal` | 출금 신청 |
| `Coupon` | 쿠폰 |
| `UserCoupon` | 쿠폰 발급 내역 |
| `Report` | 프로그램 신고 (`pending` / `reviewed` / `dismissed`) |

---

## 디렉토리 구조

```
linkers/
├── src/
│   ├── app/
│   │   ├── api/               # API Routes (백엔드)
│   │   │   ├── auth/
│   │   │   ├── programs/
│   │   │   │   └── [id]/
│   │   │   │       └── report/    # 신고 접수
│   │   │   ├── orders/
│   │   │   ├── cart/
│   │   │   ├── payments/
│   │   │   ├── downloads/
│   │   │   ├── reviews/
│   │   │   ├── inquiries/
│   │   │   ├── notifications/
│   │   │   ├── withdrawals/
│   │   │   ├── notices/
│   │   │   ├── sellers/
│   │   │   ├── my/
│   │   │   ├── seller/
│   │   │   │   └── stats/chart/   # 판매자 차트
│   │   │   ├── admin/
│   │   │   │   ├── users/
│   │   │   │   ├── programs/
│   │   │   │   ├── withdrawals/
│   │   │   │   ├── reports/       # 신고 관리
│   │   │   │   ├── stats/chart/   # 관리자 차트
│   │   │   │   ├── notices/
│   │   │   │   └── coupons/
│   │   │   └── health/
│   │   ├── programs/          # 프로그램 상세 (신고 폼 포함)
│   │   ├── seller/            # 판매자 대시보드 (AreaChart)
│   │   ├── admin/             # 관리자 콘솔 (BarChart, 신고 관리)
│   │   ├── my/                # 마이페이지
│   │   ├── privacy/           # 개인정보처리방침
│   │   ├── terms/             # 서비스 이용약관
│   │   ├── faq/               # FAQ
│   │   ├── notices/           # 공지사항
│   │   ├── sellers/           # 판매자 목록
│   │   ├── login/
│   │   └── page.tsx           # 홈
│   ├── components/
│   │   └── layout/
│   │       ├── Header.tsx     # 헤더 (모바일 햄버거 메뉴 포함)
│   │       └── Footer.tsx     # 푸터 (약관·FAQ·문의 링크)
│   ├── lib/
│   │   ├── db.ts              # Prisma 클라이언트
│   │   ├── auth.ts            # JWT 헬퍼
│   │   ├── s3.ts              # AWS S3
│   │   ├── email.ts           # 이메일 발송 (nodemailer)
│   │   ├── notify.ts          # 내부 알림
│   │   ├── permissions.ts     # 다운로드 권한
│   │   └── settlements.ts     # 정산
│   └── store/
│       └── auth.ts            # Zustand 인증 스토어
├── prisma/
│   ├── schema.prisma          # DB 스키마
│   └── seed.ts                # 샘플 데이터
├── next.config.js
└── vercel.json
```

---

## 페이지 목록

| 경로 | 설명 |
|------|------|
| `/` | 홈 (프로그램 목록) |
| `/programs/[id]` | 프로그램 상세·결제·신고 |
| `/sellers` | 인기 판매자 목록 |
| `/notices` | 공지사항 |
| `/faq` | 자주 묻는 질문 |
| `/terms` | 서비스 이용약관 |
| `/privacy` | 개인정보처리방침 |
| `/login` | 카카오 로그인 |
| `/my` | 마이페이지 |
| `/my/orders` | 구매 내역 |
| `/my/downloads` | 다운로드 내역 |
| `/my/cart` | 장바구니 |
| `/my/inquiries` | 1:1 문의 |
| `/my/notifications` | 알림 |
| `/my/coupons` | 쿠폰 |
| `/seller/dashboard` | 판매자 대시보드 |
| `/seller/programs/new` | 프로그램 등록 |
| `/seller/programs/[id]/edit` | 프로그램 수정 |
| `/admin` | 관리자·매니저 콘솔 |
