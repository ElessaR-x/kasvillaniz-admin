-- AlterTable
ALTER TABLE "Villa" ADD COLUMN     "amenities" JSONB,
ADD COLUMN     "discount" TEXT,
ADD COLUMN     "rating" DOUBLE PRECISION,
ADD COLUMN     "reviews" INTEGER,
ADD COLUMN     "size" TEXT,
ADD COLUMN     "tags" TEXT[];
