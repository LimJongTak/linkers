export interface Program {
  id: string
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
  duration?: string
  maxParticipants?: number
  curriculum?: { step: number; title: string; desc: string }[]
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

export const PROGRAMS: Program[] = [
  {
    id: '1',
    title: '마음을 잇는 레크리에이션',
    subtitle: '아이스브레이킹 & 팀빌딩 워크샵',
    seller: '이민준',
    university: '연세대학교',
    category: '레크리에이션',
    target: ['초등', '중등'],
    region: ['서울', '경기', '인천'],
    price: 150000,
    rating: 4.9,
    reviewCount: 38,
    tags: ['팀빌딩', '소통', '활동'],
    icon: '🎯',
    badge: '인기',
    badgeColor: '#EF4444',
    description: '3년간 30회 이상 현장 검증된 레크리에이션 커리큘럼으로, 처음 만나는 아이들도 10분 안에 서로 친해지는 마법 같은 프로그램입니다. 학교 행사, 입학식, 학기초 분위기 조성에 최적화되어 있습니다.',
    duration: '2시간',
    maxParticipants: 40,
    curriculum: [
      { step: 1, title: '오프닝 에너지업', desc: '전체 참여 게임으로 분위기 시작' },
      { step: 2, title: '짝 찾기 미션', desc: '키워드 매칭으로 자연스러운 소개' },
      { step: 3, title: '팀빌딩 게임 3종', desc: '협동과 소통을 키우는 핵심 활동' },
      { step: 4, title: '감정카드 나눔', desc: '오늘 감정 공유로 마음 잇기' },
      { step: 5, title: '클로징 & 포토타임', desc: '인증샷과 함께 마무리' },
    ],
  },
  {
    id: '2',
    title: '코딩으로 세상 바꾸기',
    subtitle: '스크래치부터 파이썬까지 체험 특강',
    seller: '에듀테크 스타터',
    university: 'KAIST',
    category: '교육',
    target: ['초등', '중등', '고등'],
    region: ['전국'],
    price: 120000,
    rating: 5.0,
    reviewCount: 22,
    tags: ['코딩', 'AI', '진로'],
    icon: '💻',
    badge: '신규',
    badgeColor: '#3B82F6',
    description: 'AI 시대에 필요한 컴퓨팅 사고력을 재미있게 기르는 체험형 코딩 특강입니다. 스크래치 게임 제작부터 파이썬 기초까지, 학생들이 직접 만들며 배웁니다.',
    duration: '3시간',
    maxParticipants: 30,
    curriculum: [
      { step: 1, title: '컴퓨팅 사고력 소개', desc: '일상 속 알고리즘 찾기' },
      { step: 2, title: '스크래치 게임 제작', desc: '드래그앤드롭으로 나만의 게임' },
      { step: 3, title: '파이썬 기초 체험', desc: '변수, 반복문 실습' },
      { step: 4, title: 'AI 체험 실습', desc: '이미지 인식 AI 직접 써보기' },
    ],
  },
  {
    id: '3',
    title: '진로탐색 디자인씽킹',
    subtitle: '나를 알고 미래를 설계하는 워크샵',
    seller: '김서연',
    university: '홍익대학교',
    category: '진로',
    target: ['중등', '고등'],
    region: ['서울', '부산'],
    price: 200000,
    rating: 4.8,
    reviewCount: 15,
    tags: ['진로', '디자인', '창의'],
    icon: '🎨',
    description: '디자인씽킹 방법론을 활용하여 자신의 강점을 발견하고 진로를 설계하는 워크샵입니다. 홍익대 미술·디자인 전공자가 진행하며, 창의적 사고와 자기표현 능력을 키웁니다.',
    duration: '4시간',
    maxParticipants: 25,
    curriculum: [
      { step: 1, title: '나 알기 (공감 단계)', desc: '나의 강점과 흥미 탐색' },
      { step: 2, title: '문제 정의', desc: '내가 해결하고 싶은 것 발견' },
      { step: 3, title: '아이디어 발산', desc: '마인드맵과 브레인스토밍' },
      { step: 4, title: '진로 비전보드 제작', desc: '나만의 미래 설계도 완성' },
    ],
  },
  {
    id: '4',
    title: 'K-뮤지컬 방과후 특강',
    subtitle: '뮤지컬 넘버로 배우는 발성과 표현력',
    seller: '최예린',
    university: '한국예술종합학교',
    category: '예체능',
    target: ['초등', '중등'],
    region: ['서울'],
    price: 320000,
    rating: 4.7,
    reviewCount: 9,
    tags: ['음악', '발성', '표현'],
    icon: '🎭',
    description: '한예종 뮤지컬 전공생이 직접 진행하는 정통 뮤지컬 체험 특강입니다. 발성 기초부터 표현력까지, 무대 위에 서는 경험을 제공합니다.',
    duration: '2시간',
    maxParticipants: 20,
    curriculum: [
      { step: 1, title: '발성 워밍업', desc: '복식호흡과 발음 훈련' },
      { step: 2, title: '뮤지컬 넘버 배우기', desc: '유명 뮤지컬 한 곡 배우기' },
      { step: 3, title: '표현력 연기 수업', desc: '감정을 담은 연기 연습' },
      { step: 4, title: '미니 공연', desc: '친구들 앞에서 발표' },
    ],
  },
  {
    id: '5',
    title: '수학으로 만나는 AI 세계',
    subtitle: '통계와 머신러닝 개념 체험 수업',
    seller: '박준혁',
    university: 'POSTECH',
    category: '교육',
    target: ['고등'],
    region: ['전국'],
    price: 180000,
    rating: 4.9,
    reviewCount: 31,
    tags: ['수학', 'AI', '데이터'],
    icon: '🧮',
    badge: '추천',
    badgeColor: '#10B981',
    description: 'POSTECH 수학과 출신이 수능 수학을 AI와 연결지어 설명하는 특강입니다. 통계, 확률, 함수가 실제 AI 알고리즘에 어떻게 쓰이는지 체험합니다.',
    duration: '3시간',
    maxParticipants: 35,
    curriculum: [
      { step: 1, title: '수학이 AI를 만날 때', desc: '실제 AI 사례로 동기부여' },
      { step: 2, title: '통계와 데이터 분석', desc: '엑셀로 직접 해보는 통계' },
      { step: 3, title: '머신러닝 체험', desc: 'teachablemachine으로 AI 만들기' },
      { step: 4, title: '진로 토크', desc: 'AI 분야 진로와 대학 입시' },
    ],
  },
  {
    id: '6',
    title: '학교 텃밭 환경 봉사',
    subtitle: '도시농업으로 배우는 생태 감수성',
    seller: '김민지',
    university: '고려대학교',
    category: '재능봉사',
    target: ['초등'],
    region: ['경기', '인천'],
    price: 0,
    rating: 4.6,
    reviewCount: 7,
    tags: ['환경', '봉사', '생태'],
    icon: '🌱',
    description: '고려대 환경학과 학생들이 학교 텃밭을 직접 조성하고 운영하는 방법을 가르쳐드립니다. 씨앗 심기부터 수확까지 한 학기 커리큘럼도 제공됩니다.',
    duration: '3시간',
    maxParticipants: 30,
    curriculum: [
      { step: 1, title: '토양과 생태 소개', desc: '흙 속 생태계 관찰' },
      { step: 2, title: '씨앗 심기', desc: '모종 준비와 심기 실습' },
      { step: 3, title: '텃밭 가꾸기', desc: '물주기와 관리 방법' },
      { step: 4, title: '생태일지 작성', desc: '관찰 기록 습관 만들기' },
    ],
  },
  {
    id: '7',
    title: '리더십 캠프 기획·운영',
    subtitle: '학생 자치 역량 강화 1박2일 프로그램',
    seller: '정우성',
    university: '서울대학교',
    category: '진로',
    target: ['중등', '고등'],
    region: ['전국'],
    price: 450000,
    rating: 4.8,
    reviewCount: 18,
    tags: ['리더십', '캠프', '자치'],
    icon: '🏕️',
    description: '서울대 학생처 인턴 출신이 기획한 검증된 리더십 캠프 프로그램입니다. 학생회, 반장단, 임원들의 팀워크와 자치 능력을 키우는 1박2일 커리큘럼입니다.',
    duration: '1박2일',
    maxParticipants: 50,
    curriculum: [
      { step: 1, title: '팀 세우기 (1일차 오전)', desc: '역할 분배와 팀 목표 설정' },
      { step: 2, title: '리더십 실습 (1일차 오후)', desc: '퍼실리테이션과 의사소통 훈련' },
      { step: 3, title: '야간 프로그램', desc: '공동체 게임과 감사 나눔' },
      { step: 4, title: '비전 선포 (2일차)', desc: '우리 학교 비전 세우기 발표' },
    ],
  },
  {
    id: '8',
    title: '사진으로 기록하는 우리 학교',
    subtitle: '스마트폰 사진 수업 & 포트폴리오 제작',
    seller: '윤하은',
    university: '중앙대학교',
    category: '예체능',
    target: ['중등', '고등'],
    region: ['서울', '경기'],
    price: 90000,
    rating: 4.5,
    reviewCount: 12,
    tags: ['사진', '미디어', '창작'],
    icon: '📸',
    description: '중앙대 사진학과 출신이 진행하는 스마트폰 사진 수업입니다. 구도, 조명, 편집까지 배우고 학교를 주제로 포트폴리오를 만들어갑니다.',
    duration: '2시간',
    maxParticipants: 25,
    curriculum: [
      { step: 1, title: '사진의 기초', desc: '구도와 빛 이해하기' },
      { step: 2, title: '스마트폰 카메라 활용', desc: '수동 설정과 앱 활용' },
      { step: 3, title: '학교 촬영 실습', desc: '교내 투어하며 촬영' },
      { step: 4, title: '포트폴리오 편집', desc: '선택·보정·발표' },
    ],
  },
]

export const SELLERS: Seller[] = [
  { id: 's1', name: '이민준', university: '연세대학교', major: '교육학과 4학년', avatar: '🧑‍🏫', bio: '3년간 30개 학교 방문, 레크리에이션 전문 진행자', programs: 3, totalReviews: 38, rating: 4.9, badge: 'TOP 판매자' },
  { id: 's2', name: '에듀테크 스타터', university: 'KAIST', major: '전산학부 졸업', avatar: '👨‍💻', bio: 'AI 교육 스타트업 준비 중, 코딩 교육 경력 2년', programs: 2, totalReviews: 22, rating: 5.0, badge: '신규 판매자' },
  { id: 's3', name: '김서연', university: '홍익대학교', major: '시각디자인학과 3학년', avatar: '👩‍🎨', bio: '디자인씽킹 퍼실리테이터 자격증 보유', programs: 1, totalReviews: 15, rating: 4.8 },
  { id: 's4', name: '박준혁', university: 'POSTECH', major: '수학과 대학원', avatar: '🧑‍🔬', bio: '수학 올림피아드 출신, AI 수학 교육 연구 중', programs: 1, totalReviews: 31, rating: 4.9, badge: '추천 판매자' },
  { id: 's5', name: '최예린', university: '한국예술종합학교', major: '뮤지컬과 2학년', avatar: '👩‍🎤', bio: '학교 순회 공연 50회 이상, 방과후 강사 자격증', programs: 1, totalReviews: 9, rating: 4.7 },
  { id: 's6', name: '정우성', university: '서울대학교', major: '사범대학 4학년', avatar: '🧑‍💼', bio: '학생처 인턴 2년, 리더십 캠프 기획 전문', programs: 1, totalReviews: 18, rating: 4.8 },
]

export const NOTICES: Notice[] = [
  { id: 'n1', category: '공지', title: '링커스 베타 서비스 시작 안내', date: '2025.03.01', isNew: true, content: '안녕하세요, 링커스입니다. 2025년 3월 1일부터 베타 서비스를 정식 시작합니다. 초기 가입 판매자에게는 3개월 수수료 면제 혜택을 드립니다.' },
  { id: 'n2', category: '이벤트', title: '🎉 첫 구매 10% 할인 쿠폰 지급', date: '2025.03.01', isNew: true, content: '3월 한 달간 첫 구매 고객 전원에게 10% 할인 쿠폰을 지급합니다. 카카오 로그인 후 마이페이지에서 확인하세요.' },
  { id: 'n3', category: '업데이트', title: '결제 수단 추가 — 토스페이 지원', date: '2025.02.20', content: '이제 토스페이로도 결제가 가능합니다. 카카오페이, 신용카드에 이어 세 번째 결제 수단이 추가되었습니다.' },
  { id: 'n4', category: '공지', title: '판매자 정산 정책 안내', date: '2025.02.15', content: '구매 확정 후 7영업일 이내에 등록하신 계좌로 정산금이 입금됩니다. 플랫폼 수수료는 10%입니다.' },
  { id: 'n5', category: '공지', title: '프로그램 등록 검수 기간 안내', date: '2025.02.10', content: '프로그램 등록 후 검수는 영업일 기준 2-3일 소요됩니다. 자료 파일 첨부가 완료된 경우 더 빠른 승인이 가능합니다.' },
]
