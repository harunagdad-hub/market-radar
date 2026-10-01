/*
  Warnings:

  - A unique constraint covering the columns `[source,sourceId]` on the table `MarketBranch` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "MarketBranch" ADD COLUMN     "source" TEXT,
ADD COLUMN     "sourceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "MarketBranch_source_sourceId_key" ON "MarketBranch"("source", "sourceId");
