-- AlterTable
ALTER TABLE "invitation" ADD COLUMN     "teamId" TEXT;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
