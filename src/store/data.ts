export type ProductType = 'file_product' | 'class'

export interface Program {
  id: string
  productType: ProductType
  title: string
  subtitle: string
  seller: string
  university: string
  category: string
  target: string[]
  region: string[]
  price: number
  rating: number
  reviewCount: number
  tags: string[]
  icon: string
  badge?: string
  badgeColor?: string
  description?: string
  // 파일 상품 전용
  fileFormat?: string      // PDF, PPT, HWP, ZIP
  pageCount?: number
  fileSize?: string        // "12.4 MB"
  previewImages?: string[] // 미리보기 이미지 URL (mock: emoji)
  // 강의 상품 전용
  duration?: string
  maxParticipants?: number
  curriculum?: { step: number; title: string; desc: string }[]
  isOnline?: boolean
}

export interface Seller {
  id: string
  name: string
  university: string
  major: string
  avatar: string
  bio: string
  programs: number
  totalReviews: number
  rating: number
  badge?: string
}

export interface Notice {
  id: string
  category: '공지' | '업데이트' | '이벤트'
  title: string
  date: string
  isNew?: boolean
  content: string
}

// ── 파일·자료 상품 ─────────────────────────────────────────────
const FILE_PRODUCTS: Program[] = [
  {
    id: '1',
    productType: 'file_product',
    title: '학기 초 팀빌딩 활동지 패키지',
    subtitle: '아이스브레이킹 + 팀 세우기 워크시트 20종',
    seller: '이민준',
    university: '연세대학교',
    category: '레크리에이션',
    target: ['초등', '중등'],
    region: ['전국'],
    price: 9900,
    rating: 4.9,
    reviewCount: 124,
    tags: ['팀빌딩', '활동지', '인쇄용'],
    icon: '🎯',
    badge: '베스트셀러',
    badgeColor: '#EF4444',
    fileFormat: 'PDF+PPT',
    pageCount: 42,
    fileSize: '18.2 MB',
    description: '3년간 30개 학교에서 직접 사용하며 검증된 팀빌딩 활동지 패키지입니다. 첫 만남부터 팀워크까지 단계별로 구성되어 있어 바로 인쇄해서 사용할 수 있습니다.',
    previewImages: ['📄', '🖨️', '✏️'],
  },
  {
    id: '2',
    productType: 'file_product',
    title: '코딩 특강 올인원 PPT',
    subtitle: 'AI·스크래치·파이썬 3강 세트 (수정 가능)',
    seller: '에듀테크 스타터',
    university: 'KAIST',
    category: '교육',
    target: ['초등', '중등', '고등'],
    region: ['전국'],
    price: 19900,
    rating: 5.0,
    reviewCount: 87,
    tags: ['PPT', 'AI', '코딩'],
    icon: '💻',
    badge: '신규',
    badgeColor: '#3B82F6',
    fileFormat: 'PPTX',
    pageCount: 96,
    fileSize: '34.7 MB',
    description: 'AI 교육 전문가가 제작한 코딩 특강 PPT입니다. 스크래치, 파이썬, AI 체험 3강 세트로 구성되어 있으며 편집 가능한 PPTX 형식으로 제공됩니다.',
    previewImages: ['📊', '🤖', '💡'],
  },
  {
    id: '3',
    productType: 'file_product',
    title: '진로탐색 워크시트 30종',
    subtitle: '강점·흥미·직업가치관 자기이해 활동지',
    seller: '김서연',
    university: '홍익대학교',
    category: '진로',
    target: ['중등', '고등'],
    region: ['전국'],
    price: 14900,
    rating: 4.8,
    reviewCount: 56,
    tags: ['진로', '워크시트', '자기이해'],
    icon: '🎨',
    fileFormat: 'PDF+HWP',
    pageCount: 64,
    fileSize: '9.8 MB',
    description: '홍익대 디자인씽킹 퍼실리테이터가 제작한 진로탐색 워크시트 완전판입니다. 강점 발견부터 직업 가치관 탐색까지 체계적으로 구성되어 있습니다.',
    previewImages: ['📝', '🔍', '🌟'],
  },
  {
    id: '4',
    productType: 'file_product',
    title: '뮤지컬 발성·표현 수업 자료',
    subtitle: '방과후 예체능 수업용 PPT + 악보 + 활동지',
    seller: '최예린',
    university: '한국예술종합학교',
    category: '예체능',
    target: ['초등', '중등'],
    region: ['전국'],
    price: 24900,
    rating: 4.7,
    reviewCount: 33,
    tags: ['뮤지컬', 'PPT', '악보'],
    icon: '🎭',
    fileFormat: 'PDF+PPTX',
    pageCount: 58,
    fileSize: '27.3 MB',
    description: '한예종 뮤지컬 전공생이 직접 제작한 방과후 예체능 수업 자료 세트입니다. 발성 워밍업 PPT, 악보, 수업 활동지가 모두 포함되어 있습니다.',
    previewImages: ['🎵', '📋', '🎤'],
  },
  {
    id: '5',
    productType: 'file_product',
    title: '수학·AI 융합 수업 패키지',
    subtitle: '통계·머신러닝 개념을 수업으로 — PPT+학습지+퀴즈',
    seller: '박준혁',
    university: 'POSTECH',
    category: '교육',
    target: ['고등'],
    region: ['전국'],
    price: 29900,
    rating: 4.9,
    reviewCount: 98,
    tags: ['수학', 'AI', 'PPT'],
    icon: '🧮',
    badge: '추천',
    badgeColor: '#10B981',
    fileFormat: 'PPTX+PDF',
    pageCount: 112,
    fileSize: '41.5 MB',
    description: 'POSTECH 수학과 출신이 제작한 수학-AI 융합 수업 패키지입니다. 수능 수학 개념이 실제 AI에 어떻게 쓰이는지 설명하는 PPT와 학습지, 형성평가 퀴즈가 포함됩니다.',
    previewImages: ['📐', '🤖', '📊'],
  },
  {
    id: '6',
    productType: 'file_product',
    title: '환경교육 텃밭 커리큘럼 가이드',
    subtitle: '학교 텃밭 한 학기 운영 완전 가이드북',
    seller: '김민지',
    university: '고려대학교',
    category: '환경·생태',
    target: ['초등'],
    region: ['전국'],
    price: 0,
    rating: 4.6,
    reviewCount: 41,
    tags: ['환경', '텃밭', '무료'],
    icon: '🌱',
    badge: '무료',
    badgeColor: '#10B981',
    fileFormat: 'PDF',
    pageCount: 38,
    fileSize: '6.1 MB',
    description: '고려대 환경학과 학생들이 실제 학교에서 운영한 텃밭 커리큘럼 가이드입니다. 씨앗 심기부터 수확까지 한 학기 주차별 활동 계획서와 관찰일지가 포함됩니다.',
    previewImages: ['🌿', '📅', '✅'],
  },
  {
    id: '7',
    productType: 'file_product',
    title: '리더십 캠프 기획 템플릿 세트',
    subtitle: '1박2일 캠프 기획서·진행표·평가지 완전판',
    seller: '정우성',
    university: '서울대학교',
    category: '진로',
    target: ['중등', '고등'],
    region: ['전국'],
    price: 39900,
    rating: 4.8,
    reviewCount: 67,
    tags: ['리더십', '캠프', '기획서'],
    icon: '🏕️',
    badge: '프리미엄',
    badgeColor: '#7C3AED',
    fileFormat: 'PPT+HWP+PDF',
    pageCount: 88,
    fileSize: '22.6 MB',
    description: '서울대 학생처 인턴 경력자가 실제 사용한 리더십 캠프 기획 템플릿 완전판입니다. 기획서, 시간표, 프로그램 진행표, 만족도 평가지까지 즉시 사용 가능한 형태로 제공됩니다.',
    previewImages: ['📋', '⏰', '📊'],
  },
  {
    id: '8',
    productType: 'file_product',
    title: '스마트폰 사진 수업 PPT + 실습 미션지',
    subtitle: '구도·조명·편집 3강 + 촬영 미션 15종',
    seller: '윤하은',
    university: '중앙대학교',
    category: '예체능',
    target: ['중등', '고등'],
    region: ['전국'],
    price: 12900,
    rating: 4.5,
    reviewCount: 29,
    tags: ['사진', 'PPT', '미션'],
    icon: '📸',
    fileFormat: 'PPTX+PDF',
    pageCount: 54,
    fileSize: '15.8 MB',
    description: '중앙대 사진학과 출신이 만든 스마트폰 사진 수업 자료입니다. 구도, 조명, 편집 3강 PPT와 학생들이 직접 수행하는 촬영 미션지 15종이 포함됩니다.',
    previewImages: ['📷', '🎨', '✨'],
  },
]

