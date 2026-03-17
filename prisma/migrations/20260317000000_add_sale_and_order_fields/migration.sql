-- AlterTable: programs에 세일 필드 추가 (이미 존재하면 무시)
ALTER TABLE "programs"
  ADD COLUMN IF NOT EXISTS "sale_price" INTEGER,
  ADD COLUMN IF NOT EXISTS "sale_start_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "sale_end_at" TIMESTAMP(3);

-- AlterTable: orders에 판매자 금액 및 쿠폰 할인 필드 추가 (이미 존재하면 무시)
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "seller_amount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "coupon_discount" INTEGER NOT NULL DEFAULT 0;
