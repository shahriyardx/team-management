-- DropForeignKey
ALTER TABLE "invitation" DROP CONSTRAINT "invitation_teamId_fkey";

-- DropForeignKey
ALTER TABLE "objective" DROP CONSTRAINT "objective_teamId_fkey";

-- DropForeignKey
ALTER TABLE "task" DROP CONSTRAINT "task_teamId_fkey";

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objective" ADD CONSTRAINT "objective_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
