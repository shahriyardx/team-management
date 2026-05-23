-- AlterTable
ALTER TABLE "notification" ADD COLUMN     "kbItemId" TEXT;

-- CreateIndex
CREATE INDEX "notification_kbItemId_idx" ON "notification"("kbItemId");

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_kbItemId_fkey" FOREIGN KEY ("kbItemId") REFERENCES "kb_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
