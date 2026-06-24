-- AlterTable
ALTER TABLE "Product" ADD COLUMN "is_favorite" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Product_is_favorite_idx" ON "Product"("is_favorite");
