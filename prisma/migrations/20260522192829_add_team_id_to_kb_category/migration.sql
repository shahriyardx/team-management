-- AlterTable
ALTER TABLE "kb_category" ADD COLUMN     "teamId" TEXT;

-- CreateIndex
CREATE INDEX "kb_category_teamId_idx" ON "kb_category"("teamId");

-- AddForeignKey
ALTER TABLE "kb_category" ADD CONSTRAINT "kb_category_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
