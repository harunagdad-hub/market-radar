/*
  Warnings:

  - You are about to drop the column `productId` on the `Price` table. All the data in the column will be lost.
  - Added the required column `listingId` to the `Price` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Price" DROP CONSTRAINT "Price_productId_fkey";

-- DropIndex
DROP INDEX "Price_productId_branchId_idx";

-- DropIndex
DROP INDEX "Price_productId_idx";

-- AlterTable
ALTER TABLE "Price" DROP COLUMN "productId",
ADD COLUMN     "listingId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "ProductListing" (
    "id" SERIAL NOT NULL,
    "chainId" INTEGER NOT NULL,
    "sourceSku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "unit" TEXT,
    "imageUrl" TEXT,
    "productId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductListing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductListing_productId_idx" ON "ProductListing"("productId");

-- CreateIndex
CREATE INDEX "ProductListing_name_idx" ON "ProductListing"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductListing_chainId_sourceSku_key" ON "ProductListing"("chainId", "sourceSku");

-- CreateIndex
CREATE INDEX "Price_listingId_branchId_validFrom_idx" ON "Price"("listingId", "branchId", "validFrom" DESC);

-- AddForeignKey
ALTER TABLE "Price" ADD CONSTRAINT "Price_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "ProductListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductListing" ADD CONSTRAINT "ProductListing_chainId_fkey" FOREIGN KEY ("chainId") REFERENCES "MarketChain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductListing" ADD CONSTRAINT "ProductListing_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
