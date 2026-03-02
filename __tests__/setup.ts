import { db } from '@/lib/db'

process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-chars-xxxxxxxxxx'
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-minimum-32-chars-xxxxxxxx'
process.env.PORTONE_API_SECRET = 'test-portone-secret'
process.env.AWS_REGION = 'ap-northeast-2'
process.env.AWS_S3_BUCKET = 'test-bucket'

beforeEach(async () => {
  await db.$transaction([
    db.signedUrlLog.deleteMany(),
    db.downloadPermission.deleteMany(),
    db.payment.deleteMany(),
    db.settlement.deleteMany(),
    db.review.deleteMany(),
    db.order.deleteMany(),
    db.programFile.deleteMany(),
    db.program.deleteMany(),
    db.user.deleteMany(),
  ])
})

afterAll(async () => {
  await db.$disconnect()
})
