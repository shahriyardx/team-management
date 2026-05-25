-- AlterTable
ALTER TABLE "organization" ADD COLUMN     "storageUsed" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "announcement" DROP COLUMN "thumbnail";

-- AlterTable
ALTER TABLE "announcement_attachment" ADD COLUMN     "isThumbnail" BOOLEAN NOT NULL DEFAULT false;
