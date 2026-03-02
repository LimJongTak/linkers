import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Seeding...')

  // 관리자 계정
  const admin = await db.user.upsert({
    where: { email: 'admin@linkers.kr' },
    update: {},
    create: {
      email: 'admin@linkers.kr',
      nickname: '링커스 관리자',
      role: 'admin',
      oauth_provider: 'kakao',
      oauth_id: 'admin-seed-001',
    },
  })

  // 테스트 판매자
  const seller = await db.user.upsert({
    where: { email: 'seller@test.com' },
    update: {},
    create: {
      email: 'seller@test.com',
      nickname: '이민준',
      role: 'seller',
      oauth_provider: 'kakao',
      oauth_id: 'seller-seed-001',
      phone: '01012345678',
    },
  })

  // 테스트 구매자
  const buyer = await db.user.upsert({
    where: { email: 'buyer@test.com' },
    update: {},
    create: {
      email: 'buyer@test.com',
      nickname: '박지수',
      role: 'buyer',
      oauth_provider: 'kakao',
      oauth_id: 'buyer-seed-001',
      phone: '01087654321',
    },
  })

  // 샘플 프로그램
  const program = await db.program.upsert({
    where: { id: 'seed-program-001' },
    update: {},
    create: {
      id: 'seed-program-001',
      seller_id: seller.id,
      title: '마음을 잇는 레크리에이션',
      subtitle: '아이스브레이킹 & 팀빌딩 워크샵',
      category: '레크리에이션',
      target_levels: ['초등', '중등'],
      region: ['서울', '경기', '인천'],
      price: 150000,
      description: '3년간 30회 이상 현장 검증된 레크리에이션 커리큘럼입니다.',
      status: 'active',
      duration: '2시간',
      max_participants: 40,
      tags: ['팀빌딩', '소통', '아이스브레이킹'],
      rating_avg: 4.9,
      review_count: 38,
    },
  })

  // 샘플 파일
  await db.programFile.upsert({
    where: { id: 'seed-file-001' },
    update: {},
    create: {
      id: 'seed-file-001',
      program_id: program.id,
      file_name: '레크리에이션_진행가이드.pdf',
      s3_key: 'programs/seed-program-001/guide.pdf',
      file_size: BigInt(3_200_000),
      file_type: 'pdf',
      is_preview: false,
    },
  })

  await db.programFile.upsert({
    where: { id: 'seed-file-preview-001' },
    update: {},
    create: {
      id: 'seed-file-preview-001',
      program_id: program.id,
      file_name: '미리보기_샘플.pdf',
      s3_key: 'programs/seed-program-001/preview.pdf',
      file_size: BigInt(800_000),
      file_type: 'pdf',
      is_preview: true,
    },
  })

  console.log('✅ Seed 완료')
  console.log(`  관리자: ${admin.email}`)
  console.log(`  판매자: ${seller.email}`)
  console.log(`  구매자: ${buyer.email}`)
  console.log(`  프로그램: ${program.title}`)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
