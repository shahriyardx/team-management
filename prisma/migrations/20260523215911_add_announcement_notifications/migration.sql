-- AlterTable
ALTER TABLE "notification" ADD COLUMN     "announcementId" TEXT;

-- CreateIndex
CREATE INDEX "notification_announcementId_idx" ON "notification"("announcementId");

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
