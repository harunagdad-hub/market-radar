-- AlterTable
ALTER TABLE "Address" ALTER COLUMN "latitude" DROP NOT NULL,
ALTER COLUMN "longitude" DROP NOT NULL;

-- AlterTable
ALTER TABLE "MarketBranch" ALTER COLUMN "latitude" DROP NOT NULL,
ALTER COLUMN "longitude" DROP NOT NULL;
