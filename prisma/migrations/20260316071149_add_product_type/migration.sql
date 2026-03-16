-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('file_product', 'class');

-- AlterTable
ALTER TABLE "programs" ADD COLUMN     "file_format" TEXT,
ADD COLUMN     "page_count" INTEGER,
ADD COLUMN     "preview_url" TEXT,
ADD COLUMN     "product_type" "ProductType" NOT NULL DEFAULT 'file_product',
ALTER COLUMN "duration" DROP NOT NULL;
