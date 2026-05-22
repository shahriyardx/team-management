-- AlterTable: make ownerId nullable, add teamId
ALTER TABLE "objective" ALTER COLUMN "ownerId" DROP NOT NULL;
ALTER TABLE "objective" ADD COLUMN "teamId" TEXT;

-- AddForeignKey for teamId
ALTER TABLE "objective" ADD CONSTRAINT "objective_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddIndex
CREATE INDEX IF NOT EXISTS "objective_teamId_idx" ON "objective"("teamId");
