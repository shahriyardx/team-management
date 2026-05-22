-- DropForeignKey
ALTER TABLE "objective" DROP CONSTRAINT "objective_ownerId_fkey";

-- AlterTable
ALTER TABLE "kb_item" ADD COLUMN     "teamId" TEXT;

-- CreateIndex
CREATE INDEX "kb_item_teamId_idx" ON "kb_item"("teamId");

-- AddForeignKey
ALTER TABLE "objective" ADD CONSTRAINT "objective_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kb_item" ADD CONSTRAINT "kb_item_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
