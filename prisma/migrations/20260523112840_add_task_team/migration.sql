-- AlterTable
ALTER TABLE "task" ADD COLUMN     "teamId" TEXT;

-- CreateIndex
CREATE INDEX "task_teamId_idx" ON "task"("teamId");

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