// ── 강의 상품 ─────────────────────────────────────────────────
const CLASS_PRODUCTS: Program[] = [
  {
    id: 'c1',
    productType: 'class',
    title: '코딩 특강 (Zoom 실시간)',
    subtitle: 'AI·파이썬 입문 — 학급 단위 온라인 강의',
    seller: '에듀테크 스타터',
    university: 'KAIST',
    category: '교육',
    target: ['중등', '고등'],
    region: ['전국'],
    price: 150000,
    rating: 4.9,
    reviewCount: 22,
    tags: ['Zoom', '실시간', '코딩'],
    icon: '💻',
    badge: '온라인',
    badgeColor: '#3B82F6',
    isOnline: true,
    duration: '2시간',
    maxParticipants: 30,
    description: 'Zoom으로 진행하는 실시간 코딩 특강입니다. 학급 전체를 대상으로 AI와 파이썬 기초를 체험하는 인터랙티브 수업입니다.',
    curriculum: [
      { step: 1, title: '컴퓨팅 사고력 소개', desc: '일상 속 알고리즘 찾기' },
      { step: 2, title: '파이썬 기초 실습', desc: '변수, 반복문 직접 실습' },
      { step: 3, title: 'AI 체험', desc: '이미지 인식 AI 직접 써보기' },
      { step: 4, title: 'Q&A 및 진로 토크', desc: 'AI 분야 진로 이야기' },
    ],
  },
  {
    id: 'c2',
    productType: 'class',
    title: '진로탐색 워크샵 (방문 수업)',
    subtitle: '디자인씽킹으로 나를 발견하는 4시간 수업',
    seller: '김서연',
    university: '홍익대학교',
    category: '진로',
    target: ['중등', '고등'],
    region: ['서울', '경기', '인천'],
    price: 200000,
    rating: 4.8,
    reviewCount: 15,
    tags: ['방문수업', '진로', '워크샵'],
    icon: '🎨',
    isOnline: false,
    duration: '4시간',
    maxParticipants: 25,
    description: '강사가 직접 학교를 방문하여 진행하는 진로탐색 워크샵입니다. 디자인씽킹 기법을 활용해 자신의 강점을 발견하고 진로를 설계합니다.',
    curriculum: [
      { step: 1, title: '나 알기 (공감 단계)', desc: '나의 강점과 흥미 탐색' },
      { step: 2, title: '문제 정의', desc: '내가 해결하고 싶은 것 발견' },
      { step: 3, title: '아이디어 발산', desc: '마인드맵과 브레인스토밍' },
      { step: 4, title: '진로 비전보드 제작', desc: '나만의 미래 설계도 완성' },
    ],
  },
  {
    id: 'c3',
    productType: 'class',
    title: '팀빌딩 레크리에이션 (방문)',
    subtitle: '학기 초 친해지기 — 아이스브레이킹 2시간',
    seller: '이민준',
    university: '연세대학교',
    category: '레크리에이션',
    target: ['초등', '중등'],
    region: ['서울', '경기', '인천'],
    price: 150000,
    rating: 4.9,
    reviewCount: 38,
    tags: ['방문수업', '팀빌딩', '레크'],
    icon: '🎯',
    badge: '인기',
    badgeColor: '#EF4444',
    isOnline: false,
    duration: '2시간',
    maxParticipants: 40,
    description: '3년간 30개 학교 방문 경력의 레크리에이션 전문 진행자가 직접 방문합니다. 처음 만나는 아이들도 10분 안에 친해지는 검증된 프로그램입니다.',
    curriculum: [
      { step: 1, title: '오프닝 에너지업', desc: '전체 참여 게임으로 분위기 시작' },
      { step: 2, title: '짝 찾기 미션', desc: '키워드 매칭으로 자연스러운 소개' },
      { step: 3, title: '팀빌딩 게임 3종', desc: '협동과 소통을 키우는 핵심 활동' },
      { step: 4, title: '클로징', desc: '감정 공유로 마음 잇기' },
    ],
  },
  {
    id: 'c4',
    productType: 'class',
    title: '수학·AI 융합 특강 (방문/온라인)',
    subtitle: '통계와 머신러닝을 수학 수업으로 — 고교 대상',
    seller: '박준혁',
    university: 'POSTECH',
    category: '교육',
    target: ['고등'],
    region: ['전국'],
    price: 180000,
    rating: 4.9,
    reviewCount: 31,
    tags: ['특강', 'AI', '수학'],
    icon: '🧮',
    badge: '추천',
    badgeColor: '#10B981',
    isOnline: true,
    duration: '3시간',
    maxParticipants: 35,
    description: 'POSTECH 수학과 출신이 직접 진행하는 수학-AI 융합 특강입니다. 방문 또는 Zoom 온라인으로 선택 가능합니다.',
    curriculum: [
      { step: 1, title: '수학이 AI를 만날 때', desc: '실제 AI 사례로 동기부여' },
      { step: 2, title: '통계와 데이터 분석', desc: '엑셀로 직접 해보는 통계' },
      { step: 3, title: '머신러닝 체험', desc: 'teachablemachine으로 AI 만들기' },
      { step: 4, title: '진로 토크', desc: 'AI 분야 진로와 대학 입시' },
    ],
  },
]

export const PROGRAMS: Program[] = [...FILE_PRODUCTS, ...CLASS_PRODUCTS]
export const FILE_PROGRAMS  = FILE_PRODUCTS
export const CLASS_PROGRAMS = CLASS_PRODUCTS

export const SELLERS: Seller[] = [
  { id: 's1', name: '이민준', university: '연세대학교', major: '교육학과 4학년', avatar: '🧑‍🏫', bio: '3년간 30개 학교 방문, 레크리에이션 전문 진행자 · 활동지 베스트셀러 작가', programs: 4, totalReviews: 162, rating: 4.9, badge: 'TOP 판매자' },
  { id: 's2', name: '에듀테크 스타터', university: 'KAIST', major: '전산학부 졸업', avatar: '👨‍💻', bio: 'AI 교육 전문가 · 코딩 수업자료 & 실시간 강의 운영', programs: 3, totalReviews: 109, rating: 5.0, badge: '인기 판매자' },
  { id: 's3', name: '김서연', university: '홍익대학교', major: '시각디자인학과 3학년', avatar: '👩‍🎨', bio: '디자인씽킹 퍼실리테이터 · 진로 워크시트 & 방문 강의 운영', programs: 2, totalReviews: 71, rating: 4.8 },
  { id: 's4', name: '박준혁', university: 'POSTECH', major: '수학과 대학원', avatar: '🧑‍🔬', bio: '수학 올림피아드 출신 · AI 수학 PPT 패키지 & 특강 운영', programs: 2, totalReviews: 129, rating: 4.9, badge: '추천 판매자' },
  { id: 's5', name: '최예린', university: '한국예술종합학교', major: '뮤지컬과 2학년', avatar: '👩‍🎤', bio: '학교 순회 공연 50회 이상 · 예체능 수업자료 전문 제작', programs: 1, totalReviews: 33, rating: 4.7 },
  { id: 's6', name: '정우성', university: '서울대학교', major: '사범대학 4학년', avatar: '🧑‍💼', bio: '학생처 인턴 2년 · 리더십 캠프 기획 템플릿 전문', programs: 1, totalReviews: 67, rating: 4.8 },
]

export const NOTICES: Notice[] = [
  { id: 'n1', category: '공지', title: '링커스 베타 서비스 시작 안내', date: '2026.03.01', isNew: true, content: '안녕하세요, 링커스입니다. 2026년 3월 1일부터 베타 서비스를 정식 시작합니다. 초기 가입 판매자에게는 3개월 수수료 면제 혜택을 드립니다.' },
  { id: 'n2', category: '이벤트', title: '🎉 첫 구매 10% 할인 쿠폰 지급', date: '2026.03.01', isNew: true, content: '3월 한 달간 첫 구매 고객 전원에게 10% 할인 쿠폰을 지급합니다. 카카오 로그인 후 마이페이지에서 확인하세요.' },
  { id: 'n3', category: '업데이트', title: '포인트 결제 기능 오픈', date: '2026.02.20', content: '이제 포인트로 결제가 가능합니다. 문화상품권 및 카드 충전 후 자료 구매 시 포인트를 사용하세요.' },
  { id: 'n4', category: '공지', title: '판매자 정산 정책 안내', date: '2026.02.15', content: '구매 확정 후 7영업일 이내에 등록하신 계좌로 정산금이 입금됩니다. 플랫폼 수수료는 10%입니다.' },
  { id: 'n5', category: '공지', title: '자료 등록 검수 기준 안내', date: '2026.02.10', content: '자료 등록 후 검수는 영업일 기준 2-3일 소요됩니다. 미리보기 이미지와 파일 형식 정보가 완성된 경우 더 빠른 승인이 가능합니다.' },
]
